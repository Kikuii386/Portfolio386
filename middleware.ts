// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-me'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ดึง Token และเช็คความถูกต้อง
  const token = request.cookies.get('session_token')?.value;
  let isValidToken = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValidToken = true;
    } catch (err) {
      console.log('Token invalid:', err);
    }
  }

  // ==========================================
  //  🛡️ โซนคนมี Token (ล็อกอินแล้ว)
  // ==========================================
  if (isValidToken) {
    // ถ้าล็อกอินแล้ว แต่อยากกลับไปหน้า Login (/) -> ดีดไป Dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // ถ้าไปหน้าอื่น (Dashboard, Profile) -> ปล่อยผ่านโลด
    return NextResponse.next();
  }

  // ==========================================
  //  ⛔ โซนคนไม่มี Token (ยังไม่ล็อกอิน)
  // ==========================================

  // เช็คว่าเป็นไฟล์ที่ต้องปล่อยผ่านไหม (รูปภาพ, API Login, System Files)
  // ⚠️ สังเกตว่าผมเอา '/' ออกจากตรงนี้ เพื่อไม่ให้มันเหมารวม
  const isPublicPath =
    pathname.startsWith('/api/auth') || // ให้ยิง API Login ได้
    pathname.startsWith('/_next') || // ให้โหลดไฟล์ Next.js ได้
    pathname.startsWith('/static') || // ให้โหลดรูป static ได้
    pathname.includes('.') || // ให้โหลดไฟล์นามสกุลต่างๆ (favicon.ico, logo.png) ได้
    pathname === '/'; // ให้เข้าหน้า Login (หน้าแรก) ได้

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 🛑 ถ้าไม่ใช่ไฟล์สาธารณะ และไม่มี Token -> ดีดกลับไปหน้า Login
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  // บังคับให้ Middleware ทำงานกับทุก Route (ยกเว้นไฟล์ static บางตัว)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
