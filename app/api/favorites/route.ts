import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-change-me'
);

// ดึง URL ของ Backend Node.js จาก .env
const BACKEND_URL = process.env.BACKEND_API_URL?.replace('/auth/check-email', '');

// ฟังก์ชันช่วยดึง Email จาก Cookie
async function getUserEmailFromCookie() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.email as string;
    } catch (error) {
        return null;
    }
}

// 🟢 GET: ดึงรายการโปรด
export async function GET() {
    const email = await getUserEmailFromCookie();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const res = await fetch(`${BACKEND_URL}/favorites?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }
}

// 🔵 POST: กดเพิ่ม/ลบ ดาว
export async function POST(req: Request) {
    const email = await getUserEmailFromCookie();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { coinId, isFavorite } = body;

        const res = await fetch(`${BACKEND_URL}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, coinId, isFavorite })
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 });
    }
}