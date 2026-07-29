import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const percentageStr = searchParams.get('percentage');

    if (!percentageStr) {
      return NextResponse.json({ rank: null }, { status: 400 });
    }

    const percentage = parseFloat(percentageStr);
    if (isNaN(percentage)) {
      return NextResponse.json({ rank: null }, { status: 400 });
    }

    const higherCount = await db.studentResult.count({
      where: { percentage: { gt: percentage } },
    });

    return NextResponse.json({ rank: higherCount + 1 });
  } catch (error) {
    console.error('Rank calculation error:', error);
    return NextResponse.json({ rank: null }, { status: 500 });
  }
}
