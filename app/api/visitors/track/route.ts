import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stat = await db.systemStat.findUnique({
      where: { id: 'singleton' },
      select: { visitorCount: true },
    });

    return NextResponse.json({
      success: true,
      count: stat?.visitorCount || 0,
    });
  } catch (error) {
    console.error('Fetch visitor count error:', error);
    return NextResponse.json({ success: false, count: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const deviceId = body.deviceId || request.cookies.get('unique_device_id')?.value;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    // 1. Check if device has visited before
    const existing = await db.uniqueVisitor.findUnique({
      where: { id: deviceId },
    });

    if (existing) {
      // Device already counted before -> Do NOT increment
      const stat = await db.systemStat.findUnique({
        where: { id: 'singleton' },
        select: { visitorCount: true },
      });

      const response = NextResponse.json({
        success: true,
        newVisitor: false,
        count: stat?.visitorCount || 0,
      });

      return response;
    }

    // 2. New device -> Register and increment unique visitor count
    await db.uniqueVisitor.create({
      data: { id: deviceId },
    });

    const updatedStat = await db.systemStat.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', visitorCount: 1 },
      update: { visitorCount: { increment: 1 } },
      select: { visitorCount: true },
    });

    const response = NextResponse.json({
      success: true,
      newVisitor: true,
      count: updatedStat.visitorCount,
    });

    // Set 10-year cookie for device uniqueness tracking
    response.cookies.set({
      name: 'unique_device_id',
      value: deviceId,
      maxAge: 60 * 60 * 24 * 365 * 10,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Visitor tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
