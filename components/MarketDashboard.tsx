'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import {
    Search, Star, ChevronRight, Coins, ArrowRightLeft, Bitcoin, Fuel,
    TrendingUp, TrendingDown, Zap, ArrowUpRight, ArrowDownRight, Flame, X
} from 'lucide-react';
// import Tooltip from '@/components/ui/Tooltips'; // ⚠️ ตรวจสอบว่ามีไฟล์นี้จริง ถ้าไม่มีให้ comment ไว้ก่อน

// --- 🎨 Palette (Earth Tone Theme) ---
const COLORS = {
    green: '#606c38',
    red: '#bc4749',
};

interface MarketData {
    marketCap: number;
    marketCapChange: number;
    volume: number;
    btcDominance: number;
    gasPrice: {
        eth: number;
        sol: number;
    };
}


function ChainGasCard({
    chain,
    value,
    unit,
    price,
    icon: Icon,
    colorClass,
    textColor
}: {
    chain: string,
    value: number,
    unit: string,
    price: number,
    icon: any,
    colorClass: string,
    textColor: string
}) {
    // 🧮 คำนวณต้นทุน USD
    let costUsd = 0;
    if (chain === 'ETH') {
        // ETH Standard Transfer = 21,000 units
        costUsd = ((value * 21000) / 1e9) * price;
    } else {
        // SOL (Value is already in SOL)
        costUsd = value * price;
    }

    const formatCost = (cost: number) => {
        if (isNaN(cost)) return '$-.--';
        return `$${cost.toFixed(4)}`;
    };

    return (
        <div className="min-w-[240px] md:min-w-0 h-full px-4 py-4 flex items-center gap-4 group rounded-xl cursor-pointer transition-colors duration-300 bg-earth-darkbrown/10 md:bg-transparent md:hover:bg-earth-darkbrown/10 border border-earth-cream/60 md:border-none snap-center">
            {/* Icon */}
            <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0 ${colorClass}`}>
                <Icon size={20} strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="w-full pr-2">
                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors duration-300 text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">
                    {chain} Gas
                </p>
                <div className="flex flex-col">
                    {/* Gas Price in Native Unit */}
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight leading-none">
                            {chain === 'ETH' ? value.toFixed(4) : value.toFixed(6)}
                        </span>
                        <span className="text-[10px] font-sans font-bold text-earth-stone/70">{unit}</span>
                    </div>

                    {/* Real Cost in USD */}
                    <span className={`text-[10px] font-bold mt-1 ${textColor}`}>
                        ~{formatCost(costUsd)} <span className="text-earth-stone/60 font-medium">per tx</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

const TABS = ['All', 'Top Gainers', 'Top Losers'];

// --- 🧩 Sub-Component: Sparkline Chart (Small Graph) ---
const Sparkline = ({ data, isPositive }: { data: number[], isPositive: boolean }) => {
    const chartData = data.map((val, i) => ({ i, val }));
    const color = isPositive ? COLORS.green : COLORS.red;

    return (
        <div className="w-[100px] h-[35px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${isPositive ? 'up' : 'down'})`} isAnimationActive={false} />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

function MarketSkeleton() {
    return (
        <div className="w-full space-y-6 animate-pulse">
            {/* 1. Header (5 Cards) */}
            <div className="mb-6 rounded-xl">
                <div className="flex md:grid md:grid-cols-5 gap-3 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-[88px] min-w-[240px] md:min-w-0 bg-earth-darkbrown/5 rounded-xl border border-earth-cream/60" />
                    ))}
                </div>
            </div>

            {/* 2. Highlights (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[200px] bg-earth-darkbrown/5 rounded-2xl border border-earth-cream/60" />
                ))}
            </div>

            {/* 3. Main Table Area */}
            <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 shadow-xl min-h-[600px] flex flex-col gap-6">
                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-8 w-20 bg-earth-darkbrown/5 rounded-lg" />)}
                    </div>
                    <div className="h-10 w-full md:w-64 bg-earth-darkbrown/5 rounded-xl" />
                </div>
                {/* Table Header */}
                <div className="h-10 w-full bg-earth-darkbrown/5 rounded-lg" />
                {/* Table Rows */}
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-16 w-full bg-earth-darkbrown/5 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- 🚀 Main Component: MarketDashboard ---
export default function MarketDashboard() {
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [globalData, setGlobalData] = useState<MarketData | null>(null);
    const [headerLoading, setHeaderLoading] = useState(true);
    const [coins, setCoins] = useState<any[]>([]);

    useEffect(() => {
        async function fetchAllData() {
            try {
                setHeaderLoading(true);
                const res = await fetch('/api/market/global');
                if (!res.ok) throw new Error('Failed to fetch API');
                const data = await res.json();

                setGlobalData({
                    marketCap: data.marketCap || 0,
                    marketCapChange: data.marketCapChange || 0,
                    volume: data.volume || 0,
                    btcDominance: data.btcDominance || 0,
                    gasPrice: typeof data.gasPrice === 'object' ? data.gasPrice : { eth: data.gasPrice || 0, sol: 0 },
                });

                if (Array.isArray(data.coins)) {
                    const mappedCoins = data.coins.map((coin: any) => ({
                        id: coin.id,
                        rank: coin.market_cap_rank,
                        name: coin.name,
                        symbol: coin.symbol.toUpperCase(),
                        price: coin.current_price,
                        change24h: coin.price_change_percentage_24h,
                        change7d: coin.price_change_percentage_7d_in_currency || 0,
                        mcap: coin.market_cap,
                        vol: coin.total_volume,
                        sparkline: coin.sparkline_in_7d?.price || [],
                        image: coin.image,
                    }));
                    setCoins(mappedCoins);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setHeaderLoading(false);
            }
        }
        fetchAllData();
    }, []);

    const ethPrice = useMemo(() => coins.find(c => c.symbol === 'ETH')?.price || 0, [coins]);
    const solPrice = useMemo(() => coins.find(c => c.symbol === 'SOL')?.price || 0, [coins]);

    const filteredCoins = useMemo(() => {
        let result = coins.filter(coin =>
            coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (activeTab === 'Top Gainers') {
            result.sort((a, b) => b.change24h - a.change24h);
        } else if (activeTab === 'Top Losers') {
            result.sort((a, b) => a.change24h - b.change24h);
        } else {
            result.sort((a, b) => a.rank - b.rank);
        }
        return result;
    }, [searchTerm, activeTab, coins]);

    // 🏆 Dynamic Highlights (เก็บอันนี้ไว้ ลบอันเก่าออกแล้ว)
    const highlights = useMemo(() => {
        if (coins.length === 0) return { hot: [], gainers: [], volume: [] };

        const sortedByChange = [...coins].sort((a, b) => b.change24h - a.change24h);
        const sortedByVol = [...coins].sort((a, b) => b.vol - a.vol);

        return {
            hot: coins.filter(c => ['BTC', 'ETH', 'SOL', 'PEPE', 'DOGE'].includes(c.symbol) || Math.abs(c.change24h) > 10).slice(0, 3),
            gainers: sortedByChange.slice(0, 3),
            volume: sortedByVol.slice(0, 3),
        };
    }, [coins]);

    // Helpers
    const formatCurrency = (num: number) => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        return `$${num.toLocaleString()}`;
    };
    const formatPercent = (num: number) => `${Math.abs(num).toFixed(2)}%`;


    if (headerLoading || !globalData) {
        return <MarketSkeleton />;
    }

    return (
        <div className="w-full animate-in fade-in duration-700 space-y-6">
            {/* 1️⃣ HEADER */}
            <div className="mb-6 rounded-xl">
                {/* ✅ เปลี่ยนเป็น md:grid-cols-5 เพื่อวาง 5 ใบ */}
                <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto md:overflow-visible  md:pb-0 snap-x snap-mandatory no-scrollbar">

                    {/* 1. Global Market Cap */}
                    <HeaderCard
                        title="Market Cap"
                        value={formatCurrency(globalData.marketCap)}
                        icon={Coins}
                        change={globalData.marketCapChange}
                    />

                    {/* 2. 24h Volume */}
                    <HeaderCard
                        title="24h Volume"
                        value={formatCurrency(globalData.volume)}
                        icon={ArrowRightLeft}
                        staticLabel="24h"
                    />

                    {/* 3. BTC Dominance */}
                    <HeaderCard
                        title="BTC Dom"
                        value={`${globalData.btcDominance.toFixed(1)}%`}
                        icon={({ size, className }: any) => (
                            <img
                                src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=040"
                                alt="BTC"
                                className={className}
                                style={{ width: size, height: size }}
                            />
                        )} ก
                        progress={globalData.btcDominance}
                    />

                    {/* 4. ✅ ETH Gas Card (แยกออกมา) */}
                    <ChainGasCard
                        chain="ETH"
                        value={globalData.gasPrice.eth}
                        unit="Gwei"
                        price={ethPrice}
                        icon={({ size, className }: any) => (
                            <img
                                src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=040"
                                alt="ETH"
                                className={className}
                                style={{ width: size, height: size }}
                            />
                        )}
                        colorClass="bg-blue-500/50 text-white md:bg-blue-500/10 md:text-blue-600 md:group-hover:bg-blue-500/50 md:group-hover:text-white"
                        textColor="text-blue-600"
                    />

                    {/* 5. ✅ SOL Gas Card (แยกออกมา) */}
                    <ChainGasCard
                        chain="SOL"
                        value={globalData.gasPrice.sol}
                        unit="SOL"
                        price={solPrice}
                        icon={({ size, className }: any) => (
                            <img
                                src="https://cryptologos.cc/logos/solana-sol-logo.svg?v=040"
                                alt="SOL"
                                className={className}
                                style={{ width: size, height: size }}
                            />
                        )}
                        colorClass="bg-purple-500/50 text-white md:bg-purple-500/10 md:text-purple-600 md:group-hover:bg-purple-500/50 md:group-hover:text-white"
                        textColor="text-purple-600"
                    />
                </div>
            </div>

            {/* 2️⃣ HIGHLIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HighlightCard title="Trending / Hot" icon={Flame} data={highlights.hot} iconColor="text-orange-500" />
                <HighlightCard title="Top Gainers (24h)" icon={TrendingUp} data={highlights.gainers} iconColor="text-green-700" />
                <HighlightCard title="Top Volume (24h)" icon={Zap} data={highlights.volume} iconColor="text-blue-500" />
            </div>

            {/* 3️⃣ MAIN TABLE */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <h2 className="text-earth-darkbrown font-bold text-xl flex items-center gap-2">Crypto Market</h2>
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    {/* Tabs */}
                    <div className="flex overflow-x-auto pb-2 md:pb-0 gap-1 no-scrollbar w-full md:w-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all border ${activeTab === tab
                                    ? 'bg-earth-darkbrown text-white border-earth-darkbrown shadow-md'
                                    : 'bg-transparent text-earth-stone border-transparent hover:bg-earth-cream/50 hover:text-earth-darkbrown'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative group w-full md:w-[220px] shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-stone group-focus-within:text-earth-sage transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search Coin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-sm text-earth-darkbrown focus:outline-none focus:border-earth-sage focus:ring-1 focus:ring-earth-sage transition-all placeholder:text-earth-stone/70"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-earth-stone/20 text-earth-stone hover:bg-red-400 hover:text-white transition-all"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 shadow-xl min-h-[600px] flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1 -mx-6 px-6">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="text-[11px] text-earth-stone font-bold uppercase tracking-wider border-b border-earth-cream/60">
                                <th className="py-4 pl-2 w-10"><Star size={14} /></th>
                                <th className="py-4">Asset</th>
                                <th className="py-4 text-right">Price</th>
                                <th className="py-4 text-right">24h Change</th>
                                <th className="py-4 text-right hidden lg:table-cell">Market Cap</th>
                                <th className="py-4 text-right hidden xl:table-cell">Volume (24h)</th>
                                <th className="py-4 text-right w-[140px]">Last 7 Days</th>
                                <th className="py-4 text-right pr-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-earth-cream/40">
                            {filteredCoins.map((coin) => (
                                <tr key={coin.id} className="hover:bg-earth-cream/20 transition-colors group cursor-pointer">
                                    <td className="py-4 pl-2"><Star size={16} className="text-earth-stone/40 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" /></td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-earth-stone w-4">{coin.rank}</span>
                                            <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full shadow-sm" />
                                            <div>
                                                <div className="text-sm font-bold text-earth-darkbrown group-hover:text-earth-sage transition-colors">{coin.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-earth-stone font-mono bg-earth-cream/30 px-1 rounded">{coin.symbol}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-mono text-sm font-bold text-earth-darkbrown">
                                        {coin.price < 1 ? `$${coin.price.toFixed(6)}` : `$${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                    </td>
                                    <td className={`py-4 text-right font-mono text-sm font-medium ${coin.change24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {coin.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {Math.abs(coin.change24h).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-mono text-sm text-earth-primary hidden lg:table-cell">{formatCurrency(coin.mcap)}</td>
                                    <td className="py-4 text-right font-mono text-sm text-earth-primary hidden xl:table-cell">{formatCurrency(coin.vol)}</td>
                                    <td className="py-4 w-[140px]">
                                        <div className="flex justify-end items-center h-full opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Sparkline data={coin.sparkline} isPositive={coin.change7d >= 0} />
                                        </div>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <button className="text-xs font-bold text-earth-stone border border-earth-cream/60 px-3 py-1.5 rounded-lg hover:bg-earth-darkbrown hover:text-white hover:border-earth-darkbrown transition-all">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCoins.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-earth-cream/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-earth-stone"><Search size={32} /></div>
                            <p className="text-earth-darkbrown font-bold">No assets found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-Component: Header Card
function HeaderCard({ title, value, icon: Icon, change, progress, staticLabel }: any) {
    const isPositive = change >= 0;
    return (
        <div className="min-w-[250px] md:min-w-0 min-h-[89px] h-full px-4 py-4 flex items-center gap-4 group rounded-xl cursor-pointer transition-colors duration-300 bg-earth-darkbrown/10 md:bg-transparent md:hover:bg-earth-darkbrown/10 border border-earth-cream/60 md:border-none snap-center">
            <div className="p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0 bg-earth-darkbrown text-white md:bg-earth-darkbrown/5 md:text-earth-darkbrown md:group-hover:bg-earth-darkbrown md:group-hover:text-white">
                <Icon size={20} strokeWidth={1.5} />
            </div>
            <div className="w-full pr-2">
                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors duration-300 text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">{title}</p>
                {progress ? (
                    <div className="flex flex-col gap-1">
                        <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight leading-none whitespace-nowrap">{value}</span>
                        <div className="w-full h-1 bg-earth-darkbrown/10 rounded-full overflow-hidden mt-1">
                            <div className="h-full rounded-full transition-colors duration-300 bg-earth-darkbrown md:bg-earth-gold md:group-hover:bg-earth-darkbrown" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight whitespace-nowrap">{value}</span>
                        {change !== undefined && (
                            <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-md border ${isPositive ? 'text-green-700 bg-green-500/10 border-green-500/20' : 'text-red-700 bg-red-500/10 border-red-500/20'}`}>
                                {isPositive ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
                                {Math.abs(change).toFixed(2)}%
                            </span>
                        )}
                        {staticLabel && (
                            <span className="text-[10px] font-bold text-earth-stone/70 flex items-center bg-earth-stone/10 px-1.5 py-0.5 rounded-md border border-earth-stone/20">{staticLabel}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-Component: Highlight Card
function HighlightCard({ title, icon: Icon, data, iconColor }: any) {
    return (
        <div className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-xl flex flex-col h-[200px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-earth-darkbrown font-bold text-sm flex items-center gap-2"><Icon size={16} className={iconColor} />{title}</h3>
                <button className="text-[10px] text-earth-stone hover:text-earth-sage flex items-center gap-0.5 transition-colors">More <ChevronRight size={12} /></button>
            </div>
            <div className="flex-1 flex flex-col justify-between">
                {data.map((coin: any, i: number) => (
                    <div key={coin.id || i} className="flex justify-between items-center group cursor-pointer hover:bg-earth-cream/20 p-1.5 -mx-1.5 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-earth-stone font-mono w-3">{i + 1}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-earth-darkbrown">{coin.symbol}</span>
                                <span className="text-[10px] text-earth-stone hidden sm:inline truncate max-w-[80px]">{coin.name}</span>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                            <span className="text-xs font-mono text-earth-darkbrown">{coin.price < 1 ? `$${coin.price.toFixed(6)}` : `$${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span>
                            <span className={`text-[10px] font-bold w-12 text-right ${coin.change24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>{coin.change24h >= 0 ? '+' : ''}{Math.abs(coin.change24h).toFixed(2)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}