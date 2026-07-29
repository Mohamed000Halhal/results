import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const topStudents = await db.studentResult.findMany({
      take: 20,
      orderBy: [
        { percentage: 'desc' },
        { seatNumber: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        seatNumber: true,
        result: true,
        percentage: true,
      },
    });

    return NextResponse.json({
      success: true,
      students: topStudents,
    });
  } catch (error) {
    console.error('Top students API error:', error);
    return NextResponse.json({
      success: true,
      students: [],
    });
  }
}

