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
 * Also converts raw total scores (e.g. 350 out of 410) into percentage if needed.
 */
function parsePercentage(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  
  if (typeof val === 'number') {
    if (val > 0 && val <= 1) {
      return Math.round(val * 10000) / 100;
    }
    // If score > 100 (e.g. 320 or 390 out of 410 Thanawya total degree)
    if (val > 100 && val <= 410) {
      return Math.round((val / 410) * 10000) / 100;
    }
    return Math.round(val * 100) / 100;
  }

  const str = parseArabicNumerals(val.toString().trim().replace('%', ''));
  const num = parseFloat(str);
  if (isNaN(num)) return null;

  if (num > 0 && num <= 1) {
    return Math.round(num * 10000) / 100;
  }
  if (num > 100 && num <= 410) {
    return Math.round((num / 410) * 10000) / 100;
  }
  return Math.round(num * 100) / 100;
}

/**
 * Extended candidate lists for robust header detection
 */
const NAME_CANDIDATES = ['name', 'اسم', 'الاسم', 'اسم الطالب', 'اسم_الطالب', 'الاسم بالكامل', 'الاسم_بالكامل', 'اسم_طالب', 'اسم الطالب / الطلاب', 'arabic_name', 'student_name', 'full_name', 'الطالب', 'الأسماء'];
const SEAT_CANDIDATES = ['seat', 'seat number', 'seat_number', 'seating_no', 'seating_num', 'رقم الجلوس', 'رقم_الجلوس', 'جلوس', 'الجلوس', 'رقم جلوس', 'رقم_جلوس', 'كود الطالب', 'كود_الطالب', 'رقم الطالب', 'رقم_الطالب', 'id', 'code'];
const RESULT_CANDIDATES = ['result', 'status', 'النتيجة', 'النتيجه', 'حالة الطالب', 'حالة_الطالب', 'حاله الطالب', 'القرار', 'حالة', 'حاله', 'student_case_desc', 'حالة الطالب/الطلاب', 'الحالة', 'الحاله', 'التقدير'];
const PERCENTAGE_CANDIDATES = ['percentage', 'percent', '%', 'النسبة المئوية', 'النسبه المئويه', 'النسبة المئوية %', 'النسبة', 'النسبه', 'المجموع النسبي', 'presentage', 'percentage_val', 'grade', 'score', 'المجموع', 'المجموع الكلي', 'المجموع_الكلي', 'درجة', 'درجه', 'الدرجة', 'الدرجه', 'مجموع', 'total_degree', 'total_mark', 'total', 'degree', 'degree_total'];

/**
 * Parses buffer of Excel file and validates headers and rows.
 */
export function parseExcelBuffer(buffer: Buffer | ArrayBuffer | Uint8Array): ParseResult {
  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON objects
  let rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return {
      validRecords: [],
      invalidRows: [],
      detectedColumns: {},
      totalRows: 0,
    };
  }

  // Detect Headers from row 0
  let headers = Object.keys(rawRows[0]);
  let nameCol = findColumn(headers, NAME_CANDIDATES);
  let seatCol = findColumn(headers, SEAT_CANDIDATES);
  let resultCol = findColumn(headers, RESULT_CANDIDATES);
  let percentageCol = findColumn(headers, PERCENTAGE_CANDIDATES);

  // If header detection fails on row 0, check if headers start on subsequent rows (e.g. title rows)
  if (!nameCol && !seatCol) {
    const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    for (let rowIndex = 0; rowIndex < Math.min(rawMatrix.length, 15); rowIndex++) {
      const candidateRow = rawMatrix[rowIndex];
      if (Array.isArray(candidateRow) && candidateRow.length > 0) {
        const rowStrArr = candidateRow.map(c => String(c ?? ''));
        const testName = findColumn(rowStrArr, NAME_CANDIDATES);
        const testSeat = findColumn(rowStrArr, SEAT_CANDIDATES);

        if (testName || testSeat) {
          // Re-parse with this row index as header
          rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: rowIndex, defval: '' });
          if (rawRows.length > 0) {
            headers = Object.keys(rawRows[0]);
            nameCol = findColumn(headers, NAME_CANDIDATES);
            seatCol = findColumn(headers, SEAT_CANDIDATES);
            resultCol = findColumn(headers, RESULT_CANDIDATES);
            percentageCol = findColumn(headers, PERCENTAGE_CANDIDATES);
            break;
          }
        }
      }
    }
  }

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

    // Try parsing percentage; if missing or invalid, default to 0 rather than failing valid student rows
    let percentage = parsePercentage(rawPercentageVal);
    if (percentage === null) {
      percentage = 0;
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
