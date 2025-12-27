// lib/getSheetWallets.ts
/* eslint-disable no-console */
/**
 * Utility for loading wallet list from Google Apps Script (Google Sheets backend).
 *
 * Pattern is the same idea as `getSheetTokens.ts`:
 * - Server-side only function
 * - Fetches from Apps Script Web App URL (GSHEETS_WALLET_ENDPOINT)
 * - Maps into a typed structure for use in the app
 */

export type WalletType = "evm" | "sol" | "etc";

export interface SheetWallet {
  id: number | string;
  label: string;
  address: string;
  type: WalletType;
}

/**
 * Fetch wallet list from Google Apps Script, routed by wallet type.
 *
 * @param type - "evm" | "sol" | "etc"
 */
export async function getSheetWallets(type: WalletType = "evm"): Promise<SheetWallet[]> {
  const baseUrl = process.env.GSHEETS_WALLET_ENDPOINT;
  if (!baseUrl) {
    console.error("[getSheetWallets] Missing GSHEETS_WALLET_ENDPOINT env");
    return [];
  }

  const url = new URL(baseUrl);
  url.searchParams.set("type", type);

  try {
    const res = await fetch(url.toString(), {
      // server-side fetch only; adjust caching as you like
      // next: { revalidate: 60 }, // if you want ISR-style caching
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[getSheetWallets] Upstream error status:", res.status, res.statusText);
      return [];
    }

    const data = (await res.json()) as {
      ok?: boolean;
      wallets?: unknown;
    };

    if (data && data.ok === false) {
      console.error("[getSheetWallets] Upstream returned ok=false:", data);
      return [];
    }

    const rawWallets = (data as any).wallets ?? [];

    // Normalize / map into SheetWallet[]
    const wallets: SheetWallet[] = rawWallets.map((w: any, index: number) => ({
      id: w.id ?? index + 1,
      label: String(w.label ?? w.name ?? ""),
      address: String(w.address ?? ""),
      type: (w.type ?? type) as WalletType,
    }));

    return wallets.filter((w) => !!w.address);
  } catch (err) {
    console.error("[getSheetWallets] Fetch error:", err);
    return [];
  }
}
