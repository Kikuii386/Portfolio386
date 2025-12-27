import { NextResponse } from 'next/server';
import { getSheetKPIs } from '@/lib/getSheetKPIs';

export const dynamic = 'force-dynamic'; // ให้ดึงข้อมูลใหม่เสมอ

export async function GET() {
  try {
    const data = await getSheetKPIs();
    return NextResponse.json(data);
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}