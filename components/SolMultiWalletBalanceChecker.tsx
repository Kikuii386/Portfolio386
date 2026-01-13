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
} from 'lucide-react';

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

// --- Helper: Solana RPC Logic ---
// ใช้ Alchemy Endpoint เดิมของคุณ
const SOLANA_RPC_URLS = [
  'https://solana-mainnet.g.alchemy.com/v2/xGT7Yqz9EMwjE8yF4pSjiO3CDG9925hj',
] as const;

async function pickSolanaRpcUrl() {
  return SOLANA_RPC_URLS[0];
}

interface SolRpcResponse {
  result?: {
    value: {
      account: {
        data: {
          parsed: {
            info: {
              tokenAmount: {
                amount: string;
                decimals: number;
                uiAmountString?: string;
              };
            };
          };
        };
      };
    }[];
  };
  error?: { message: string };
}

// 1. ✅ เพิ่มฟังก์ชันดึงชื่อเหรียญ (Symbol) จาก DexScreener API
async function getSolanaSymbol(mintAddress: string): Promise<string> {
  try {
    // DexScreener API ฟรีและไม่ต้องใช้ Key
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`
    );
    if (!res.ok) return '';

    const data = await res.json();
    // ถ้าเจอคู่เหรียญ ให้เอา symbol ของ baseToken มาใช้
    if (data.pairs && data.pairs.length > 0) {
      return data.pairs[0].baseToken.symbol;
    }
    return '';
  } catch (e) {
    return '';
  }
}

async function fetchSolTokenBalanceForWallet(
  rpcUrl: string,
  walletAddress: string,
  mintAddress: string
): Promise<{ balance: number; decimals: number }> {
  try {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { mint: mintAddress },
        { encoding: 'jsonParsed' },
      ],
    };

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('RPC Error');

    const data = (await res.json()) as SolRpcResponse;
    if (data.error) throw new Error(data.error.message);

    const accounts = data.result?.value ?? [];
    let total = 0;
    let decimals = 0;

    for (const acc of accounts) {
      const info = acc.account.data.parsed.info.tokenAmount;
      // เก็บค่า decimals ไว้ใช้ (ปกติทุก account ของ mint เดียวกันจะ decimals เท่ากัน)
      decimals = info.decimals;
      total += Number(info.amount) / Math.pow(10, info.decimals);
    }

    return { balance: total, decimals };
  } catch (err) {
    // console.error(`Error fetching SOL balance for ${walletAddress}:`, err);
    return { balance: 0, decimals: 0 };
  }
}

/* --------------------------- Component -------------------------- */

export default function SolMultiWalletBalanceChecker() {
  const [tokenMint, setTokenMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WalletBalanceResult[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const { copiedText, copy } = useCopyToClipboard();

  // 2. ✅ เพิ่ม State สำหรับแสดงชื่อเหรียญ และ Copy
  const [displaySymbol, setDisplaySymbol] = useState<string>('');

  const handleScan = async () => {
    setError(null);
    setResults([]);
    setDisplaySymbol('');
    setLoading(true);
    setHasScanned(false);

    try {
      const mint = tokenMint.trim();
      if (!mint) throw new Error('Please enter Solana Mint Address');

      // 3. ✅ ดึงชื่อเหรียญแบบ Parallel (ทำไปพร้อมกับโหลด Wallet)
      const symbolPromise = getSolanaSymbol(mint);
      const walletsPromise = fetch('/api/wallets?type=sol').then((res) => {
        if (!res.ok) throw new Error('Failed to load SOL wallets');
        return res.json();
      });

      const [symbol, walletsData] = await Promise.all([
        symbolPromise,
        walletsPromise,
      ]);

      // อัปเดตชื่อเหรียญ (ถ้าหาไม่เจอใช้ค่าที่กรอกมา หรือ "TOKEN")
      setDisplaySymbol(symbol || 'TOKEN');

      const wallets = (walletsData as { wallets: Wallet[] }).wallets;
      if (!wallets?.length) throw new Error('No SOL wallets found');

      const rpcUrl = await pickSolanaRpcUrl();

      // Batching logic
      const concurrency = 5;
      const chunks = [];
      for (let i = 0; i < wallets.length; i += concurrency)
        chunks.push(wallets.slice(i, i + concurrency));

      const acc: WalletBalanceResult[] = [];

      // ตัวแปรเก็บ decimals เพื่อใช้ format (เอาจาก wallet แรกที่เจอ)
      let foundDecimals = 0;

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (w) => {
            try {
              const { balance, decimals } = await fetchSolTokenBalanceForWallet(
                rpcUrl,
                w.address,
                mint
              );

              if (decimals > 0) foundDecimals = decimals;

              if (balance > 0) {
                acc.push({
                  label: w.label,
                  address: w.address,
                  balance,
                  formatted: '', // จะเติมทีหลังเมื่อรู้ decimals
                });
              }
            } catch (e) {
              console.error(e);
            }
          })
        );
      }

      // Format Balance ด้วย Decimals ที่ถูกต้อง
      const finalResults = acc.map((r) => ({
        ...r,
        formatted: r.balance.toLocaleString(undefined, {
          maximumFractionDigits: foundDecimals || 6,
        }),
      }));

      finalResults.sort((a, b) => (a.balance < b.balance ? 1 : -1));
      setResults(finalResults);
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
