const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

function parseArabicNumerals(str) {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => arabicNumerals.indexOf(w).toString());
}

function normalizeArabic(text) {
  if (!text) return '';
  let normalized = text.toString();
  normalized = parseArabicNumerals(normalized);
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  normalized = normalized.replace(/[\u064B-\u0652\u0670]/g, '');
  normalized = normalized.replace(/\u0640/g, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized.toLowerCase();
}

function findColumn(headers, candidates) {
  const normalizedHeaders = headers.map(h => normalizeArabic(h.toString()));
  for (const candidate of candidates) {
    const normCandidate = normalizeArabic(candidate);
    const index = normalizedHeaders.findIndex(h => h.includes(normCandidate));
    if (index !== -1) {
      return headers[index];
    }
  }
  return undefined;
}

async function seedFull() {
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  const excelFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));

  if (!excelFile) {
    console.error('No Excel file found in project folder!');
    return;
  }

  const filePath = path.join(rootDir, excelFile);
  console.log('Reading full Excel file:', filePath);

  const startTime = Date.now();
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`Total raw rows read from Excel: ${rawRows.length}`);

  if (rawRows.length === 0) {
    console.log('No rows found in Excel');
    return;
  }

  const headers = Object.keys(rawRows[0]);
  console.log('Detected headers:', headers);

  const nameCol = findColumn(headers, ['arabic_name', 'name', 'اسم', 'الاسم', 'اسم الطالب', 'الاسم بالكامل']) || headers[1];
  const seatCol = findColumn(headers, ['seating_no', 'seat', 'seat number', 'seat_number', 'رقم الجلوس', 'جلوس', 'رقم_الجلوس']) || headers[0];
  const resultCol = findColumn(headers, ['student_case_desc', 'result', 'status', 'النتيجة', 'النتيجه', 'حالة الطالب', 'القرار']) || headers[3];
  const percentageCol = findColumn(headers, ['presentage', 'percentage', 'percent', '%', 'النسبة المئوية', 'النسبه', 'المجموع النسبي', 'النسبة']) || headers[4];

  console.log(`Mapped columns -> Name: "${nameCol}", Seat: "${seatCol}", Result: "${resultCol}", Percentage: "${percentageCol}"`);

  // Clear existing
  console.log('Clearing existing results table...');
  await prisma.studentResult.deleteMany({});

  const validRecords = [];
  let invalidCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const name = String(row[nameCol] || '').trim();
    const seatNumber = parseArabicNumerals(String(row[seatCol] || '').trim());
    const result = String(row[resultCol] || '').trim() || 'ناجح';
    
    let rawPct = row[percentageCol];
    let percentage = 0;
    if (typeof rawPct === 'number') {
      percentage = rawPct > 0 && rawPct <= 1 ? Math.round(rawPct * 10000) / 100 : Math.round(rawPct * 100) / 100;
    } else if (rawPct !== null && rawPct !== undefined && rawPct !== '') {
      const num = parseFloat(parseArabicNumerals(String(rawPct).replace('%', '')));
      percentage = isNaN(num) ? 0 : (num > 0 && num <= 1 ? Math.round(num * 10000) / 100 : Math.round(num * 100) / 100);
    }

    if (name && seatNumber) {
      validRecords.push({
        name,
        normalizedName: normalizeArabic(name),
        seatNumber,
        result,
        percentage,
      });
    } else {
      invalidCount++;
    }
  }

  console.log(`Valid records prepared for insertion: ${validRecords.length} (Skipped/Invalid: ${invalidCount})`);

  // Batch insert in chunks of 5,000
  const chunkSize = 5000;
  const totalChunks = Math.ceil(validRecords.length / chunkSize);

  for (let i = 0; i < validRecords.length; i += chunkSize) {
    const chunk = validRecords.slice(i, i + chunkSize);
    await prisma.studentResult.createMany({ data: chunk });
    const currentChunk = Math.floor(i / chunkSize) + 1;
    if (currentChunk % 10 === 0 || currentChunk === totalChunks) {
      console.log(`Inserted batch ${currentChunk} / ${totalChunks} (${Math.min(i + chunkSize, validRecords.length)} / ${validRecords.length} records)`);
    }
  }

  await prisma.systemStat.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      lastImportedFile: excelFile,
      lastImportDate: new Date(),
    },
    update: {
      lastImportedFile: excelFile,
      lastImportDate: new Date(),
    },
  });

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`🎉 Full Seeding completed successfully in ${durationSec} seconds! Total Students imported: ${validRecords.length}`);
  await prisma.$disconnect();
}

seedFull().catch((err) => {
  console.error('Full Seeding failed:', err);
  prisma.$disconnect();
});
