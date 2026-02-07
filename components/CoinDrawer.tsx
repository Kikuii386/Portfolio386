'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, Activity, ArrowRightLeft, Wallet, Percent, Target } from 'lucide-react';
import {
    AreaChart, Area, YAxis, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import PriceDisplay from '@/components/PriceDisplay';
import QtyDisplay from '@/components/QtyDisplay';
import { ZoomableChartWrapper } from '@/hook/useChartZoom';

// --- Helpers คงเดิมทั้งหมด ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-earth-cream/60 min-w-[150px]">
                <p className="text-xs text-earth-stone mb-2 pb-2 border-b border-earth-cream/40">
                    {new Date(label).toLocaleString()}
                </p>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-xs font-bold text-earth-stone flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].stroke }}></span>
                        Price
                    </span>
                    <div className="text-sm font-bold text-earth-darkbrown">
                        <PriceDisplay price={payload[0].value} />
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const fetchChartFromApi = async (params: string) => {
    try {
        const res = await fetch(`/api/coin/chart?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.prices?.map((item: number[]) => ({
            time: item[0],
            price: item[1]
        })) || [];
    } catch (error) {
        console.error("Failed to fetch chart", error);
        return [];
    }
};

const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
        <foreignObject x={0} y={y - 10} width={60} height={20} style={{ overflow: 'visible' }}>
            <div className="flex justify-end items-center h-full">
                <div className="text-[10px] text-[#888] font-medium">
                    <PriceDisplay price={payload.value} />
                </div>
            </div>
        </foreignObject>
    );
};

const MyCostLabel = (props: any) => {
    const { viewBox, price } = props;
    return (
        <foreignObject x={viewBox.width - 100} y={viewBox.y - 24} width={100} height={24} style={{ overflow: 'visible' }}>
            <div className="flex justify-end items-center h-full">
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#0891b2]"
                    style={{ textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, -2px 0 0 #fff, 2px 0 0 #fff, 0 -2px 0 #fff, 0 2px 0 #fff' }}>
                    <span className="whitespace-nowrap">My Cost</span>
                    <PriceDisplay price={price} />
                </div>
            </div>
        </foreignObject>
    );
};

interface CoinDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    coin: any;
    viewMode?: string;
}

export default function CoinDrawer({ isOpen, onClose, coin, viewMode }: CoinDrawerProps) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState('1');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // ✅ เพิ่ม State เช็ค Mobile
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // เช็คขนาดหน้าจอ
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- Logic คำนวณ (คงเดิม) ---
    const price = coin?.currentPrice ?? coin?.price ?? 0;
    const mcap = coin?.marketCap ?? coin?.mcap ?? 0;
    const myQty = viewMode === 'high' ? coin?.highQty : viewMode === 'low' ? coin?.lowQty : viewMode === 'other' ? coin?.otherQty : viewMode === 'free' ? coin?.freeQty : coin?.totalQty || 0;
    const myAvgCost = viewMode === 'high' ? coin?.highEntry : viewMode === 'low' ? coin?.lowEntry : viewMode === 'other' ? coin?.otherEntry : viewMode === 'free' ? coin?.freeEntry : coin?.totalEntry || 0;
    const myInvested = viewMode === 'high' ? coin?.highInv : viewMode === 'low' ? coin?.lowInv : viewMode === 'other' ? coin?.otherInv : viewMode === 'free' ? coin?.freeInv : coin?.totalInv || 0;
    const myCurrentValue = myQty * price;
    const myProfitVal = myCurrentValue - myInvested;
    const myProfitPct = myAvgCost > 0 ? ((price - myAvgCost) / myAvgCost) * 100 : 0;
    const hasPosition = myQty > 0;

    const stats = useMemo(() => {
        if (!chartData.length) return { avg: 0, pnl: 0, pnlPercent: 0, diffFromAvg: 0 };
        const sum = chartData.reduce((a, b) => a + b.price, 0);
        const avg = sum / chartData.length;
        const startPrice = chartData[0].price;
        const endPrice = chartData[chartData.length - 1].price;
        const pnl = endPrice - startPrice;
        const pnlPercent = (pnl / startPrice) * 100;
        const diffFromAvg = ((endPrice - avg) / avg) * 100;
        return { avg, pnl, pnlPercent, diffFromAvg };
    }, [chartData]);

    const rawChange24h = coin?.priceChangeH24;
    const useFallback = rawChange24h === null || rawChange24h === undefined;
    const displayChange = useFallback ? (stats.pnlPercent || 0) : rawChange24h;
    const isPositive = displayChange >= 0;
    const changeLabel = useFallback
        ? `Change (${timeframe === '1' ? '24H' : `${timeframe}D`})`
        : "24h Change";
    const color = isPositive ? '#16a34a' : '#dc2626';

    const formatXAxis = (tickItem: number) => {
        const date = new Date(tickItem);
        if (timeframe === '1') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    useEffect(() => {
        const loadData = async () => {
            if (!coin) return;
            setIsLoading(true);
            setMounted(true);
            setChartData([]);
            const params = new URLSearchParams();
            params.set('days', timeframe);
            const geckoId = coin.geckoId || coin.coingecko_id || (coin.id && !coin.id.startsWith('0x') ? coin.id : null);
            if (geckoId) {
                params.set('id', geckoId);
            } else if (coin.chain && (coin.contract_address || coin.address)) {
                params.set('chain', coin.chain);
                params.set('address', coin.contract_address || coin.address);
            } else {
                setIsLoading(false);
                return;
            }
            const data = await fetchChartFromApi(params.toString());
            if (data.length > 0) setChartData(data);
            setIsLoading(false);
        };
        if (isOpen && coin) loadData();
    }, [coin, timeframe, isOpen]);

    if (!mounted) return null;


    // ✅ Animation Variants: แยกท่าทาง Mobile/Desktop
    const drawerVariants = {
        hidden: isMobile ? { y: '100%' } : { x: '100%' },
        visible: isMobile ? { y: 0 } : { x: 0 },
        exit: isMobile ? { y: '100%' } : { x: '100%' }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && coin && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    <motion.div
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        // ✅ Class หลัก: ใช้ md: นำหน้าเพื่อบังคับ Style Desktop เดิม
                        // ✅ ส่วนที่ไม่มี md: คือ Style Mobile
                        className={`
                            fixed z-[100] bg-white shadow-2xl flex flex-col border-earth-cream/60
                            
                            /* Desktop Style (Original) */
                            md:right-0 md:top-0 md:h-full md:w-[480px] md:border-l md:rounded-none md:bottom-auto md:left-auto
                            
                            /* Mobile Style (New) */
                            bottom-0 left-0 w-full h-[90dvh] rounded-t-[24px] border-t
                        `}
                    >
                        {/* ✅ Mobile Handle (แสดงเฉพาะ Mobile) */}
                        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-earth-cream/80 rounded-full" />
                        </div>

                        {/* Header (Desktop Style คงเดิม, Mobile เพิ่ม rounded-t) */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[100] px-6 py-4 border-b border-earth-cream/40 flex justify-between items-center shadow-sm rounded-t-[24px] md:rounded-none">
                            <div className="flex items-center gap-3">
                                <img src={coin.image || coin.logo || '/smile.png'} alt={coin.symbol} className="w-10 h-10 rounded-full shadow-sm bg-white p-0.5 border border-earth-cream" />
                                <div>
                                    <h2 className="text-lg font-bold text-earth-darkbrown leading-tight">{coin.name}</h2>
                                    <span className="text-xs font-mono text-earth-stone bg-earth-cream/30 px-1.5 py-0.5 rounded uppercase">{coin.symbol || coin.chain}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-earth-cream/30 rounded-full transition-colors text-earth-stone hover:text-earth-darkbrown">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 pt-4 space-y-6 flex-1 overflow-y-auto pb-10 md:pb-0"> {/* Mobile เพิ่ม padding ล่างกันตกจอ */}

                            {/* Price Info */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-earth-stone font-medium mb-1">Current Price</p>
                                    <div className="text-3xl font-bold text-earth-darkbrown font-mono tracking-tight">
                                        <PriceDisplay price={price} />
                                    </div>
                                </div>
                                <div className={`text-right ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                                    <div className="flex items-center gap-1 font-bold text-lg justify-end">
                                        {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                        {Math.abs(displayChange).toFixed(2)}%
                                    </div>
                                    <p className="text-xs text-earth-stone font-medium">{changeLabel}</p>
                                </div>
                            </div>

                            {/* Chart Container */}
                            <div className="relative w-full bg-white rounded-2xl border border-earth-cream/60 shadow-sm p-4 overflow-hidden h-[477px]">
                                <div className="flex justify-end mb-4">
                                    <div className="flex bg-earth-cream/20 rounded-lg p-1 gap-1">
                                        {[
                                            { label: '24H', value: '1' },
                                            { label: '7D', value: '7' },
                                            { label: '30D', value: '30' },
                                            { label: '90D', value: '90' },
                                        ].map((tf) => (
                                            <button
                                                key={tf.value}
                                                onClick={() => setTimeframe(tf.value)}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === tf.value
                                                    ? 'bg-white text-earth-darkbrown shadow-sm border border-earth-cream/50'
                                                    : 'text-earth-stone hover:bg-white/50 hover:text-earth-darkbrown'
                                                    }`}
                                            >
                                                {tf.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-[320px] w-full -ml-2 min-h-0">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full text-earth-stone/60 animate-pulse font-medium ">
                                            Loading Chart data...
                                        </div>
                                    ) : chartData.length > 0 ? (
                                        <ZoomableChartWrapper originalData={chartData}>
                                            {(zoomedData: any[]) => (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart
                                                        data={zoomedData}
                                                        margin={{ top: 10, right: 0, left: 10, bottom: 0 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1" >
                                                                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <YAxis domain={['auto', 'auto']} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} width={65} />
                                                        <XAxis dataKey="time" tickFormatter={formatXAxis} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} minTickGap={30} dy={10} allowDataOverflow={true} />
                                                        <Tooltip wrapperStyle={{ pointerEvents: 'none' }} content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4', style: { pointerEvents: 'none' } }} />
                                                        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#colorPrice)" isAnimationActive={false} activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2, style: { pointerEvents: 'none' } }} />
                                                        {hasPosition && myAvgCost > 0 && (
                                                            <ReferenceLine y={myAvgCost} stroke="#06b6d4" strokeDasharray="4 4" label={(props) => <MyCostLabel {...props} price={myAvgCost} />} />
                                                        )}
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            )}
                                        </ZoomableChartWrapper>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-earth-stone/40">
                                            <Activity size={40} className="mb-2 opacity-50" />
                                            <span className="text-sm font-medium">No chart data available</span>
                                        </div>
                                    )}
                                </div>

                                {chartData.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-earth-cream/40 grid grid-cols-2 gap-4 text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-earth-stone font-medium">Period Change ({timeframe === '1' ? '24H' : `${timeframe} Days`})</span>
                                            <div className={`flex items-center gap-1 font-bold ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'} text-sm`}>
                                                <ArrowRightLeft size={14} />
                                                <span>{stats.pnl >= 0 ? '+' : ''}{stats.pnlPercent.toFixed(2)}%</span>
                                                <span className="opacity-70 text-xs font-normal">(${Math.abs(stats.pnl).toLocaleString(undefined, { maximumFractionDigits: 4 })})</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                            <span className="text-earth-stone font-medium flex items-center gap-1">
                                                Market Cap
                                            </span>
                                            <div className="flex items-center gap-1 font-bold text-earth-darkbrown text-sm">
                                                <Activity size={14} className="text-earth-stone/70" />
                                                <span>
                                                    ${mcap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* YOUR POSITION CARD */}
                            {hasPosition && (
                                <div className="p-5 rounded-2xl bg-earth-darkbrown text-white shadow-lg relative overflow-hidden mb-6"> {/* Mobile เพิ่ม mb-6 */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                    <div className="flex items-center gap-2 mb-4 relative z-10 text-earth-cream/80">
                                        <Wallet size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">({viewMode?.toUpperCase() || 'TOTAL'})</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                                        <div>
                                            <p className="text-xs text-earth-cream/60 mb-1 flex items-center gap-1">
                                                <Target size={10} /> Avg Cost
                                            </p>
                                            <div className="text-lg font-mono font-bold">
                                                <PriceDisplay price={myAvgCost} />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-earth-cream/60 mb-1">Quantity</p>
                                            <p className="text-lg font-mono font-bold">
                                                <QtyDisplay qty={myQty} prefix="" />
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-earth-cream/60 mb-1">Invested</p>
                                            <p className="text-base font-mono font-medium opacity-90">${myInvested.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-earth-cream/60 mb-1">Current Value</p>
                                            <p className="text-base font-mono font-bold">${myCurrentValue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                                        <span className="text-xs text-earth-cream/80 font-medium">Unrealized PnL</span>
                                        <div className={`text-right ${myProfitVal >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                                            <div className="text-xl font-bold font-mono">
                                                {myProfitVal >= 0 ? '+' : ''}${Math.abs(myProfitVal).toLocaleString()}
                                            </div>
                                            <div className="text-xs font-bold bg-white/10 px-1.5 py-0.5 rounded inline-block mt-1">
                                                {myProfitVal >= 0 ? '▲' : '▼'} {Math.abs(myProfitPct).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}