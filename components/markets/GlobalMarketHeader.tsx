'use client';

import React, { useState, useEffect } from 'react';
import {
    Coins,
    ArrowRightLeft,
    ArrowUpRight,
    ArrowDownRight,
    Bitcoin,
    Fuel,
} from 'lucide-react';

// --- Types ---
interface MarketData {
    marketCap: number;
    marketCapChange: number;
    volume: number;
    volumeChange: number; // CoinGecko Free ไม่ค่อยให้ค่านี้มา อาจต้อง Mock หรือคำนวณเอง
    btcDominance: number;
    gasPrice: number;
}

export default function GlobalMarketHeader() {
    const [data, setData] = useState<MarketData | null>(null);
    const [loading, setLoading] = useState(true);

    // --- 1. Fetching Logic ---
    useEffect(() => {
        async function fetchMarketData() {
            try {
                // ✅ เปลี่ยนมายิง API ของตัวเอง (ตัดปัญหา CORS และช่วย Caching)
                const res = await fetch('/api/market/global');

                if (!res.ok) throw new Error('API Error');

                const data = await res.json();

                setData({
                    marketCap: data.marketCap,
                    marketCapChange: data.marketCapChange,
                    volume: data.volume,
                    volumeChange: -5.4, // Mock หรือคำนวณเพิ่มถ้าต้องการ
                    btcDominance: data.btcDominance,
                    gasPrice: data.gasPrice,
                });
            } catch (error) {
                console.error('Failed to fetch market data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMarketData();
    }, []);

    // --- 2. Formatters ---
    const formatCurrency = (num: number) => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        return `$${num.toLocaleString()}`;
    };

    const formatPercent = (num: number) => {
        return `${Math.abs(num).toFixed(1)}%`;
    };

    // Logic สี Gas
    const getGasStatus = (gwei: number) => {
        if (gwei < 15) return { label: 'Low', color: 'text-green-700', bg: 'bg-green-500' };
        if (gwei < 30) return { label: 'Standard', color: 'text-yellow-700', bg: 'bg-yellow-500' };
        return { label: 'High', color: 'text-red-700', bg: 'bg-red-500' };
    };

    // --- 3. Loading State (Skeleton) ---
    if (loading || !data) {
        return (
            <div className="mb-6 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[88px] bg-earth-darkbrown/5 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const gasStatus = getGasStatus(data.gasPrice);

    return (
        <div className="mb-6 animate-in fade-in duration-700">
            <div className="rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                    {/* --- Stat 1: Market Cap --- */}
                    <div className="px-4 py-4 flex items-center gap-4 group hover:bg-earth-darkbrown/10 transition-colors duration-300 rounded-xl cursor-pointer">
                        <div className="p-2.5 bg-earth-darkbrown/5 rounded-xl text-earth-darkbrown group-hover:bg-earth-darkbrown group-hover:text-white transition-all duration-300 shadow-sm">
                            <Coins size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-[10px] text-earth-stone uppercase font-bold tracking-wider mb-0.5 group-hover:text-earth-darkbrown transition-colors duration-300">
                                Global Market Cap
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight">
                                    {formatCurrency(data.marketCap)}
                                </span>
                                <span
                                    className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-md border ${data.marketCapChange >= 0
                                        ? 'text-green-700 bg-green-500/10 border-green-500/20'
                                        : 'text-red-700 bg-red-500/10 border-red-500/20'
                                        }`}
                                >
                                    {data.marketCapChange >= 0 ? (
                                        <ArrowUpRight size={10} className="mr-0.5" />
                                    ) : (
                                        <ArrowDownRight size={10} className="mr-0.5" />
                                    )}
                                    {formatPercent(data.marketCapChange)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* --- Stat 2: 24h Volume --- */}
                    <div className="px-4 py-4 flex items-center gap-4 group hover:bg-earth-darkbrown/10 transition-colors duration-300 rounded-xl cursor-pointer">
                        <div className="p-2.5 bg-earth-darkbrown/5 rounded-xl text-earth-darkbrown group-hover:bg-earth-darkbrown group-hover:text-white transition-all duration-300 shadow-sm">
                            <ArrowRightLeft size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-[10px] text-earth-stone uppercase font-bold tracking-wider mb-0.5 group-hover:text-earth-darkbrown transition-colors duration-300">
                                24h Volume
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight">
                                    {formatCurrency(data.volume)}
                                </span>
                                {/* Note: CoinGecko Free ไม่ส่ง Volume Change มาให้ อาจต้อง Mock หรือซ่อน */}
                                <span className="text-[10px] font-bold text-earth-stone/70 flex items-center bg-earth-stone/10 px-1.5 py-0.5 rounded-md border border-earth-stone/20">
                                    24h
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* --- Stat 3: BTC Dominance --- */}
                    <div className="px-4 py-4 flex items-center gap-4 group hover:bg-earth-darkbrown/10 transition-colors duration-300 rounded-xl cursor-pointer">
                        <div className="p-2.5 bg-earth-darkbrown/5 rounded-xl text-earth-darkbrown group-hover:bg-earth-darkbrown group-hover:text-white transition-all duration-300 shadow-sm">
                            <Bitcoin size={20} strokeWidth={1.5} />
                        </div>
                        <div className="w-full pr-2">
                            <p className="text-[10px] text-earth-stone uppercase font-bold tracking-wider mb-0.5 group-hover:text-earth-darkbrown transition-colors duration-300">
                                BTC Dominance
                            </p>
                            <div className="flex flex-col gap-1">
                                <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight leading-none">
                                    {data.btcDominance.toFixed(1)}%
                                </span>
                                <div className="w-full h-1 bg-earth-darkbrown/10 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full bg-earth-gold rounded-full group-hover:bg-earth-darkbrown transition-colors duration-300"
                                        style={{ width: `${data.btcDominance}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Stat 4: ETH Gas --- */}
                    <div className="px-4 py-4 flex items-center gap-4 group hover:bg-earth-darkbrown/10 transition-colors duration-300 rounded-xl cursor-pointer hidden md:flex">
                        <div className="p-2.5 bg-earth-darkbrown/5 rounded-xl text-earth-darkbrown group-hover:bg-earth-darkbrown group-hover:text-white transition-all duration-300 shadow-sm">
                            <Fuel size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-earth-stone uppercase font-bold tracking-wider mb-0.5 group-hover:text-earth-darkbrown transition-colors duration-300">
                                ETH Gas
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight">
                                    {data.gasPrice}{' '}
                                    <span className="text-xs font-sans font-medium text-earth-stone/80">
                                        Gwei
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${gasStatus.bg} animate-pulse`}></div>
                                <span className={`text-[9px] font-bold uppercase ${gasStatus.color}`}>
                                    {gasStatus.label} Traffic
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}