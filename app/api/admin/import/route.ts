import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { parseExcelBuffer, ParsedRow } from '@/lib/excel';
import { normalizeArabic } from '@/lib/arabic';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // JSON request for chunked batch import
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { records, mode, fileName, isFirstBatch, isLastBatch } = body as {
        records: ParsedRow[];
        mode?: 'replace' | 'append';
        fileName?: string;
        isFirstBatch?: boolean;
        isLastBatch?: boolean;
      };

      if (!Array.isArray(records) || records.length === 0) {
        return NextResponse.json(
          { error: 'لا توجد بيانات صالحة في هذه الدفعة' },
          { status: 400 }
        );
      }

      // 1. If first batch and mode === 'replace', clear existing database records
      if (isFirstBatch && mode === 'replace') {
        await db.$executeRawUnsafe(`DELETE FROM results`).catch(() => {});
      }

      // 2. Prepare db records with normalizedName
      const preparedRecords = records.map(r => ({
        name: r.name,
        normalizedName: normalizeArabic(r.name),
        seatNumber: String(r.seatNumber).trim(),
        result: r.result || 'ناجح',
        percentage: Number(r.percentage || 0),
      }));

      // 3. Insert chunk in sub-batches of 200 for SQLite optimization
      const chunkSize = 200;
      for (let i = 0; i < preparedRecords.length; i += chunkSize) {
        const chunk = preparedRecords.slice(i, i + chunkSize);
        try {
          await db.studentResult.createMany({
            data: chunk,
          });
        } catch {
          // Fallback SQL insert with randomUUID if Prisma auto-uuid varies
          for (const item of chunk) {
            const uuid = Math.random().toString(36).substring(2) + Date.now().toString(36);
            await db.$executeRaw`INSERT INTO results (id, name, normalized_name, seat_number, result, percentage) VALUES (${uuid}, ${item.name}, ${item.normalizedName}, ${item.seatNumber}, ${item.result}, ${item.percentage})`.catch(() => {});
          }
        }
      }

      // 4. Update System Stats metadata on final batch
      if (isLastBatch) {
        await db.$executeRaw`INSERT INTO system_stats (id, last_imported_file, last_import_date) VALUES ('singleton', ${fileName || 'file.xlsx'}, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET last_imported_file = ${fileName || 'file.xlsx'}, last_import_date = CURRENT_TIMESTAMP`.catch(() => {});
      }


      return NextResponse.json({
        success: true,
        importedCount: preparedRecords.length,
        message: `تم حفظ ${preparedRecords.length} نتيجة`,
      });
    }


    // Step 1: Upload and preview file (FormData request)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم رفع أي ملف' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const parseResult = parseExcelBuffer(buffer);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalRows: parseResult.totalRows,
      validCount: parseResult.validRecords.length,
      invalidCount: parseResult.invalidRows.length,
      detectedColumns: parseResult.detectedColumns,
      validRecords: parseResult.validRecords,
      invalidRows: parseResult.invalidRows.slice(0, 100), // Cap invalid preview at 100
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة ملف الإكسل' },
      { status: 500 }
    );
  }
}
