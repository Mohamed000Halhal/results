import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword, createAdminToken, COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 login attempts per minute per IP
  const rate = checkRateLimit(request, 5, 60 * 1000);
  if (!rate.success) {
    return NextResponse.json(
      { error: 'تجاوزت عدد محاولات الدخول المسموح بها. يرجى الانتظار دقيقة' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string' || password.length > 100) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }


    const token = createAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
