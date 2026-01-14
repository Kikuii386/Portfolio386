'use client';

import React, { useState } from 'react';
import { useCopyToClipboard } from '@/hook/useCopyToClipboard';
import QtyDisplay from '@/components/QtyDisplay';
import Tooltip from '@/components/ui/Tooltips';
import {
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Earth,
  X,
  Coins, // ใช้ Icon นี้สำหรับกรณี Native
} from 'lucide-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface Wallet {
  id: number | string;
  label: string;
  address: string;
}

interface WalletBalanceResult {
  label: string;
  address: string;
  balance: number;
  formatted: string;
}

// ใช้ Endpoint ที่แรงๆ หน่อย (ถ้าของฟรีอาจจะต้องลด Batch Size ลง)
const SOLANA_RPC_URL =
  'https://solana-mainnet.g.alchemy.com/v2/xGT7Yqz9EMwjE8yF4pSjiO3CDG9925hj';

// 1. ✅ ฟังก์ชันดึงชื่อเหรียญ (DexScreener)
async function getSolanaSymbol(mintAddress: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    if (data.pairs && data.pairs.length > 0)
      return data.pairs[0].baseToken.symbol;
    return '';
  } catch {
    return '';
  }
}

// 2. ✅ Main Scan Function (ฉลาดขึ้น + รองรับ Native SOL)
async function scanSolanaBalances(
  wallets: Wallet[],
  mintAddress: string
): Promise<{ results: WalletBalanceResult[]; symbol: string }> {
  const connection = new Connection(SOLANA_RPC_URL);
  const isNative = !mintAddress || mintAddress.trim() === ''; // ถ้าว่าง = สแกน SOL

  let results: WalletBalanceResult[] = [];
  let symbol = 'TOKEN';

  if (isNative) {
    /* ----------------------------------------------------------
       MODE A: NATIVE SOL (เร็วมาก 🚀)
       ใช้ getMultipleAccounts ยิงทีเดียวได้ 100 กระเป๋า
    ---------------------------------------------------------- */
    symbol = 'SOL';
    const BATCH_SIZE = 100; // Solana รับได้สูงสุด 100 accounts ต่อ 1 request
    const chunks = [];

    // แบ่งกระเป๋าเป็นกลุ่มละ 100
    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
      chunks.push(wallets.slice(i, i + BATCH_SIZE));
    }

    for (const chunk of chunks) {
      try {
        // แปลง Address String -> PublicKey
        const publicKeys = chunk.map((w) => new PublicKey(w.address));

        // ยิงตูมเดียว ได้ข้อมูลครบทั้ง Chunk
        const accountsInfo = await connection.getMultipleAccountsInfo(
          publicKeys
        );

        accountsInfo.forEach((info, index) => {
          if (info) {
            const bal = info.lamports / LAMPORTS_PER_SOL;
            if (bal > 0) {
              results.push({
                label: chunk[index].label,
                address: chunk[index].address,
                balance: bal,
                formatted: bal.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                }),
              });
            }
          }
        });
      } catch (err) {
        console.error('Error fetching SOL batch:', err);
      }
    }
  } else {
    /* ----------------------------------------------------------
       MODE B: SPL TOKEN (USDC, BONK, etc.)
       ต้องยิงแยกรายคน แต่ใช้ Parallel Batching ช่วย
    ---------------------------------------------------------- */
    // หา Symbol ก่อน
    symbol = (await getSolanaSymbol(mintAddress)) || 'TOKEN';

    const mintPublicKey = new PublicKey(mintAddress);

    // Batch Size เล็กลงหน่อยเพราะ Request มันหนักกว่า Native
    const CONCURRENCY = 20;
    const chunks = [];
    for (let i = 0; i < wallets.length; i += CONCURRENCY) {
      chunks.push(wallets.slice(i, i + CONCURRENCY));
    }

    let decimals = 0; // เก็บ decimals ไว้ (เอาจากตัวแรกที่เจอ)

    for (const chunk of chunks) {
      // ใช้ Promise.all ยิงพร้อมกัน 20 request
      await Promise.all(
        chunk.map(async (w) => {
          try {
            // ใช้ getParsedTokenAccountsByOwner (สะดวกสุด มัน parse json ให้เลย)
            const response = await connection.getParsedTokenAccountsByOwner(
              new PublicKey(w.address),
              { mint: mintPublicKey }
            );

            // รวมยอดทุก Account (บางคนมีหลาย Token Account ของเหรียญเดิม)
            let totalBalance = 0;

            for (const { account } of response.value) {
              const parsedInfo = account.data.parsed.info.tokenAmount;
              totalBalance += parsedInfo.uiAmount || 0;
              decimals = parsedInfo.decimals; // เก็บ decimals
            }

            if (totalBalance > 0) {
              results.push({
                label: w.label,
                address: w.address,
                balance: totalBalance,
                formatted: '', // เดี๋ยวมาเติมทีหลัง
              });
            }
          } catch (err) {
            // console.error(`Failed to scan ${w.label}`, err);
          }
        })
      );
    }

    // Format เลขให้สวย (หลังจากรู้ decimals แล้ว)
    results = results.map((r) => ({
      ...r,
      formatted: r.balance.toLocaleString(undefined, {
        maximumFractionDigits: decimals || 6,
      }),
    }));
  }

  // Sort มาก -> น้อย
  results.sort((a, b) => b.balance - a.balance);

  return { results, symbol };
}

