const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

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

async function seed() {
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  const excelFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));

  if (!excelFile) {
    console.error('No Excel file found in project folder!');
    return;
  }

  const filePath = path.join(rootDir, excelFile);
  console.log('Reading Excel file:', filePath);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`Total raw rows read: ${rawRows.length}`);

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
  await prisma.studentResult.deleteMany({});

  const validRecords = [];
  // Seed first 20,000 students for fast initial loading
  const limitRows = Math.min(rawRows.length, 20000);
  for (let i = 0; i < limitRows; i++) {
    const row = rawRows[i];
    const name = String(row[nameCol] || '').trim();
    const seatNumber = parseArabicNumerals(String(row[seatCol] || '').trim());
    const result = String(row[resultCol] || '').trim() || 'ناجح';
    
    let rawPct = row[percentageCol];
    let percentage = 0;
    if (typeof rawPct === 'number') {
      percentage = rawPct > 0 && rawPct <= 1 ? Math.round(rawPct * 10000) / 100 : Math.round(rawPct * 100) / 100;
    } else {
      const num = parseFloat(parseArabicNumerals(String(rawPct || '0').replace('%', '')));
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
    }
  }

  console.log(`Valid records prepared: ${validRecords.length}`);

  // Batch insert in chunks of 2000
  const chunkSize = 2000;
  for (let i = 0; i < validRecords.length; i += chunkSize) {
    const chunk = validRecords.slice(i, i + chunkSize);
    await prisma.studentResult.createMany({ data: chunk });
    console.log(`Inserted batch ${Math.floor(i / chunkSize) + 1} / ${Math.ceil(validRecords.length / chunkSize)}`);
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

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  prisma.$disconnect();
});
