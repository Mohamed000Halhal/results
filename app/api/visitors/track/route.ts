import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const rows: any = await db.$queryRaw`SELECT visitor_count FROM system_stats WHERE id = 'singleton'`;
    const count = rows && rows[0] ? Number(rows[0].visitor_count || 0) : 0;

    return NextResponse.json({
      success: true,
      count,
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
    const existing: any = await db.$queryRaw`SELECT id FROM unique_visitors WHERE id = ${deviceId} LIMIT 1`;

    if (existing && existing.length > 0) {
      // Device already counted before -> Return current count without incrementing
      const stats: any = await db.$queryRaw`SELECT visitor_count FROM system_stats WHERE id = 'singleton'`;
      const currentCount = stats && stats[0] ? Number(stats[0].visitor_count || 0) : 0;

      return NextResponse.json({
        success: true,
        newVisitor: false,
        count: currentCount,
      });
    }

    // 2. New device -> Register unique device ID
    await db.$executeRaw`INSERT INTO unique_visitors (id) VALUES (${deviceId})`;

    // 3. Increment system_stats visitor_count
    await db.$executeRaw`INSERT INTO system_stats (id, visitor_count) VALUES ('singleton', 1) ON CONFLICT(id) DO UPDATE SET visitor_count = visitor_count + 1`;

    const stats: any = await db.$queryRaw`SELECT visitor_count FROM system_stats WHERE id = 'singleton'`;
    const updatedCount = stats && stats[0] ? Number(stats[0].visitor_count || 0) : 1;

    const response = NextResponse.json({
      success: true,
      newVisitor: true,
      count: updatedCount,
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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

