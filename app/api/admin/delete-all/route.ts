import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    await db.studentResult.deleteMany({});
    
    await db.systemStat.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', lastImportedFile: null, lastImportDate: null },
      update: { lastImportedFile: null, lastImportDate: null },
    });

    return NextResponse.json({
      success: true,
      message: 'تم مسح جميع النتائج من قاعدة البيانات بنجاح',
    });
  } catch (error) {
    console.error('Delete all error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء مسح قاعدة البيانات' },
      { status: 500 }
    );
  }
}
