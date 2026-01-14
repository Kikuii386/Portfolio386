// lib/getSheetWallets.ts
/* eslint-disable no-console */
import { getFromCache, setToCache } from '@/lib/redisCache';

export type WalletType = 'evm' | 'sol' | 'etc';

export interface SheetWallet {
  id: number | string;
  label: string;
  address: string;
  type: WalletType;
}

/**
 * 🛠️ ฟังก์ชันดึงสดจาก Google Sheets (ใช้สำหรับ Cron Job หรือตอน Cache หลุด)
 */
export async function fetchWalletsFromSheet(
  type: WalletType
): Promise<SheetWallet[]> {
  const baseUrl = process.env.GSHEETS_WALLET_ENDPOINT;
  if (!baseUrl) {
    console.error(
      '[fetchWalletsFromSheet] Missing GSHEETS_WALLET_ENDPOINT env'
    );
    return [];
  }

  const url = new URL(baseUrl);
  url.searchParams.set('type', type);

  console.log(`☁️ Fetching fresh ${type} wallets from Google Sheets...`);

  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(
        '[fetchWalletsFromSheet] Upstream error status:',
        res.status
      );
      return [];
    }

    const data = (await res.json()) as {
      ok?: boolean;
      wallets?: unknown;
    };

    if (data && data.ok === false) {
      console.error(
        '[fetchWalletsFromSheet] Upstream returned ok=false:',
        data
      );
      return [];
    }

    const rawWallets = (data as any).wallets ?? [];

    const allWallets: SheetWallet[] = rawWallets
      .map((w: any, index: number) => ({
        id: w.id ?? index + 1,
        label: String(w.label ?? w.name ?? ''),
        address: String(w.address ?? '').trim(), // trim() ช่องว่างหน้าหลังออกด้วย
        type: (w.type ?? type) as WalletType,
      }))
      .filter((w: any) => !!w.address);

    const uniqueWalletsMap = new Map<string, SheetWallet>();

    allWallets.forEach((w) => {
      const key = w.address.toLowerCase();
      if (!uniqueWalletsMap.has(key)) {
        uniqueWalletsMap.set(key, w);
      }
    });

    // แปลงกลับเป็น Array
    const wallets = Array.from(uniqueWalletsMap.values());

    // ✅ บันทึกลง Cache แยกตาม type (อายุ 24 ชม. = 86400 วินาที)
    // Key pattern: "sheet:wallets:evm", "sheet:wallets:sol"
    await setToCache(`sheet:wallets:${type}`, wallets, 86400);

    return wallets;
  } catch (err) {
    console.error('[fetchWalletsFromSheet] Fetch error:', err);
    throw err; // โยน Error ออกไปเพื่อให้ function หลักรู้ว่าดึงไม่สำเร็จ
  }
}

/**
 * 🚀 ฟังก์ชันหลักที่หน้าเว็บเรียกใช้ (อ่าน Cache ก่อนเสมอ)
 *
 * @param type - "evm" | "sol" | "etc"
 */
export async function getSheetWallets(
  type: WalletType = 'evm'
): Promise<SheetWallet[]> {
  const cacheKey = `sheet:wallets:${type}`;

  try {
    // 1. ลองอ่านจาก Redis
    const cached = await getFromCache(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached as SheetWallet[];
    }

    console.log(`⚠️ Wallet Cache miss (${type}), fetching fresh...`);
    return await fetchWalletsFromSheet(type);
  } catch (err) {
    console.error(`❌ getSheetWallets Error (${type}):`, err);
    return [];
  }
}
