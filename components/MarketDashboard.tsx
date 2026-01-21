'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    YAxis,
    AreaChart,
    Area
} from 'recharts';
import {
    Search,
    Globe,
    Zap,
    TrendingUp,
    TrendingDown,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    Star,
    ChevronRight,
    Filter,
    Coins,
    ArrowRightLeft,
    Bitcoin,
    Fuel
} from 'lucide-react';
import GlobalMarketHeader from '@/components/markets/GlobalMarketHeader';

// --- 🎨 Palette (Earth Tone Theme) ---
const COLORS = {
    primary: '#4A4A48',
    sage: '#A4AC86',
    green: '#606c38',
    red: '#bc4749',
    gold: '#D4A373',
    stone: '#C7BFB1',
    cream: '#F5F2EB',
    white: '#FFFFFF',
};

interface MarketData {
    marketCap: number;
    marketCapChange: number;
    volume: number;
    volumeChange: number; // CoinGecko Free ไม่ค่อยให้ค่านี้มา อาจต้อง Mock หรือคำนวณเอง
    btcDominance: number;
    gasPrice: number;
}



const CATEGORIES = ['All', 'Favorites', 'Meme', 'AI', 'DeFi', 'Gaming', 'Layer 1', 'Solana Eco'];

const getCoinCategory = (symbol: string) => {
    if (['BTC', 'ETH', 'SOL'].includes(symbol)) return 'Layer 1';
    if (['PEPE', 'BONK'].includes(symbol)) return 'Meme';
    if (['RNDR'].includes(symbol)) return 'AI';
    if (['ONDO'].includes(symbol)) return 'DeFi';
    if (['JUP'].includes(symbol)) return 'Solana Eco';
    return 'Others';
};

// ข้อมูลเหรียญพร้อมหมวดหมู่ (Category)
const COINS_DATA = [
    { id: 1, rank: 1, name: 'Bitcoin', symbol: 'BTC', price: 64230, change24h: 2.5, change7d: 5.2, mcap: 1.2, vol: 35, category: 'Layer 1', sparkline: [60000, 61000, 60500, 62000, 63000, 62500, 64230] },
    { id: 2, rank: 2, name: 'Ethereum', symbol: 'ETH', price: 3450, change24h: 1.8, change7d: 3.1, mcap: 0.4, vol: 15, category: 'Layer 1', sparkline: [3200, 3300, 3250, 3400, 3420, 3380, 3450] },
    { id: 3, rank: 3, name: 'Solana', symbol: 'SOL', price: 145, change24h: 8.5, change7d: 12.4, mcap: 0.065, vol: 4, category: 'Layer 1', sparkline: [120, 125, 130, 128, 135, 140, 145] },
    { id: 4, rank: 4, name: 'Pepe', symbol: 'PEPE', price: 0.000012, change24h: 15.2, change7d: 40.5, mcap: 0.005, vol: 1.2, category: 'Meme', sparkline: [10, 11, 10, 12, 14, 13, 15] },
    { id: 5, rank: 5, name: 'Render', symbol: 'RNDR', price: 10.2, change24h: -2.1, change7d: 8.4, mcap: 0.004, vol: 0.3, category: 'AI', sparkline: [9, 9.5, 9.2, 9.8, 10.5, 10.1, 10.2] },
    { id: 6, rank: 6, name: 'Bonk', symbol: 'BONK', price: 0.000024, change24h: -5.4, change7d: -1.2, mcap: 0.001, vol: 0.1, category: 'Meme', sparkline: [25, 24, 26, 25, 24, 23, 24] },
    { id: 7, rank: 7, name: 'Jupiter', symbol: 'JUP', price: 1.12, change24h: 5.4, change7d: 10.2, mcap: 0.001, vol: 0.2, category: 'Solana Eco', sparkline: [1.0, 1.05, 1.02, 1.08, 1.1, 1.11, 1.12] },
    { id: 8, rank: 8, name: 'Ondo', symbol: 'ONDO', price: 0.98, change24h: 1.2, change7d: 3.5, mcap: 0.001, vol: 0.1, category: 'DeFi', sparkline: [0.9, 0.92, 0.91, 0.95, 0.96, 0.97, 0.98] },
];

// ข้อมูลสำหรับ Highlight Cards (Top Movers / Trending)
const HIGHLIGHTS = {
    hot: COINS_DATA.filter(c => c.category === 'Meme' || c.symbol === 'SOL').slice(0, 3),
    gainers: [...COINS_DATA].sort((a, b) => b.change24h - a.change24h).slice(0, 3),
    volume: [...COINS_DATA].sort((a, b) => b.vol - a.vol).slice(0, 3),
};

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
                    <Area
                        type="monotone"
                        dataKey="val"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#gradient-${isPositive ? 'up' : 'down'})`}
                        isAnimationActive={false}
                    />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- 🚀 Main Component: MarketDashboard ---
