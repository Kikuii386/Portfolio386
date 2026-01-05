import { NextResponse } from "next/server";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices } from "@/lib/enrichWithPrices";
import { getFromCache } from "@/lib/redisCache"; // 👈 เพิ่ม import นี้

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ✅ 1. Fast Path: ลองดึงจาก Redis ก่อนเลย (ใช้เวลา < 0.1 วินาที)
    // ข้อมูลนี้คือข้อมูลที่ Cron Job เตรียมไว้ให้
    const cachedData = await getFromCache("sheet:enrichedTokens");
    
    if (cachedData) {
      // ถ้ามีของ ก็ส่งกลับเลย ไม่ต้องไปโหลด Google Sheet
      return NextResponse.json(cachedData);
    }

    // 🐢 2. Slow Path (Fallback): ถ้า Redis ว่างเปล่าจริงๆ ค่อยยอมโหลดช้า
    console.log("⚠️ Cache miss, fetching from Google Sheets...");
    const sheetTokens = await getSheetTokens();
    const enriched = await enrichWithPrices(sheetTokens);
    
    return NextResponse.json(enriched ?? []);

  } catch (err) {
    console.error("❌ Enrich API Error:", err);
    return NextResponse.json({ error: "Failed to enrich tokens" }, { status: 500 });
  }
}