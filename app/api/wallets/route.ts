import { NextRequest, NextResponse } from "next/server";
import { getSheetWallets, type WalletType } from "@/lib/getSheetWallets";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type") ?? "evm";

    // ป้องกัน type แปลก ๆ
    const allowed: WalletType[] = ["evm", "sol", "etc"];
    const type: WalletType = (allowed.includes(typeParam as WalletType)
      ? typeParam
      : "evm") as WalletType;

    const wallets = await getSheetWallets(type);

    return NextResponse.json({ wallets });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/wallets] error:", e);
    return NextResponse.json(
      { wallets: [], error: String(e) },
      { status: 500 },
    );
  }
}