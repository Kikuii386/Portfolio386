'use client';

import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import {
    Search, Star, ChevronRight, Coins, ArrowRightLeft,
    TrendingUp, TrendingDown, Zap, ArrowUpRight, ArrowDownRight, Flame, X
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltips';
import { motion, AnimatePresence } from 'framer-motion';
import PriceDisplay from './PriceDisplay';
import CoinDrawer from './CoinDrawer';
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
    let costUsd = 0;
    if (chain === 'ETH') {
        costUsd = ((value * 21000) / 1e9) * price;
    } else {
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
                        <span className="text-[10px] font-bold tracking-wider mb-0.5 transition-colors duration-300 text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">{unit}</span>
                    </div>

                    {/* Real Cost in USD */}
                    <span className={`text-[10px] font-bold mt-1 ${textColor}`}>
                        ~{formatCost(costUsd)} <span className="font-bold tracking-wider mb-0.5 transition-colors duration-300 text-earth-darkbrown md:text-earth-stone md:group-hover:text-earth-darkbrown">per tx</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

const TABS = ['All', 'Top Gainers', 'Top Losers', 'Top Volume'];

// --- 🔧 Sub-Component: Custom Tooltip สำหรับ Sparkline ---
const CustomSparklineTooltip = ({ active, payload, isPositive }: any) => {
    if (active && payload && payload.length) {
        return (
            // กล่อง Tooltip เล็กๆ พื้นขาว มีเงา
            <div className="bg-white/95 border border-earth-cream/60 shadow-xl rounded-lg px-2 py-1 text-[10px] font-mono z-50 backdrop-blur-sm">
                <span className={`font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {/* จัด format ราคาให้สวยงาม */}
                    <PriceDisplay price={payload[0].value} />
                </span>
            </div>
        );
    }
    return null;
};

// --- 📈 Main Component: Sparkline ---
const Sparkline = React.memo(({ data, isPositive }: { data: number[], isPositive: boolean }) => {
    const chartData = data.map((val, i) => ({ i, val }));
    const color = isPositive ? COLORS.green : COLORS.red;

    return (
        <div className="w-[100px] h-[35px] cursor-crosshair"> {/* เพิ่ม cursor crosshair ให้รู้ว่าชี้ได้ */}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {/* ✅ เพิ่ม Tooltip ตรงนี้ */}
                    <RechartsTooltip
                        content={<CustomSparklineTooltip isPositive={isPositive} />}
                        cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '2 2' }} // เส้น Crosshair บางๆ
                        isAnimationActive={false} // ปิด Animation เพื่อความลื่น
                        wrapperStyle={{ outline: 'none' }} // ลบเส้นขอบ default
                        offset={-40} // ขยับ Tooltip ขึ้นไปหน่อยไม่ให้บังนิ้ว/เมาส์มากเกินไป
                    />

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
});

function MarketSkeleton() {
    return (
        <div className="w-full space-y-6 animate-pulse">

            {/* 1️⃣ HEADER CARDS */}
            {/* จุดนี้ในโค้ดจริงไม่ใช่ bg-white (เป็น transparent หรือสีตามธีม) จึงใช้ Skeleton Block ตรงๆ */}
            <div className="mb-6 rounded-xl">
                <div className="flex md:grid md:grid-cols-5 gap-3 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-[89px] min-w-[240px] md:min-w-0 bg-earth-darkbrown/5 rounded-xl border border-earth-cream/60" />
                    ))}
                </div>
            </div>

            {/* 2️⃣ HIGHLIGHT CARDS */}
            {/* จุดนี้ในโค้ดจริงเป็น bg-white จึงใช้พื้นขาว แล้วใส่ Skeleton ข้างใน */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-xl h-[240px] flex flex-col">
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-earth-darkbrown/10" />
                                <div className="h-4 w-24 bg-earth-darkbrown/10 rounded" />
                            </div>
                            <div className="h-3 w-10 bg-earth-darkbrown/10 rounded" />
                        </div>
                        {/* List Items inside Card */}
                        <div className="flex-1 flex flex-col justify-between">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex justify-between items-center p-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-3 bg-earth-darkbrown/10 rounded" /> {/* Rank */}
                                        <div className="w-6 h-6 rounded-full bg-earth-darkbrown/10" /> {/* Icon */}
                                        <div className="space-y-1">
                                            <div className="w-12 h-3 bg-earth-darkbrown/10 rounded" />
                                            <div className="w-20 h-2 bg-earth-darkbrown/10 rounded" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="w-16 h-3 bg-earth-darkbrown/10 rounded" />
                                        <div className="w-10 h-2 bg-earth-darkbrown/10 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3️⃣ MAIN CONTENT (Table & Mobile Cards) */}
            {/* Controls Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 px-4">
                <div className="h-[42px] w-40 bg-earth-darkbrown/10 rounded-lg" />
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-[42px] w-24 bg-earth-darkbrown/10 rounded-xl" />)}
                    </div>
                    <div className="h-[42px] w-full md:w-64 bg-earth-darkbrown/10 rounded-xl" />
                </div>
            </div>

            {/* Container (White BG) */}
            <div className="bg-white border border-earth-cream/60 rounded-2xl shadow-xl min-h-[600px] md:h-[830px] flex flex-col relative overflow-hidden">
                <div className="overflow-hidden flex-1 w-full h-full px-2 py-2 md:px-6 md:pb-6">

                    {/* 🟢 VIEW 1: DESKTOP TABLE SKELETON (Hidden on Mobile) */}
                    <div className="hidden md:block h-full">
                        {/* Fake Header Row */}
                        <div className="flex items-center border-b border-earth-cream/60 pt-8 pb-4">
                            <div className="w-[71.97px] pl-2 flex justify-center"><div className="h-3 w-4 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[345.5px] pl-6 pr-2"><div className="h-3 w-20 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[172.75px] px-2 flex justify-end"><div className="h-3 w-16 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[172.75px] px-2 flex justify-end"><div className="h-3 w-16 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[201.53px] px-2 hidden lg:flex justify-end"><div className="h-3 w-20 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[201.53px] px-2 hidden xl:flex justify-end"><div className="h-3 w-20 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[172.75px] flex justify-end"><div className="h-3 w-16 bg-earth-darkbrown/10 rounded" /></div>
                            <div className="w-[115.22px] pr-2 flex justify-end"><div className="h-3 w-10 bg-earth-darkbrown/10 rounded" /></div>
                        </div>

                        {/* Fake Data Rows */}
                        <div className="space-y-0">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <div key={i} className="flex items-center w-full py-4 border-b border-earth-cream/40">
                                    <div className="w-[71.97px] pl-2 flex justify-center shrink-0"><div className="w-4 h-4 bg-earth-darkbrown/10 rounded-full" /></div>
                                    <div className="w-[345.5px] px-2 shrink-0 flex items-center gap-3">
                                        <div className="w-4 h-3 bg-earth-darkbrown/10 rounded shrink-0" />
                                        <div className="w-8 h-8 rounded-full bg-earth-darkbrown/10 shrink-0" />
                                        <div className="flex flex-col gap-1">
                                            <div className="w-24 h-3 bg-earth-darkbrown/10 rounded" />
                                            <div className="w-12 h-2 bg-earth-darkbrown/10 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-[172.75px] px-2 shrink-0 flex justify-end"><div className="w-20 h-3 bg-earth-darkbrown/10 rounded" /></div>
                                    <div className="w-[172.75px] px-2 shrink-0 flex justify-end"><div className="w-16 h-3 bg-earth-darkbrown/10 rounded" /></div>
                                    <div className="w-[201.53px] px-2 shrink-0 hidden lg:flex justify-end"><div className="w-24 h-3 bg-earth-darkbrown/10 rounded" /></div>
                                    <div className="w-[201.53px] px-2 shrink-0 hidden xl:flex justify-end"><div className="w-24 h-3 bg-earth-darkbrown/10 rounded" /></div>
                                    <div className="w-[172.75px] shrink-0 flex justify-end items-center"><div className="w-24 h-8 bg-earth-darkbrown/10 rounded" /></div>
                                    <div className="w-[115.22px] pr-2 shrink-0 flex justify-end"><div className="w-16 h-8 bg-earth-darkbrown/10 rounded-lg" /></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🟢 VIEW 2: MOBILE CARD SKELETON (Shown on Mobile) */}
                    <div className="md:hidden grid grid-cols-1 gap-3 pb-10">
                        {[1, 2, 3, 4, 5].map((i) => (
                            // ✅ Layout เหมือน MarketCard เป๊ะๆ
                            <div key={i} className="bg-white p-4 rounded-xl border border-earth-cream/60 shadow-sm flex flex-col gap-3">

                                {/* Row 1: Header */}
                                <div className="flex justify-between items-start">
                                    {/* Left: Logo + Text */}
                                    <div className="flex items-center gap-3">
                                        {/* Logo Circle */}
                                        <div className="w-10 h-10 rounded-full bg-earth-darkbrown/10 shrink-0" />

                                        {/* Text Col */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="w-20 h-4 bg-earth-darkbrown/10 rounded" /> {/* Symbol */}
                                            <div className="w-14 h-3 bg-earth-darkbrown/10 rounded" /> {/* Name */}
                                        </div>
                                    </div>

                                    {/* Right: Price + Change */}
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="w-24 h-5 bg-earth-darkbrown/10 rounded" /> {/* Price */}
                                        <div className="w-16 h-4 bg-earth-darkbrown/10 rounded" /> {/* Change */}
                                    </div>
                                </div>

                                {/* Row 2: Stats Box */}
                                {/* ใช้กล่องใหญ่แทนข้างใน เพื่อจำลอง Stats Box */}
                                <div className="h-12 w-full bg-earth-darkbrown/5 rounded-lg border border-earth-cream/40" />
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}

const MarketRow = React.memo(({ coin, Sparkline, onSelect, isFavorite, onToggleFavorite }: any) => {
    return (
        <motion.tr
            layout="position"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group border-b border-earth-cream/40 last:border-none relative"

        >
            <td colSpan={8} className="p-0 border-none">
                <div className="flex items-center w-full py-4 hover:bg-earth-cream/40 transition-colors duration-300 ease-in-out">
                    <div className="w-[71.97px] pl-2 text-center shrink-0">
                        <button
                            onClick={(e) => onToggleFavorite(coin.id, e)}
                            className="p-1.5 rounded-full hover:bg-earth-darkbrown/5 transition-colors focus:outline-none"
                        >
                            <Star
                                size={16}
                                className={`mx-auto transition-all duration-300 ${isFavorite
                                    ? 'text-yellow-500 fill-yellow-500 scale-110' // สีตอนเป็น Favorite
                                    : 'text-earth-stone/40 hover:text-yellow-400'  // สีตอนปกติ
                                    }`}
                            />
                        </button>
                    </div>
                    <div className="w-[345.5px] px-2 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-earth-stone w-6 text-right shrink-0">{coin.rank}</span>
                            <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full shadow-sm shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-bold text-earth-darkbrown group-hover:text-earth-sage transition-colors truncate" title={coin.name}>
                                    {coin.symbol}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-earth-stone font-mono bg-earth-cream/30 px-1 rounded">{coin.name.length > 20 ? `${coin.name.slice(0, 20)}...` : coin.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-[172.75px] px-2 text-right font-mono text-base font-bold text-earth-darkbrown shrink-0">
                        <PriceDisplay price={coin.price} />
                    </div>
                    <div className={`w-[172.75px] px-2 text-right font-mono text-base font-medium shrink-0 ${coin.change24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        <div className="flex items-center justify-end gap-1">
                            {coin.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(coin.change24h).toFixed(2)}%
                        </div>
                    </div>

                    <div className="w-[201.53px] px-2 text-right font-mono text-base text-earth-primary hidden lg:block truncate shrink-0">
                        <PriceDisplay price={coin.mcap} />
                    </div>
                    <div className="w-[201.53px] px-2 text-right font-mono text-base text-earth-primary hidden xl:block truncate shrink-0">
                        <PriceDisplay price={coin.vol} />
                    </div>

                    <div className="w-[172.75px] flex justify-end items-center opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                        <Sparkline data={coin.sparkline} isPositive={coin.change7d >= 0} />
                    </div>

                    <div className="w-[115.22px] pr-2 text-right shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(coin);
                            }} className="text-xs font-bold text-earth-stone border border-earth-cream/60 px-2 py-1 rounded-lg hover:bg-earth-darkbrown hover:text-white hover:border-earth-darkbrown transition-all duration-300 ease-in-out">
                            Details
                        </button>
                    </div>

                </div>
            </td>
        </motion.tr>
    );
});

const MarketCard = React.memo(({ coin, onSelect }: any) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // ✅ ใช้ Style Container ตามตัวอย่าง: bg-white, p-4, rounded-xl, border, shadow-sm
            className="bg-white p-4 rounded-xl border border-earth-cream/60 shadow-sm flex flex-col gap-3 transition-all duration-200 active:scale-[0.98]"
        >
            {/* --- Row 1: Header --- */}
            <div className="flex justify-between items-start">

                {/* Left: Identity */}
                <div className="flex items-center gap-3 max-w-[65%]">

                    {/* 1. Logo (ย้ายมาเป็นตัวแรกสุด) */}
                    <img
                        src={coin.image}
                        alt={coin.symbol}
                        className="w-10 h-10 rounded-full shadow-sm border border-earth-cream/40 shrink-0"
                    />

                    <div className="flex flex-col min-w-0">
                        {/* 2. Symbol + Rank (วางคู่กันตรงนี้) */}
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-earth-darkbrown/90 text-sm leading-tight truncate">
                                {coin.symbol}
                            </span>
                            {/* Rank Badge แบบ Minimal */}
                            <span className="font-mono text-[10px] font-bold text-earth-stone/60 bg-earth-cream/40 px-1.5 py-0.5 rounded-md leading-none">
                                #{coin.rank}
                            </span>
                        </div>

                        <span className="text-[11px] text-earth-stone font-medium truncate mt-0.5">
                            {coin.name}
                        </span>
                    </div>
                </div>

                {/* Right: Price & Change (เลียนแบบส่วน Balance) */}
                <div className="text-right max-w-[35%] flex flex-col items-end">
                    <div className="font-mono text-base font-bold text-earth-darkbrown leading-none">
                        <PriceDisplay price={coin.price} />
                    </div>
                    {/* Change Badge */}
                    <div className={`mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-1 leading-none ${coin.change24h >= 0
                        ? 'bg-green-100/50 text-green-700'
                        : 'bg-red-100/50 text-red-700'
                        }`}>
                        {coin.change24h >= 0 ? '▲' : '▼'}
                        {Math.abs(coin.change24h).toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* --- Row 2: Stats Box (เลียนแบบกล่อง Address) --- */}
            {/* ใช้ bg-earth-cream/50 และ border เหมือนตัวอย่างเป๊ะ */}
            <div className="flex items-center justify-between bg-earth-cream/50 border border-earth-cream/40 rounded-lg px-3 py-2">

                {/* M.Cap */}
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-0.5">

                        <span className="text-[10px] pl-3 uppercase text-earth-stone/80 font-bold tracking-wider">M.Cap</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-earth-darkbrown/90 pl-3">
                        <PriceDisplay price={coin.mcap} />
                    </span>
                </div>

                {/* Divider Line (เส้นคั่นกลางบางๆ) */}
                <div className="w-px h-6 bg-earth-cream/60 mx-2"></div>

                {/* 2. Volume + Arrow (ขวา) */}
                {/* ✅ เอา Chevron มาไว้ในนี้ ถัดจาก Volume */}
                <div className="flex items-center gap-1">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-earth-stone/80 font-bold tracking-wider mb-0.5">Vol</span>
                        <span className="font-mono text-xs font-semibold text-earth-darkbrown/90">
                            <PriceDisplay price={coin.vol} />
                        </span>
                    </div>

                    {/* ✅ ทำให้กดได้เฉพาะตรงนี้ */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // กันเหนียวไว้
                            onSelect(coin);
                        }}
                        className="p-0.5 -mr-1 rounded-lg hover:bg-earth-darkbrown/10 active:scale-90 transition-all cursor-pointer group"
                    >
                        <ChevronRight
                            size={18}
                            className="text-earth-stone/80 group-hover:text-earth-darkbrown transition-colors"
                        />
                    </button>
                </div>

            </div>

        </motion.div>
    );
});

