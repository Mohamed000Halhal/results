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

    // Step 2: Confirm import (JSON request)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { records, mode, fileName } = body as {
        records: ParsedRow[];
        mode: 'replace' | 'append';
        fileName: string;
      };

      if (!Array.isArray(records) || records.length === 0) {
        return NextResponse.json(
          { error: 'لا توجد بيانات صالحة للاستيراد' },
          { status: 400 }
        );
      }

      // If mode === 'replace', wipe existing results
      if (mode === 'replace') {
        await db.studentResult.deleteMany({});
      }

      // Prepare db records with normalizedName
      const preparedRecords = records.map(r => ({
        name: r.name,
        normalizedName: normalizeArabic(r.name),
        seatNumber: String(r.seatNumber).trim(),
        result: r.result,
        percentage: r.percentage,
      }));

      // Insert in chunks of 1000 for SQLite optimization
      const chunkSize = 1000;
      for (let i = 0; i < preparedRecords.length; i += chunkSize) {
        const chunk = preparedRecords.slice(i, i + chunkSize);
        await db.studentResult.createMany({
          data: chunk,
        });
      }

      // Update System Stats
      await db.systemStat.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          lastImportedFile: fileName || 'file.xlsx',
          lastImportDate: new Date(),
        },
        update: {
          lastImportedFile: fileName || 'file.xlsx',
          lastImportDate: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        importedCount: preparedRecords.length,
        message: `تم استيراد ${preparedRecords.length} نتيجة بنجاح!`,
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
