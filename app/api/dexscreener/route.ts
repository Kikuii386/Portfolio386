import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const response = NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 410 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}