import * as XLSX from 'xlsx';
import { normalizeArabic, parseArabicNumerals } from './arabic';

export interface ParsedRow {
  name: string;
  seatNumber: string;
  result: string;
  percentage: number; // e.g. 82.5
}

export interface ValidationError {
  rowNumber: number;
  rawRowData: Record<string, unknown>;
  reason: string;
}

export interface ParseResult {
  validRecords: ParsedRow[];
  invalidRows: ValidationError[];
  detectedColumns: {
    nameCol?: string;
    seatCol?: string;
    resultCol?: string;
    percentageCol?: string;
  };
  totalRows: number;
}

/**
 * Finds the best matching column name based on a set of keywords.
 */
function findColumn(headers: string[], candidates: string[]): string | undefined {
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

/**
 * Normalizes percentage values into standard percentage numbers (e.g. 82.5).
 */
function parsePercentage(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  
  if (typeof val === 'number') {
    if (val > 0 && val <= 1) {
      return Math.round(val * 10000) / 100;
    }
    return Math.round(val * 100) / 100;
  }

  const str = parseArabicNumerals(val.toString().trim().replace('%', ''));
  const num = parseFloat(str);
  if (isNaN(num)) return null;

  if (num > 0 && num <= 1) {
    return Math.round(num * 10000) / 100;
  }
  return Math.round(num * 100) / 100;
}

/**
 * Parses buffer of Excel file and validates headers and rows.
 */
export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return {
      validRecords: [],
      invalidRows: [],
      detectedColumns: {},
      totalRows: 0,
    };
  }

  // Detect Headers
  const headers = Object.keys(rawRows[0]);
  const nameCol = findColumn(headers, ['name', 'اسم', 'الاسم', 'اسم الطالب', 'الاسم بالكامل', 'arabic_name']);
  const seatCol = findColumn(headers, ['seat', 'seat number', 'seat_number', 'seating_no', 'رقم الجلوس', 'جلوس', 'رقم_الجلوس']);
  const resultCol = findColumn(headers, ['result', 'status', 'النتيجة', 'النتيجه', 'حالة الطالب', 'القرار', 'student_case_desc']);
  const percentageCol = findColumn(headers, ['percentage', 'percent', '%', 'النسبة المئوية', 'النسبه', 'المجموع النسبي', 'النسبة', 'presentage']);

  const validRecords: ParsedRow[] = [];
  const invalidRows: ValidationError[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;

    const rawName = nameCol ? String(row[nameCol] ?? '').trim() : '';
    const rawSeat = seatCol ? parseArabicNumerals(String(row[seatCol] ?? '').trim()) : '';
    const rawResult = resultCol ? String(row[resultCol] ?? '').trim() : '';
    const rawPercentageVal = percentageCol ? row[percentageCol] : null;

    if (!rawName) {
      invalidRows.push({
        rowNumber,
        rawRowData: row,
        reason: 'اسم الطالب مفقود',
      });
      return;
    }

    if (!rawSeat) {
      invalidRows.push({
        rowNumber,
        rawRowData: row,
        reason: 'رقم الجلوس مفقود',
      });
      return;
    }

    const percentage = parsePercentage(rawPercentageVal);
    if (percentage === null) {
      invalidRows.push({
        rowNumber,
        rawRowData: row,
        reason: 'النسبة المئوية غير صالحة أو مفقودة',
      });
      return;
    }

    validRecords.push({
      name: rawName,
      seatNumber: rawSeat,
      result: rawResult || 'ناجح',
      percentage,
    });
  });

  return {
    validRecords,
    invalidRows,
    detectedColumns: {
      nameCol,
      seatCol,
      resultCol,
      percentageCol,
    },
    totalRows: rawRows.length,
  };
}
