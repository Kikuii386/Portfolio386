'use client';

import React, { useState } from 'react';
import { useCopyToClipboard } from '@/hook/useCopyToClipboard';
import QtyDisplay, { formatQtyString } from '@/components/QtyDisplay'; // ✅ Import formatQtyString เพิ่ม
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
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

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

// ใช้ Endpoint ที่แรงๆ หน่อย
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

// 2. ✅ Main Scan Function
async function scanSolanaBalances(
  wallets: Wallet[],
  mintAddress: string
): Promise<{ results: WalletBalanceResult[]; symbol: string }> {
  const connection = new Connection(SOLANA_RPC_URL);
  const isNative = !mintAddress || mintAddress.trim() === '';

  let results: WalletBalanceResult[] = [];
  let symbol = 'TOKEN';

  if (isNative) {
    symbol = 'SOL';
    const BATCH_SIZE = 100;
    const chunks = [];

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
      chunks.push(wallets.slice(i, i + BATCH_SIZE));
    }

    for (const chunk of chunks) {
      try {
        const publicKeys = chunk.map((w) => new PublicKey(w.address));
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
    symbol = (await getSolanaSymbol(mintAddress)) || 'TOKEN';
    const mintPublicKey = new PublicKey(mintAddress);
    const CONCURRENCY = 20;
    const chunks = [];
    for (let i = 0; i < wallets.length; i += CONCURRENCY) {
      chunks.push(wallets.slice(i, i + CONCURRENCY));
    }

    let decimals = 0;

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (w) => {
          try {
            const response = await connection.getParsedTokenAccountsByOwner(
              new PublicKey(w.address),
              { mint: mintPublicKey }
            );

            let totalBalance = 0;
            for (const { account } of response.value) {
              const parsedInfo = account.data.parsed.info.tokenAmount;
              totalBalance += parsedInfo.uiAmount || 0;
              decimals = parsedInfo.decimals;
            }

            if (totalBalance > 0) {
              results.push({
                label: w.label,
                address: w.address,
                balance: totalBalance,
                formatted: '',
              });
            }
          } catch (err) { }
        })
      );
    }

    results = results.map((r) => ({
      ...r,
      formatted: r.balance.toLocaleString(undefined, {
        maximumFractionDigits: decimals || 6,
      }),
    }));
  }

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

      const res = await fetch('/api/wallets?type=sol');
      if (!res.ok) throw new Error('Failed to load SOL wallets');
      const data = (await res.json()) as { wallets: Wallet[] };

      const uniqueWallets = data.wallets.reduce((acc, current) => {
        const x = acc.find((item) => item.address === current.address);
        return !x ? acc.concat([current]) : acc;
      }, [] as Wallet[]);

      if (!uniqueWallets.length) throw new Error('No SOL wallets found');

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
          {/* ✅ ปุ่ม Clear Logic แบบ EVM */}
          {(tokenMint || hasScanned) && (
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

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full h-[50px] py-3.5 bg-earth-sage text-white font-semibold rounded-xl hover:bg-earth-olive hover:shadow-lg hover:shadow-earth-sage/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Search size={20} />
        )}
        <span>{loading ? 'Scanning...' : 'Scan Balances'}</span>
      </button>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50/50 text-red-600 text-sm rounded-xl border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/80 overflow-hidden shadow-sm">
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span>Found in {results.length} wallets</span>
            </div>
            <div>
              {/* ✅ Header Total Balance + Tooltip แบบ EVM */}
              {(() => {
                const total = results.reduce((sum, r) => sum + r.balance, 0);

                return (
                  <Tooltip
                    content={`Total: ${formatQtyString(total)}`}
                    side="bottom"
                  >
                    <button
                      onClick={() => copy(total.toString(), 'Total Balance')}
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-earth-brown bg-white px-3 py-1.5 rounded-md border border-earth-cream shadow-sm active:scale-95 transition-transform"
                    >
                      <span className="hidden sm:inline">
                        {displaySymbol.toUpperCase()}
                      </span>
                      <span className="hidden sm:inline text-earth-cream/80">
                        |
                      </span>
                      <span className="text-earth-sage font-bold font-mono">
                        <QtyDisplay qty={total} />
                      </span>
                    </button>
                  </Tooltip>
                );
              })()}
            </div>
          </div>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden md:block max-h-[400px] overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 border-b border-earth-cream/50 shadow-sm text-earth-stone text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 w-[40%] text-left">Wallet Name</th>
                  <th className="px-5 py-3 w-[35%] text-left">Address</th>
                  <th className="px-5 py-3 w-[25%] text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white">
                {results.map((r) => (
                  <tr
                    key={r.address}
                    className="hover:bg-earth-cream/40 transition-colors group duration-300"
                  >
                    <td className="px-5 py-4">
                      <Tooltip content="Go to Solscan" side="top">
                        <div
                          className="inline-flex items-center cursor-pointer group/label"
                          onClick={() => {
                            window.open(
                              `https://solscan.io/account/${r.address}`,
                              '_blank'
                            );
                          }}
                        >
                          <span className="font-medium text-earth-darkbrown group-hover/label:text-earth-sage group-hover/label:underline transition-all duration-300">
                            {r.label}
                          </span>
                        </div>
                      </Tooltip>
                    </td>

                    <td className="px-5 py-4">
                      <Tooltip content="Copy address" side="top">
                        <div
                          className="inline-flex items-center gap-2 group/addr cursor-pointer"
                          onClick={() => copy(r.address, 'Address')}
                        >
                          <span className="font-mono text-xs text-earth-stone/70 group-hover/addr:text-earth-sage transition-all duration-300">
                            {r.address.slice(0, 6)}...{r.address.slice(-4)}
                          </span>
                          <div className="p-1 rounded-md text-earth-stone/50 group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all">
                            {copiedText === r.address ? (
                              <Check size={14} className="text-earth-sage" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    </td>

                    {/* ✅ Balance Column with QtyDisplay */}
                    <td
                      className="flex justify-end px-5 py-4 text-right font-bold text-earth-sage font-mono cursor-pointer active:scale-95 active:text-earth-moss transition-all duration-300"
                      onClick={() => {
                        copy(r.balance.toString(), 'Quantity');
                      }}
                    >
                      <Tooltip
                        content={Number(r.balance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 8,
                        })}
                        side="top"
                      >
                        <span>
                          <QtyDisplay qty={r.balance} />
                        </span>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE LIST ================= */}
          <div className="md:hidden p-4 space-y-3 bg-earth-cream/10 max-h-[500px] overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.address}
                className="bg-white p-4 rounded-xl border border-earth-cream/60 shadow-sm flex flex-col gap-3 transition-colors duration-300"
              >
                <div className="flex justify-between items-start">
                  {/* ✅ Clickable Label */}
                  <div
                    className="font-semibold text-earth-darkbrown/70 text-sm max-w-[70%] active:text-earth-darkbrown active:scale-95 transition-all duration-300"
                    onClick={() => {
                      window.open(
                        `https://solscan.io/account/${r.address}`,
                        '_blank'
                      );
                    }}
                  >
                    {r.label}
                  </div>
                  <div className="text-right max-w-[30%]">
                    <span
                      className="p-1 block text-earth-sage font-bold font-mono text-sm leading-none active:scale-95 active:text-earth-moss transition-all duration-300"
                      onClick={() => {
                        copy(r.balance.toString(), 'Quantity');
                      }}
                    >
                      <QtyDisplay qty={r.balance} />
                    </span>
                    <span className="text-[10px] text-earth-stone font-bold uppercase truncate">
                      {displaySymbol}
                    </span>
                  </div>
                </div>

                {/* Row 2: Address Box (Copyable) */}
                <div
                  onClick={() => copy(r.address, 'Address')}
                  className="flex items-center justify-between bg-earth-cream/50 border border-earth-cream/40 rounded-lg px-3 py-2 cursor-pointer active:bg-earth-cream/40"
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-earth-stone/70" />
                    <span className="font-mono text-xs text-earth-stone/90">
                      {r.address.slice(0, 10)}...{r.address.slice(-6)}
                    </span>
                  </div>
                  <div className="text-earth-stone/70">
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
              </div>
            ))}
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
