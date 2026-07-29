import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stats = await db.systemStat.findUnique({
      where: { id: 'singleton' },
    });

    return NextResponse.json({
      success: true,
      count: stats?.visitorCount ?? 0,
    });
  } catch (error) {
    console.error('Fetch visitor count error:', error);
    return NextResponse.json({ success: true, count: 0 });
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
      const stats = await db.systemStat.findUnique({
        where: { id: 'singleton' },
      });

      return NextResponse.json({
        success: true,
        newVisitor: false,
        count: stats?.visitorCount ?? 0,
      });
    }

    // 2. New device -> Try registering unique device ID
    await db.uniqueVisitor.create({
      data: { id: deviceId },
    }).catch(() => {});

    // 3. Increment system_stats visitor_count
    const stats = await db.systemStat.upsert({
      where: { id: 'singleton' },
      update: { visitorCount: { increment: 1 } },
      create: { id: 'singleton', visitorCount: 1 },
    });

    const response = NextResponse.json({
      success: true,
      newVisitor: true,
      count: stats.visitorCount,
    });

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
    return NextResponse.json({ success: true, newVisitor: false, count: 0 });
  }
}



