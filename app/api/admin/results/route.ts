import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { normalizeArabic } from '@/lib/arabic';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '25', 10));

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
      }).catch(() => []),
      db.studentResult.count({ where: whereClause }).catch(() => 0),
    ]);

    return NextResponse.json({
      results: results || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Fetch results error:', error);
    return NextResponse.json({
      results: [],
      pagination: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
      },
    });
  }
}



export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, seatNumber, result, percentage } = body;

    if (!name || !seatNumber) {
      return NextResponse.json(
        { error: 'الاسم ورقم الجلوس مطلوبان' },
        { status: 400 }
      );
    }

    const newStudent = await db.studentResult.create({
      data: {
        name: String(name).trim(),
        normalizedName: normalizeArabic(String(name)),
        seatNumber: String(seatNumber).trim(),
        result: String(result || 'ناجح').trim(),
        percentage: Number(percentage || 0),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الطالب بنجاح إلى Supabase',
      student: newStudent,
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إضافة الطالب' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, seatNumber, result, percentage } = body;

    if (!id || !name || !seatNumber) {
      return NextResponse.json(
        { error: 'جميع البيانات والـ ID مطلوبة' },
        { status: 400 }
      );
    }

    const updatedStudent = await db.studentResult.update({
      where: { id },
      data: {
        name: String(name).trim(),
        normalizedName: normalizeArabic(String(name)),
        seatNumber: String(seatNumber).trim(),
        result: String(result || 'ناجح').trim(),
        percentage: Number(percentage || 0),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تعديل بيانات الطالب بنجاح في Supabase',
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تعديل البيانات' },
      { status: 500 }
    );
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
      message: 'تم حذف الطالب بنجاح من Supabase',
    });
  } catch (error) {
    console.error('Delete result error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
