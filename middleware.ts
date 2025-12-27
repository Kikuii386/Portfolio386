// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-me'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. กำหนด Public Paths (หน้านี้เข้าได้โดยไม่ต้องล็อกอิน)
  // เพิ่ม '/' เข้าไป เพราะหน้า Login อยู่ที่ root แล้ว
  const publicPaths = [
    '/',
    '/api/auth/login',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/public',
  ];

  // เช็ค Token
  const token = request.cookies.get('session_token')?.value;
  let isValidToken = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValidToken = true;
    } catch (err) {
      // Token หมดอายุหรือปลอม
    }
  }

  // 2. Logic: ถ้าล็อกอินแล้ว (มี Token) แต่พยายามเข้าหน้า Login (/) -> ดีดไป Dashboard
  if (isValidToken && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Logic: ถ้าเป็น Public Path (เช่น รูปภาพ, API Login) ปล่อยผ่าน
  if (
    publicPaths.some((path) => pathname.startsWith(path)) &&
    pathname !== '/'
  ) {
    return NextResponse.next();
  }

  // 4. Logic: ถ้าไม่มี Token และไม่ได้เข้าหน้า Login (/) -> ดีดกลับมาหน้า Login (/)
  if (!isValidToken && pathname !== '/') {
    // แก้จาก /login เป็น /
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
