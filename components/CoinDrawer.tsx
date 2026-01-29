'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, Activity, ArrowRightLeft, Wallet, Percent } from 'lucide-react';
import {
    AreaChart, Area, YAxis, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import PriceDisplay from '@/components/PriceDisplay';

// ฟังก์ชันดึงกราฟ (เหมือนเดิม)
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

export default function CoinDrawer({ isOpen, onClose, coin }: any) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState('1');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const change24h = coin?.change24h ?? coin?.priceChangeH24 ?? 0;
    const price = coin?.currentPrice ?? coin?.price ?? 0;
    const mcap = coin?.marketCap ?? coin?.mcap ?? 0;
    // --- ส่วนคำนวณกำไรพอร์ต (Your Position) ---
    const myQty = coin?.totalQty || 0;
    const myAvgCost = coin?.totalEntry || 0;
    const myInvested = coin?.totalInv || (myQty * myAvgCost);
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

        // Period Change
        const pnl = endPrice - startPrice;
        const pnlPercent = (pnl / startPrice) * 100;

        // Diff from Avg
        const diffFromAvg = ((endPrice - avg) / avg) * 100;

        return { avg, pnl, pnlPercent, diffFromAvg };
    }, [chartData]);

    const formatXAxis = (tickItem: number) => {
        const date = new Date(tickItem);
        // ปรับ format วันที่ให้สั้นลง
        if (timeframe === '1') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatYAxis = (price: number) => {
        // ย่อตัวเลขราคาแกน Y
        if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
        if (price < 1) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(2)}`;
    };

    const formatPriceLabel = (val: number) => {
        if (val < 1) return val.toFixed(6);
        if (val > 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
        return val.toFixed(2);
    }

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

    const isPositive = change24h >= 0;
    const color = isPositive ? '#16a34a' : '#dc2626';

    return createPortal(
        <AnimatePresence>
            {isOpen && coin && (
                <>
                    {/* Backdrop: Fade In/Out */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer: Slide In/Out (ขวา) */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-[110] overflow-y-auto border-l border-earth-cream/60 flex flex-col"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[120] px-6 py-4 border-b border-earth-cream/40 flex justify-between items-center shadow-sm">
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
                        <div className="p-4 space-y-6 flex-1 overflow-y-auto">

                            {/* Price Info */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-earth-stone font-medium mb-1">Current Price</p>
                                    <div className="text-3xl font-bold text-earth-darkbrown font-mono tracking-tight">
                                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                </div>
                                <div className={`text-right ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                                    <div className="flex items-center gap-1 font-bold text-lg justify-end">
                                        {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                        {Math.abs(change24h).toFixed(2)}%
                                    </div>
                                    <p className="text-xs text-earth-stone font-medium">24h Change</p>
                                </div>
                            </div>

                            {/* Chart Container */}
                            <div className="relative w-full bg-white rounded-2xl border border-earth-cream/60 shadow-sm p-4">
                                {/* Timeframe Selector (Moved inside card for cleaner look) */}
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

                                <div className="h-[320px] w-full">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full text-earth-stone/60 animate-pulse font-medium">
                                            Loading Chart data...
                                        </div>
                                    ) : chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                                                {/* แกน Y: แสดงราคา */}
                                                <YAxis
                                                    domain={['auto', 'auto']}
                                                    tickFormatter={formatYAxis}
                                                    tick={{ fontSize: 10, fill: '#888' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={45}
                                                />

                                                {/* แกน X: แสดงวัน/เวลา */}
                                                <XAxis
                                                    dataKey="time"
                                                    tickFormatter={formatXAxis}
                                                    tick={{ fontSize: 10, fill: '#888' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    minTickGap={30}
                                                />

                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', padding: '12px' }}
                                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                                                    labelStyle={{ color: '#666', marginBottom: '4px', fontSize: '12px' }}
                                                    itemStyle={{ color: color, fontWeight: 'bold', fontSize: '14px' }}
                                                />

                                                {/* เส้นราคา */}
                                                <Area
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke={color}
                                                    strokeWidth={2}
                                                    fill="url(#colorPrice)"
                                                    animationDuration={800}
                                                />

                                                {/* เส้น Average (ค่าเฉลี่ย) */}
                                                <ReferenceLine
                                                    y={stats.avg}
                                                    stroke="#fbbf24"
                                                    strokeDasharray="4 4"
                                                    label={{
                                                        value: `AVG $${formatPriceLabel(stats.avg)}`,
                                                        position: 'insideRight',
                                                        fill: '#d97706', // สีส้มเข้มขึ้นให้อ่านง่าย
                                                        fontSize: 11,
                                                        fontWeight: 'bold',
                                                        dy: -10,
                                                    }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
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
                                            {/* ✅ เปลี่ยนชื่อเป็น Period Change ตามที่ขอครับ */}
                                            <span className="text-earth-stone font-medium">Period Change ({timeframe === '1' ? '24H' : `${timeframe} Days`})</span>
                                            <div className={`flex items-center gap-1 font-bold ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'} text-sm`}>
                                                <ArrowRightLeft size={14} />
                                                <span>{stats.pnl >= 0 ? '+' : ''}{stats.pnlPercent.toFixed(2)}%</span>
                                                <span className="opacity-70 text-xs font-normal">(${Math.abs(stats.pnl).toLocaleString(undefined, { maximumFractionDigits: 4 })})</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                            <span className="text-earth-stone font-medium flex items-center gap-1">Diff from AVG <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span></span>
                                            <div className={`flex items-center gap-1 font-bold ${stats.diffFromAvg >= 0 ? 'text-green-600' : 'text-red-600'} text-sm`}>
                                                <Percent size={14} />
                                                <span>{stats.diffFromAvg >= 0 ? '+' : ''}{stats.diffFromAvg.toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* YOUR POSITION CARD */}
                            {hasPosition && (
                                <div className="p-5 rounded-2xl bg-earth-darkbrown text-white shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                    <div className="flex items-center gap-2 mb-4 relative z-10 text-earth-cream/80">
                                        <Wallet size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Your Position</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                                        <div>
                                            <p className="text-xs text-earth-cream/60 mb-1">Avg Cost</p>
                                            <p className="text-lg font-mono font-bold">${myAvgCost.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-earth-cream/60 mb-1">Holdings</p>
                                            <p className="text-lg font-mono font-bold">{myQty.toLocaleString()} {coin.symbol}</p>
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