export default function MarketDashboard() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [globalData, setGlobalData] = useState<MarketData | null>(null);
    const [headerLoading, setHeaderLoading] = useState(true);
    const [coins, setCoins] = useState<any[]>(COINS_DATA);

    // 🔎 Filter Logic
    const filteredCoins = useMemo(() => {
        return coins.filter(coin => {
            const matchesSearch =
                coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                activeCategory === 'All' ||
                (activeCategory === 'Favorites' ? false : coin.category === activeCategory) || // Mock Fav logic
                (activeCategory === 'Solana Eco' ? coin.category === 'Solana Eco' || coin.symbol === 'SOL' : false);

            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    useEffect(() => {
        async function fetchAllData() {
            try {
                setHeaderLoading(true);

                // เรียก API ที่เรารวมร่างแล้ว
                const res = await fetch('/api/market/global');
                if (!res.ok) throw new Error('Failed to fetch API');

                const data = await res.json();

                // 1. Set Header Data
                setGlobalData({
                    marketCap: data.marketCap || 0,
                    marketCapChange: data.marketCapChange || 0,
                    volume: data.volume || 0,
                    volumeChange: 0, // API ไม่ส่งมา
                    btcDominance: data.btcDominance || 0,
                    gasPrice: data.gasPrice || 0,
                });

                // 2. Set Coins List & Map Data
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
                        category: getCoinCategory(coin.symbol) // ฟังก์ชันเดิมที่เราเขียนไว้
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

    const formatPrice = (num: number) => {
        return num < 1
            ? `$${num.toFixed(6)}`
            : `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    const formatCurrency = (num: number) => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        return `$${num.toLocaleString()}`;
    };

    const formatPercent = (num: number) => {
        return `${Math.abs(num).toFixed(2)}%`;
    };

    const getGasStatus = (gwei: number) => {
        if (gwei < 15) return { label: 'Low', color: 'text-green-700', bg: 'bg-green-500' };
        if (gwei < 30) return { label: 'Standard', color: 'text-yellow-700', bg: 'bg-yellow-500' };
        return { label: 'High', color: 'text-red-700', bg: 'bg-red-500' };
    };

    if (headerLoading || !globalData) {
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

    // ✅ 4. คำนวณ Gas Status ก่อน Render
    const gasStatus = getGasStatus(globalData.gasPrice);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            {/* 1️⃣ Global Market Header (Mobile: Active Style / Desktop: Hover Style) */}
            <div className="mb-6 animate-in fade-in duration-700">
                <div className="rounded-xl">
                    <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory no-scrollbar">

                        {/* --- Stat 1: Market Cap --- */}
                        <div className="min-w-[260px] md:min-w-0 snap-center px-4 py-4 flex items-center gap-4 group rounded-xl cursor-pointer transition-colors duration-300
                bg-earth-darkbrown/10 md:bg-transparent md:hover:bg-earth-darkbrown/10">
                            {/* 👆 Mobile: พื้นหลังสีเข้มเลย / Desktop: ใสก่อน Hover แล้วค่อยเข้ม */}

                            <div className="p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0
                    bg-earth-darkbrown text-white md:bg-earth-darkbrown/5 md:text-earth-darkbrown md:group-hover:bg-earth-darkbrown md:group-hover:text-white">
                                {/* 👆 Mobile: ไอคอนสีขาวพื้นน้ำตาลเลย / Desktop: สลับสีเมื่อ Hover */}
                                <Coins size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors duration-300
                        text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">
                                    {/* 👆 Mobile: ตัวหนังสือสีเข้มเลย */}
                                    Global Market Cap
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight whitespace-nowrap">
                                        {formatCurrency(globalData.marketCap)}
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-md border ${globalData.marketCapChange >= 0
                                            ? 'text-green-700 bg-green-500/10 border-green-500/20'
                                            : 'text-red-700 bg-red-500/10 border-red-500/20'
                                            }`}
                                    >
                                        {globalData.marketCapChange >= 0 ? (
                                            <ArrowUpRight size={10} className="mr-0.5" />
                                        ) : (
                                            <ArrowDownRight size={10} className="mr-0.5" />
                                        )}
                                        {formatPercent(globalData.marketCapChange)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* --- Stat 2: 24h Volume --- */}
                        <div className="min-w-[260px] md:min-w-0 snap-center px-4 py-4 flex items-center gap-4 group rounded-xl cursor-pointer transition-colors duration-300
                bg-earth-darkbrown/10 md:bg-transparent md:hover:bg-earth-darkbrown/10">

                            <div className="p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0
                    bg-earth-darkbrown text-white md:bg-earth-darkbrown/5 md:text-earth-darkbrown md:group-hover:bg-earth-darkbrown md:group-hover:text-white">
                                <ArrowRightLeft size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors duration-300
                        text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">
                                    24h Volume
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight whitespace-nowrap">
                                        {formatCurrency(globalData.volume)}
                                    </span>
                                    <span className="text-[10px] font-bold text-earth-stone/70 flex items-center bg-earth-stone/10 px-1.5 py-0.5 rounded-md border border-earth-stone/20">
                                        24h
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* --- Stat 3: BTC Dominance --- */}
                        <div className="min-w-[260px] md:min-w-0 snap-center px-4 py-4 flex items-center gap-4 group rounded-xl cursor-pointer transition-colors duration-300
                bg-earth-darkbrown/10 md:bg-transparent md:hover:bg-earth-darkbrown/10">

                            <div className="p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0
                    bg-earth-darkbrown text-white md:bg-earth-darkbrown/5 md:text-earth-darkbrown md:group-hover:bg-earth-darkbrown md:group-hover:text-white">
                                <Bitcoin size={20} strokeWidth={1.5} />
                            </div>
                            <div className="w-full pr-2">
                                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors duration-300
                        text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">
                                    BTC Dominance
                                </p>
                                <div className="flex flex-col gap-1">
                                    <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight leading-none whitespace-nowrap">
                                        {globalData.btcDominance.toFixed(1)}%
                                    </span>
                                    <div className="w-full h-1 bg-earth-darkbrown/10 rounded-full overflow-hidden mt-1">
                                        <div
                                            className="h-full rounded-full transition-colors duration-300
                                bg-earth-darkbrown md:bg-earth-gold md:group-hover:bg-earth-darkbrown"
                                            style={{ width: `${globalData.btcDominance}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Stat 4: ETH Gas --- */}
                        <div className="min-w-[260px] md:min-w-0 snap-center px-4 py-4 flex items-center gap-4 group rounded-xl cursor-pointer transition-colors duration-300
                bg-earth-darkbrown/10 md:bg-transparent md:hover:bg-earth-darkbrown/10">

                            <div className="p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0
                    bg-earth-darkbrown text-white md:bg-earth-darkbrown/5 md:text-earth-darkbrown md:group-hover:bg-earth-darkbrown md:group-hover:text-white">
                                <Fuel size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors duration-300
                        text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">
                                    ETH Gas
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-earth-darkbrown font-mono tracking-tight whitespace-nowrap">
                                        {globalData.gasPrice < 10 ? globalData.gasPrice.toFixed(2) : Math.round(globalData.gasPrice)}{' '}
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

            {/* 2️⃣ Highlight Cards (Data from API) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HighlightCard title="Trending / Hot" icon={Flame} data={HIGHLIGHTS.hot} iconColor="text-orange-500" />
                <HighlightCard title="Top Gainers (24h)" icon={TrendingUp} data={HIGHLIGHTS.gainers} iconColor="text-green-700" />
                <HighlightCard title="Top Volume (24h)" icon={Zap} data={HIGHLIGHTS.volume} iconColor="text-blue-500" />
            </div>

            {/* 3️⃣ Main Table */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <h2 className="text-earth-darkbrown font-bold text-xl flex items-center gap-2">Crypto Market</h2>
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    {/* Category Tabs */}
                    <div className="flex overflow-x-auto pb-2 md:pb-0 gap-1 no-scrollbar w-full md:w-auto">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-earth-darkbrown text-white border-earth-darkbrown shadow-md' : 'bg-transparent text-earth-stone border-transparent hover:bg-earth-cream/50 hover:text-earth-darkbrown'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative group w-full md:w-[220px] shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-stone group-focus-within:text-earth-sage transition-colors" size={16} />
                        <input type="text" placeholder="Search Coin..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-sm text-earth-darkbrown focus:outline-none focus:border-earth-sage focus:ring-1 focus:ring-earth-sage transition-all placeholder:text-earth-stone/70" />
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
                                            {/* Image from API */}
                                            <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full shadow-sm" />
                                            <div>
                                                <div className="text-sm font-bold text-earth-darkbrown group-hover:text-earth-sage transition-colors">{coin.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-earth-stone font-mono bg-earth-cream/30 px-1 rounded">{coin.symbol}</span>
                                                    {coin.category !== 'Others' && <span className="text-[9px] text-earth-stone/80 bg-earth-cream/30 px-1 rounded">{coin.category}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-mono text-sm font-bold text-earth-darkbrown">{formatPrice(coin.price)}</td>
                                    <td className={`py-4 text-right font-mono text-sm font-medium ${coin.change24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {coin.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {formatPercent(coin.change24h)}
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
                            <p className="text-sm text-earth-stone mt-1">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-Component: Highlight Card (รับ Data จริงแล้ว)
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