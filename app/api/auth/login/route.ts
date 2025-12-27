// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { SignJWT } from 'jose';
import { isEmailAllowed } from '@/lib/auth';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
// Secret สำหรับสร้าง Session ของเว็บเรา (ตั้งเองใน .env)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-me'
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body; // รับ Access Token จากหน้าบ้าน

    if (!token)
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });

    // ✅ 1. แบบใหม่: เอา Access Token ไปถาม Google UserInfo API โดยตรง
    // (วิธีนี้ใช้ได้กับปุ่ม Custom ที่เราออกแบบเอง)
    const googleRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { error: 'Invalid Google Token' },
        { status: 401 }
      );
    }

    const googleUser = await googleRes.json();
    const email = googleUser.email;
    const name = googleUser.name;
    const picture = googleUser.picture;

    console.log(`🔑 Login attempt: ${email}`);

    // 2. เช็คสิทธิ์ผ่าน Tunnel (Database) เหมือนเดิม
    const allowed = await isEmailAllowed(email);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Access Denied: Email not authorized' },
        { status: 403 }
      );
    }

    // 3. สร้าง Session Cookie (JWT)
    const sessionToken = await new SignJWT({ email, name, picture })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: { email, name },
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 วัน
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login System Error:', error.message);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