// --- 🚀 Main Component: MarketDashboard ---
export default function MarketDashboard() {
    const [activeTab, setActiveTab] = useState('All');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [globalData, setGlobalData] = useState<MarketData | null>(null);
    const [headerLoading, setHeaderLoading] = useState(true);
    const [coins, setCoins] = useState<any[]>([]);
    const [visibleCount, setVisibleCount] = useState(50); // เริ่มต้นแสดงแค่ 50 เหรียญ
    const loadMoreRef = React.useRef(null); // ตัวจับตำแหน่งล่างสุด
    const deferredSearch = useDeferredValue(searchTerm);
    const deferredTab = useDeferredValue(activeTab);
    const [selectedCoin, setSelectedCoin] = useState<any>(null); // เก็บเหรียญที่เลือก
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const tableRef = useRef<HTMLDivElement>(null);
    const tableSectionRef = useRef<HTMLDivElement>(null);
    const handleSelectCoin = useCallback((coin: any) => {
        setSelectedCoin(coin);
        setIsDrawerOpen(true);
    }, []);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await fetch('/api/favorites');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setFavorites(data);
                    }
                }
            } catch (error) {
                console.error("Failed to load favorites from DB", error);
            }
        };
        fetchFavorites();
    }, []);

    // ✅ 3. ฟังก์ชันสำหรับ กดสลับดาว (เพิ่ม/ลบ)
    const toggleFavorite = useCallback(async (coinId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const isCurrentlyFavorite = favorites.includes(coinId);

        // Optimistic Update: สลับดาวบนหน้าจอทันทีให้ดูลื่นไหล
        setFavorites((prev) =>
            isCurrentlyFavorite
                ? prev.filter(id => id !== coinId)
                : [...prev, coinId]
        );

        // ยิงไปเซฟลง DB
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coinId: coinId,
                    isFavorite: isCurrentlyFavorite // ส่งสถานะเก่าไปให้ API รู้ว่าต้อง Insert หรือ Delete
                })
            });

            if (!res.ok) {
                // ถ้า API พัง (เช่น หมดอายุ, เน็ตหลุด) ดึงดาวกลับสถานะเดิม
                console.error("Failed to update favorite in DB");
                setFavorites((prev) =>
                    isCurrentlyFavorite
                        ? [...prev, coinId]
                        : prev.filter(id => id !== coinId)
                );
            }
        } catch (error) {
            console.error("Error toggling favorite", error);
            // Revert กลับเช่นกัน
            setFavorites((prev) =>
                isCurrentlyFavorite
                    ? [...prev, coinId]
                    : prev.filter(id => id !== coinId)
            );
        }
    }, [favorites]);

    const handleMoreClick = (tabName: string) => {
        setActiveTab(tabName); // เปลี่ยน Tab

        // สั่งให้เลื่อนลงไปที่ตารางแบบนุ่มนวล
        if (tableSectionRef.current) {
            tableSectionRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start' // เลื่อนให้ส่วนหัวตารางมาอยู่ด้านบนจอ
            });
        }
    };



    // ✅ 3. คำนวณข้อมูล: Filter -> Sort -> Slice (แก้จาก filteredCoins เดิม)
    const processedCoins = useMemo(() => {
        // 1. Search Filter (เหมือนเดิม)
        let result = coins.filter(coin =>
            coin.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(deferredSearch.toLowerCase())
        );

        // 2. Sort Logic (เพิ่มเคส Top Volume)
        if (deferredTab === 'Favorites') {
            result = result.filter(coin => favorites.includes(coin.id));
        } else if (deferredTab === 'Top Gainers') {
            result.sort((a, b) => b.change24h - a.change24h);
        } else if (deferredTab === 'Top Losers') {
            result.sort((a, b) => a.change24h - b.change24h);
        } else if (deferredTab === 'Top Volume') {
            // 🆕 เพิ่ม Logic เรียงตาม Volume มาก -> น้อย
            result.sort((a, b) => b.vol - a.vol);
        } else {
            // Tab: 'All' (หรือ Trending) -> เรียงตาม Rank (Market Cap)
            result.sort((a, b) => a.rank - b.rank);
        }
        return result;
    }, [coins, deferredSearch, deferredTab, favorites]);

    const visibleCoins = useMemo(() => {
        return processedCoins.slice(0, visibleCount);
    }, [processedCoins, visibleCount]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 50, processedCoins.length));
                }
            },
            { threshold: 0.1 }
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [processedCoins]);


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

    const highlights = useMemo(() => {
        if (coins.length === 0) return { hot: [], gainers: [], volume: [] };
        const sortedByChange = [...coins].sort((a, b) => b.change24h - a.change24h);
        const sortedByVol = [...coins].sort((a, b) => b.vol - a.vol);
        const sortedByMcap = [...coins].sort((a, b) => b.mcap - a.mcap);

        return {
            hot: sortedByMcap.slice(0, 3),
            gainers: sortedByChange.slice(0, 3),
            volume: sortedByVol.slice(0, 3),
        };
    }, [coins]);

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
                        value={<PriceDisplay price={globalData.marketCap} />}
                        icon={Coins}
                        change={globalData.marketCapChange}
                    />

                    {/* 2. 24h Volume */}
                    <HeaderCard
                        title="24h Volume"
                        value={<PriceDisplay price={globalData.volume} />}
                        icon={ArrowRightLeft}
                        staticLabel="24h"
                    />

                    {/* 3. BTC Dominance */}
                    <HeaderCard
                        title="BTC Dom"
                        value={`${globalData.btcDominance.toFixed(1)}%`}
                        icon={({ size, className }: any) => (
                            <img
                                src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg"
                                alt="BTC"
                                className={className}
                                referrerPolicy="no-referrer"
                                style={{ width: size, height: size }}
                            />
                        )}
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
                                src="https://cryptologos.cc/logos/ethereum-eth-logo.svg"
                                alt="ETH"
                                className={className}
                                referrerPolicy="no-referrer"
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
                                src="https://cryptologos.cc/logos/solana-sol-logo.svg"
                                alt="SOL"
                                className={className}
                                referrerPolicy="no-referrer"
                                style={{ width: size, height: size }}
                            />
                        )}
                        colorClass="bg-purple-500/50 text-white md:bg-purple-500/10 md:text-purple-600 md:group-hover:bg-purple-500/50 md:group-hover:text-white"
                        textColor="text-purple-600"
                    />
                </div>
            </div>

            {/* 2️⃣ HIGHLIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex flex-col">
                <HighlightCard title="Trending / Hot" icon={Flame} data={highlights.hot} iconColor="text-orange-500" onMoreClick={() => handleMoreClick('All')} />
                <HighlightCard title="Top Gainers (24h)" icon={TrendingUp} data={highlights.gainers} iconColor="text-green-700" onMoreClick={() => handleMoreClick('Top Gainers')} />
                <HighlightCard title="Top Volume (24h)" icon={Zap} data={highlights.volume} iconColor="text-blue-500" onMoreClick={() => handleMoreClick('Top Volume')} />
            </div>

            {/* 3️⃣ MAIN TABLE */}
            <div ref={tableSectionRef} className="scroll-mt-25 flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 px-4">
                <h2 className="text-earth-darkbrown font-bold text-xl flex items-center gap-2 h-[42px]">Crypto Market</h2>
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    {/* Tabs */}
                    {/* ✅ ลบ h-[42px] ออก, ปรับ gap-2 */}
                    <div className="flex overflow-x-auto md:pb-0 gap-2 h-[42px] w-full md:w-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                // ✅ ปรับ py-2.5 (ให้เท่า Search), text-sm (อ่านง่ายขึ้น), rounded-xl (โค้งเท่ากัน)
                                className={`px-5 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 border flex-shrink-0 ${activeTab === tab
                                    ? 'bg-earth-darkbrown text-white border-earth-darkbrown shadow-md'

                                    : ' bg-white/80 text-earth-stone/80 border-earth-stone/40 hover:bg-earth-sage hover:text-white hover:border-earth-sage'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="w-full md:w-auto flex items-center gap-4 bg-white rounded-xl border border-earth-stone/40">
                        <div className="relative w-full group">
                            <div className=" absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone/80 group-focus-within:text-earth-sage transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tokens or addresses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-10 py-2.5 w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown placeholder-earth-stone/80 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all text-sm font-mono hover:bg-earth-cream/30"
                            />

                            {searchTerm && (

                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
                                    <Tooltip content="Clear" side="bottom">
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="p-1 rounded-full bg-earth-brown/50 text-white hover:bg-red-400 transition-all duration-200 shadow-sm hover:scale-110 flex items-center justify-center text-sm"
                                        >
                                            <X size={10} strokeWidth={4} />
                                        </button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-earth-cream/60 rounded-2xl shadow-xl h-[630px] md:h-[830px] flex flex-col relative overflow-hidden">

                {/* 2. Scroll Container: รวม Scrollbar ไว้ตรงนี้ (ทั้งแนวตั้งและแนวนอน) */}
                <div className="overflow-auto custom-scrollbar flex-1 w-full h-full px-4 pb-4 pb-4 md:px-6 md:pb-6 ">
                    <div className="md:hidden sticky top-0 z-30 bg-white py-3 px-4 pt-6 shadow-sm flex justify-between items-center text-[10px] font-bold text-earth-stone uppercase tracking-wider w-full">
                        <span className="pl-2">Asset</span>
                        <span className="pr-2">Price / 24h</span>
                    </div>
                    <div className="hidden md:block">
                        <table className="w-full text-left border-collapse min-w-[800px] table-fixed">

                            {/* 3. Sticky Header: จะเกาะติดขอบบนของ Scroll Container นี้ */}
                            <thead className="sticky top-0 z-20 shadow-sm">
                                <tr className="text-[12px] text-earth-stone font-bold uppercase tracking-wider border-b border-earth-cream/60">

                                    {/* 2. Header Cells: เพิ่ม pt-10 (หรือ pt-8) เพื่อสร้างพื้นที่ว่างด้านบน และใส่ bg-white */}
                                    <th className="bg-white pt-8 pb-4 pl-2 w-[71.97px] text-center">#</th>
                                    <th className="bg-white pr-2 pl-6 pt-8 pb-4 text-left w-[345.5px]">Asset</th>
                                    <th className="bg-white px-2 pt-8 pb-4 text-right w-[172.75px]">Price</th>
                                    <th className="bg-white px-2 pt-8 pb-4 text-right w-[172.75px]">24h Change</th>
                                    <th className="bg-white px-2 pt-8 pb-4 text-right hidden lg:table-cell w-[201.53px]">Market Cap</th>
                                    <th className="bg-white px-2 pt-8 pb-4 text-right hidden xl:table-cell w-[201.53px]">Volume (24h)</th>
                                    <th className="bg-white pt-8 pb-4 text-right w-[172.75px]">Last 7 Days</th>
                                    <th className="bg-white pt-8 pb-4 text-right pr-2 w-[115.22px]">Action</th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-earth-cream/40">
                                <AnimatePresence >
                                    {visibleCoins.map((coin) => (
                                        <MarketRow
                                            key={coin.id}
                                            coin={coin}
                                            Sparkline={Sparkline}
                                            onSelect={handleSelectCoin}
                                            isFavorite={favorites.includes(coin.id)}
                                            onToggleFavorite={toggleFavorite}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    {/* 🟢 VIEW 2: CARDS (สำหรับ Mobile) - โชว์เฉพาะมือถือ */}
                    <div className="grid grid-cols-1 gap-3 md:hidden pb-4">
                        <AnimatePresence mode='popLayout'>
                            {visibleCoins.map((coin) => (
                                <MarketCard
                                    key={coin.id}
                                    coin={coin}
                                    Sparkline={Sparkline}
                                    onSelect={handleSelectCoin}
                                    isFavorite={favorites.includes(coin.id)}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                    {/* ✅ 9. ตัว Loading More */}
                    {visibleCoins.length < processedCoins.length && (
                        <div ref={loadMoreRef} className="py-6 text-center text-earth-stone text-xs animate-pulse">
                            Loading more assets...
                        </div>
                    )}

                    {/* ✅ 10. แก้ filteredCoins -> processedCoins */}
                    {processedCoins.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-earth-cream/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-earth-stone"><Search size={32} /></div>
                            <p className="text-earth-darkbrown font-bold">No assets found</p>
                        </div>
                    )}
                </div>
            </div>
            <CoinDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                coin={selectedCoin}
            />
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
function HighlightCard({ title, icon: Icon, data, iconColor, onMoreClick }: any) {
    return (
        // 1️⃣ ปรับความสูงเป็น h-[240px] เพื่อรองรับ logo และ font ที่ใหญ่ขึ้น
        <div className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-xl flex flex-col h-[240px]">

            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-earth-darkbrown font-bold text-md flex items-center gap-2">
                    <Icon size={16} className={iconColor} />
                    {title}
                </h3>
                <button
                    onClick={onMoreClick}
                    className="text-xs text-earth-stone hover:text-earth-sage flex items-center gap-0.5 transition-colors">
                    More <ChevronRight size={12} />
                </button>
            </div>

            {/* List Items */}
            <div className="flex-1 flex flex-col justify-between">
                {data.map((coin: any, i: number) => (
                    <div key={coin.id || i} className="flex justify-between items-center group cursor-pointer hover:bg-earth-cream/40 p-2 rounded-xl transition-colors duration-300">

                        {/* LEFT: Rank + Logo + Symbol */}
                        <div className="flex items-center gap-3 overflow-hidden">
                            {/* Rank */}
                            <span className="text-xs font-mono font-bold text-earth-stone/60 w-4 shrink-0 text-center">
                                {i + 1}
                            </span>

                            {/* ✅ Logo Image */}
                            <img
                                src={coin.image}
                                alt={coin.symbol}
                                className="w-6 h-6 rounded-full shadow-sm shrink-0"
                            />

                            {/* Symbol & Name */}
                            <div className="flex flex-col truncate pr-2">
                                <span className="text-sm font-semibold text-earth-darkbrown leading-tight">
                                    {coin.symbol}
                                </span>
                                <span className="text-[10px] text-earth-stone truncate leading-tight hidden sm:block">
                                    {coin.name}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Price & Percent (Stack บนล่างเพื่อให้ตัวใหญ่ได้) */}
                        <div className="text-right flex flex-col items-end shrink-0">
                            <span className="text-sm text-earth-darkbrown leading-tight">
                                <PriceDisplay price={coin.price} />
                            </span>
                            <span className={`text-xs font-semibold leading-tight mt-0.5 ${coin.change24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}