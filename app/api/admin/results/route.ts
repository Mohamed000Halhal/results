import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { normalizeArabic } from '@/lib/arabic';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const skip = (page - 1) * limit;

    const whereClause = query
      ? {
          OR: [
            { seatNumber: { contains: query } },
            { normalizedName: { contains: normalizeArabic(query) } },
          ],
        }
      : {};

    const [results, total] = await Promise.all([
      db.studentResult.findMany({
        where: whereClause,
        orderBy: { seatNumber: 'asc' },
        skip,
        take: limit,
      }),
      db.studentResult.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch results error:', error);
    return NextResponse.json({
      results: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  }
}


export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف النتيجة مفقود' },
        { status: 400 }
      );
    }

    await db.studentResult.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الطالب بنجاح',
    });
  } catch (error) {
    console.error('Delete result error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