/* --------------------------- Component -------------------------- */

export default function SolMultiWalletBalanceChecker() {
  const [tokenMint, setTokenMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WalletBalanceResult[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [displaySymbol, setDisplaySymbol] = useState<string>('');
  const { copiedText, copy } = useCopyToClipboard();

  const handleScan = async () => {
    setError(null);
    setResults([]);
    setDisplaySymbol('');
    setLoading(true);
    setHasScanned(false);

    try {
      const mint = tokenMint.trim();
      // อนุญาตให้ว่างได้ = สแกน Native SOL

      // 1. กรอง Address ซ้ำ (Deduplicate)
      const res = await fetch('/api/wallets?type=sol');
      if (!res.ok) throw new Error('Failed to load SOL wallets');
      const data = (await res.json()) as { wallets: Wallet[] };

      const uniqueWallets = data.wallets.reduce((acc, current) => {
        const x = acc.find((item) => item.address === current.address);
        return !x ? acc.concat([current]) : acc;
      }, [] as Wallet[]);

      if (!uniqueWallets.length) throw new Error('No SOL wallets found');

      // 2. สแกน (Batch Logic อยู่ข้างในนี้แล้ว)
      const { results: scanResults, symbol } = await scanSolanaBalances(
        uniqueWallets,
        mint
      );

      setDisplaySymbol(symbol);
      setResults(scanResults);
      setHasScanned(true);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTokenMint('');
    setResults([]);
    setHasScanned(false);
    setDisplaySymbol('');
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Input Section: Grid Layout */}

      {/* Input Section */}
      <div className="md:col-span-8 space-y-1.5">
        <label className="h-[50px] text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
          Solana Token Address
        </label>
        <div className="relative w-full group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone/80 group-focus-within:text-earth-sage transition-colors">
            <Terminal size={18} />
          </div>
          <input
            type="text"
            placeholder="e.g. So111... (wSOL) or EPjF... (USDC)"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="pl-10 pr-10 py-3.5 w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown placeholder-earth-stone/80 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all font-mono text-sm"
          />
          {tokenMint && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <Tooltip content="Clear" side="bottom">
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full bg-earth-brown/50 text-white hover:bg-red-400 transition-all duration-200 shadow-sm hover:scale-110 flex items-center justify-center"
                >
                  <X size={12} strokeWidth={4} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-earth-stone/70 px-1">
        * Tip: Enter the SPL Token Mint Address (e.g. EPjF... for USDC).
      </div>
      {/* Action Button */}
      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full py-3.5 bg-earth-sage text-white font-semibold rounded-xl hover:bg-earth-olive hover:shadow-lg hover:shadow-earth-sage/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Search size={20} />
        )}
        <span>{loading ? 'Scanning...' : 'Scan Balances'}</span>
      </button>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50/50 text-red-600 text-sm rounded-xl border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/80 overflow-hidden shadow-sm">
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span>Found in {results.length} wallets</span>
            </div>
            <div>
              {/* คำนวณยอดรวมเตรียมไว้ก่อน */}
              {(() => {
                const total = results.reduce(
                  (sum, r) => sum + Number(r.formatted.replace(/,/g, '')),
                  0
                );

                return (
                  <Tooltip
                    content={`Total Balance: ${total.toLocaleString()}`}
                    side="bottom"
                  >
                    <span
                      className="flex items-center gap-2 text-sm font-semibold font-roboto text-earth-brown bg-white px-3 py-1.5 rounded-md border border-earth-cream shadow-sm "
                      onClick={() => copy(total.toString(), 'Total Balance')}
                    >
                      {/* ชื่อเหรียญ */}
                      <span>{displaySymbol.toUpperCase()}</span>

                      {/* ขีดคั่น (Optional: ใส่เพื่อให้ดูแยกส่วนชัดเจน) */}
                      <span className="hidden sm:block text-earth-cream/80">
                        |
                      </span>

                      {/* ยอดรวม (ใช้ QtyDisplay ย่อเลข K, M, B ได้เลย) */}
                      <span className="hidden sm:block text-earth-sage font-bold font-mono hover:text-earth-darkbrown cursor-pointer transition-all duration-300">
                        <QtyDisplay qty={total} />
                      </span>
                    </span>
                  </Tooltip>
                );
              })()}
            </div>
          </div>

          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 border-b border-earth-cream/30 text-earth-stone text-xs font-bold uppercase tracking-wider">
                <tr>
                  {/* 1. Wallet Name: มือถือเอาไป 65%, จอใหญ่เอา 40% */}
                  <th className="px-5 py-3 w-[65%] sm:w-[40%] text-left truncate">
                    Wallet Name
                  </th>

                  {/* 2. Address: มือถือซ่อน, จอใหญ่เอา 35% */}
                  <th className="px-5 py-3 w-[35%] hidden sm:table-cell text-left">
                    Address
                  </th>

                  {/* 3. Balance: มือถือเอา 35%, จอใหญ่เอา 25% */}
                  <th className="px-5 py-3 w-[35%] sm:w-[25%] text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-cream/30">
                {results.map((r) => (
                  <tr
                    key={r.address}
                    className="hover:bg-earth-cream/10 transition-colors group"
                  >
                    <td className="px-5 py-3 font-medium text-earth-darkbrown">
                      <div className="flex items-center gap-2">
                        {/* ชื่อ Wallet */}
                        <span>{r.label}</span>

                        {/* ✅ ปุ่ม Copy: แสดงเฉพาะมือถือ (sm:hidden) และซ่อนใน Desktop */}
                        <button
                          onClick={() => copy(r.address, 'Address')}
                          className="sm:hidden p-1 rounded-md text-earth-stone/50 group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all duration-200"
                        >
                          {copiedText === r.address ? (
                            <Check
                              size={14}
                              className="text-earth-sage animate-in zoom-in"
                            />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3 hidden sm:table-cell">
                      {/* 1. ตั้งชื่อ group ว่า 'addr' เพื่อไม่ให้ตีกับ group ของ tr */}
                      <Tooltip content="Copy address" side="right">
                        <div
                          className="inline-flex items-center gap-2 group/addr cursor-pointer align-middle"
                          onClick={() => copy(r.address, 'Address')}
                        >
                          {/* 2. เปลี่ยน group-hover เป็น group-hover/addr */}
                          <span className="font-mono text-xs text-earth-stone/70 group-hover/addr:text-earth-sage group-hover/addr:opacity-100 transition-all duration-200">
                            {r.address.slice(0, 6)}...{r.address.slice(-4)}
                          </span>

                          {/* 3. เปลี่ยน group-hover เป็น group-hover/addr */}
                          <div className="p-1 rounded-md text-earth-stone/50 group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all duration-200">
                            {copiedText === r.address ? (
                              <Check
                                size={14}
                                className="text-earth-sage animate-in zoom-in"
                              />
                            ) : (
                              <Copy size={14} />
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    </td>

                    <td className="px-5 py-3 text-right font-bold text-earth-sage font-mono">
                      {/* 📱 Mobile View: ใช้ QtyDisplay (ย่อ 1.2M, 10K) */}
                      <span className="sm:hidden">
                        <QtyDisplay
                          qty={Number(r.formatted.replace(/,/g, ''))}
                        />
                      </span>

                      {/* 💻 Desktop View: แสดงตัวเลขเต็มพร้อมทศนิยม 4 ตำแหน่ง */}
                      <span className="hidden sm:inline">
                        {Number(r.formatted.replace(/,/g, '')).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          }
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && !error && hasScanned && results.length === 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/50 overflow-hidden shadow-sm">
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span>Found in {results.length} wallets</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-earth-cream/50 p-2 text-center shadow-sm animate-in fade-in zoom-in-95 duration-300 opacity-80">
            <div className="bg-earth-cream/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-earth-stone">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-earth-darkbrown font-bold text-lg">
              Not Found
            </h3>
            <p className="text-earth-stone text-sm mt-1 pb-1">
              No wallets found holding this token.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !hasScanned && (
        <div className="text-center py-2 md:py-10 opacity-80">
          <div className="bg-earth-cream/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-earth-stone">
            <Earth size={30} />
          </div>
          <p className="text-sm text-earth-stone">
            Ready to scan. Select a network and enter the token identifier.
          </p>
        </div>
      )}
    </div>
  );
}
