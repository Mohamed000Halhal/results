import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const totalStudents = await db.studentResult.count();

    // Students with result containing 'ناجح' or 'passed'
    const passedStudents = await db.studentResult.count({
      where: {
        OR: [
          { result: { contains: 'ناجح' } },
          { result: { contains: 'passed' } },
          { result: { contains: 'Passed' } },
        ],
      },
    });

    const failedStudents = totalStudents - passedStudents;

    const sysStat = await db.systemStat.findUnique({
      where: { id: 'singleton' },
    });

    return NextResponse.json({
      totalStudents,
      passedStudents,
      failedStudents,
      passedPercentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 1000) / 10 : 0,
      lastImportDate: sysStat?.lastImportDate || null,
      lastImportedFile: sysStat?.lastImportedFile || null,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب البيانات' }, { status: 500 });
  }
}
