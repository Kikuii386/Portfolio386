// app/api/enrich/route.ts
import { NextResponse } from "next/server";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices } from "@/lib/enrichWithPrices";

export async function GET() {
  try {
    const sheetTokens = await getSheetTokens();
    const enriched = await enrichWithPrices(sheetTokens);
    return NextResponse.json(enriched ?? []);
  } catch (err) {
    console.error("❌ Enrich API Error:", err);
    return NextResponse.json({ error: "Failed to enrich tokens" }, { status: 500 });
  }
}