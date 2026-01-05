'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  AreaChart,
  BarChart,
  Cell,
  PieChart,
  Pie,
  Label,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Wallet,
} from 'lucide-react';
import type { EnrichedToken } from '@/lib/enrichWithPrices';
import type { KPIRow } from '@/lib/getSheetKPIs';
import { ZoomableChartWrapper } from '@/hook/useChartZoom';
import QtyDisplay from '@/components/QtyDisplay'; // 👈 import เข้ามา

interface DashboardSectionProps {
  initialTokens?: EnrichedToken[];
  initialHistory?: KPIRow[]; // 👈 เพิ่มบรรทัดนี้
}

// --- 🎨 Palette (Soft Earth Tone) ---
const COLORS = {
  primary: '#4A4A48',
  sage: '#A4AC86',
  green: '#606c38', // Profit/Buy
  red: '#bc4749', // Loss/Sell
  gold: '#D4A373', // Investment Line
  stone: '#C7BFB1',
  grid: '#e5e7eb',
  cream: '#F5F2EB',

  // Sentiment Specific
  lightRed: '#E89A9A',
  lightGreen: '#AEC27A',
};

function DashboardSkeleton() {
  // Helper สำหรับสร้างกล่อง Shimmer
  const ShimmerBlock = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <div className={`bg-earth-brown/30 animate-pulse rounded-xl ${className || ''}`} 
      style={style} />
  );

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Stat Cards Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[160px] flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <ShimmerBlock className="h-4 w-24" /> {/* Title */}
              <ShimmerBlock className="h-8 w-48" /> {/* Main Value */}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-earth-cream/30 pt-3">
               <div className="space-y-1">
                 <ShimmerBlock className="h-3 w-16" />
                 <ShimmerBlock className="h-5 w-20" />
               </div>
               <div className="space-y-1">
                 <ShimmerBlock className="h-3 w-16" />
                 <ShimmerBlock className="h-5 w-20" />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Middle Row: Allocation & Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Allocation (Donut) Skeleton */}
        <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[350px] shadow-xl flex flex-col">
           <ShimmerBlock className="h-6 w-32 mb-6" /> {/* Title */}
           <div className="flex items-center h-full gap-6">
              <div className="w-[180px] h-[180px] rounded-full border-[16px] border-earth-brown/30 animate-pulse mx-auto md:mx-0 relative">
                  {/* Fake Text Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-16 h-4 bg-earth-brown/30 rounded"></div>
                  </div>
              </div>
              <div className="flex-1 space-y-3 hidden md:block">
                 {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-earth-cream/50"></div>
                          <ShimmerBlock className="h-3 w-12" />
                       </div>
                       <ShimmerBlock className="h-3 w-8" />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Top Movers (Bar List) Skeleton */}
        <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[350px] shadow-xl flex flex-col">
            <ShimmerBlock className="h-6 w-40 mb-2" />
            <ShimmerBlock className="h-3 w-20 mb-6" />
            
            <div className="flex-1 space-y-5">
               {[1, 2, 3, 4, 5].map(k => (
                  <div key={k} className="flex items-center gap-3">
                     <ShimmerBlock className="h-4 w-12 shrink-0" /> {/* Symbol */}
                     <ShimmerBlock className={`h-6 rounded-md w-full max-w-[${80 - k * 10}%]`} /> {/* Bar */}
                  </div>
               ))}
            </div>
        </div>

      </div>

      {/* 3. Main Chart Row */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Left Column (Wealth + Volume) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
           {/* Total Wealth Chart */}
           <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[380px] shadow-xl space-y-4">
              <div className="flex justify-between">
                 <ShimmerBlock className="h-6 w-32" />
                 <ShimmerBlock className="h-4 w-24" />
              </div>
              <div className="flex-1 flex items-end gap-2 h-[280px] pb-2 border-l border-b border-earth-cream/30">
                  {/* Fake Wave Graph */}
                  <div className="w-full h-full bg-gradient-to-t from-earth-cream/20 to-transparent rounded-tr-3xl animate-pulse"></div>
              </div>
           </div>

           {/* Volume Chart */}
           <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[360px] shadow-xl space-y-4">
              <div className="flex justify-between">
                 <ShimmerBlock className="h-6 w-32" />
                 <div className="flex gap-2">
                    <ShimmerBlock className="h-6 w-12" />
                    <ShimmerBlock className="h-6 w-12" />
                 </div>
              </div>
              <div className="flex-1 flex items-end gap-2 mt-4">
                 {[...Array(12)].map((_, idx) => (
                    <ShimmerBlock 
                      key={idx} 
                      className="w-full rounded-t-sm" 
                      style={{ height: `${((idx * 17) % 60) + 20}%` }} 
                    />
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column (PnL + Sentiment) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            {/* PnL Trend */}
            <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 min-h-[200px] shadow-xl flex flex-col justify-between">
               <ShimmerBlock className="h-5 w-32" />
               <div className="h-[100px] w-full border-b border-earth-cream/30 relative mt-4">
                  <div className="absolute bottom-0 w-full h-[60%] bg-earth-brown/30 rounded-t-lg"></div>
               </div>
            </div>

            {/* Sentiment Barcode */}
            <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[180px] shadow-xl flex flex-col gap-4">
                <div className="flex justify-between">
                   <ShimmerBlock className="h-5 w-32" />
                   <ShimmerBlock className="h-5 w-16" />
                </div>
                <div className="flex-1 flex gap-[2px]">
                   {[...Array(20)].map((_, idx) => (
                      <div key={idx} className="flex-1 bg-earth-brown/30 h-full rounded-[1px] animate-pulse" style={{ opacity: ((idx * 13) % 10) / 10 + 0.3 }}></div>
                   ))}
                </div>
            </div>
            
            {/* Precise Execution */}
            <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 h-[340px] shadow-xl">
                <ShimmerBlock className="h-6 w-40 mb-4" />
                <div className="h-full w-full bg-earth-cream/10 rounded-lg"></div>
            </div>
        </div>

      </div>
    </div>
  );
}
export default function DashboardSection({ 
  initialTokens = [], 
  initialHistory = [] 
}: DashboardSectionProps) {

  // ✅ 3. Initialize State: ถ้ามีของส่งมา ก็ใช้เลย ไม่ต้อง Loading
  const hasInitialData = initialTokens.length > 0 || initialHistory.length > 0;
  
  const [loading, setLoading] = useState(!hasInitialData); // ถ้ามีข้อมูลแล้ว ไม่ต้องหมุน
  const [tokens, setTokens] = useState<EnrichedToken[]>(initialTokens);
  const [history, setHistory] = useState<KPIRow[]>(initialHistory);
  
  const [volTimeframe, setVolTimeframe] = useState<'1D' | '1W' | '1M'>('1D');

  // ✅ 4. แก้ useEffect: ให้ฉลาดขึ้น (ถ้ามีของแล้ว ไม่ต้อง Fetch ซ้ำ)
  useEffect(() => {
    async function fetchData() {
      // ถ้าข้อมูลครบแล้ว (ส่งมาจาก Server) ก็จบงานเลย ไม่ต้องยิง API
      if (tokens.length > 0 && history.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Logic ฉลาดเลือก: ขาดอันไหน โหลดแค่อันนั้น
        const promises = [];
        
        // ถ้าไม่มี tokens ให้โหลด
        if (tokens.length === 0) {
           promises.push(fetch('/api/enrich').then(res => res.json()));
        } else {
           promises.push(Promise.resolve(null)); // ข้าม
        }

        // ถ้าไม่มี history ให้โหลด
        if (history.length === 0) {
           promises.push(fetch('/api/history').then(res => res.json()));
        } else {
           promises.push(Promise.resolve(null)); // ข้าม
        }

        const [tokensData, historyData] = await Promise.all(promises);

        // อัปเดต State เฉพาะตัวที่โหลดมาใหม่
        if (tokensData) {
          const finalTokens = tokensData.tokens || tokensData;
          if (Array.isArray(finalTokens)) setTokens(finalTokens);
        }

        if (historyData) {
          const finalHistory = Array.isArray(historyData) ? historyData : historyData.data;
          if (Array.isArray(finalHistory)) setHistory(finalHistory);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    // สั่งรัน fetchData เฉพาะเมื่อข้อมูลไม่ครบ
    if (tokens.length === 0 || history.length === 0) {
      fetchData();
    }
  }, []);
  // 🛡️ Summary Logic (รวม Total + Other + Free)
  const summary = useMemo(() => {
    // 1. Guard Clause
    if (!tokens || tokens.length === 0) {
      return {
        totalBalance: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        winningTokens: 0,
        losingTokens: 0,
      };
    }

    // 2. Helper function เพื่อรวมยอด (Total + Other + Free)
    // ใส่ || 0 เพื่อกัน Error กรณีไม่มีคอลัมน์นั้น
    const getCombinedData = (t: any) => {
      const qty =
        Number(t.totalQty || 0) +
        Number(t.otherQty || 0) +
        Number(t.freeQty || 0);
      // ถ้าคุณแยกต้นทุน otherInv/freeInv ก็บวกเพิ่มตรงนี้ได้เลย
      // แต่ถ้าต้นทุนรวมอยู่ที่ totalInv ที่เดียว ก็ใช้แค่ totalInv ครับ
      const cost =
        Number(t.totalInv || 0) +
        Number(t.otherInv || 0) +
        Number(t.freeInv || 0);
      return { qty, cost };
    };

    // 3. Filter เอาเฉพาะตัวที่มีของ (ในกระเป๋าใดกระเป๋าหนึ่ง)
    const activeTokens = tokens.filter((t) => getCombinedData(t).qty > 0);

    // 4. คำนวณยอดเงินรวม (Grand Total)
    const totalBalance = activeTokens.reduce((acc, t) => {
      const { qty } = getCombinedData(t);
      return acc + qty * Number(t.currentPrice);
    }, 0);

    const totalInvested = activeTokens.reduce((acc, t) => {
      const { cost } = getCombinedData(t);
      return acc + cost;
    }, 0);

    const totalPnL = totalBalance - totalInvested;
    const totalPnLPercent =
      totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // 5. นับ Asset Health (Winners/Losers) จากยอดรวม
    const winningTokens = activeTokens.filter((t) => {
      const { qty, cost } = getCombinedData(t);
      const val = qty * Number(t.currentPrice);

      // เงื่อนไข: มูลค่ารวม >= ต้นทุนรวม (และต้องมีต้นทุนด้วย ถ้าจะตัดของฟรีออก)
      // แต่ถ้าจะนับ Airdrop (Cost 0) เป็น Winner ก็ใช้ val >= cost ได้เลย
      return val >= cost;
    }).length;

    const losingTokens = activeTokens.length - winningTokens;

    return {
      totalBalance,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      winningTokens,
      losingTokens,
    };
  }, [tokens]);

  // ✅ chartData: กรองวันอนาคต + Downsampling
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const rawData = [...history]
      .filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate <= today && item.value > 0;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Downsampling

    return rawData.map((item) => ({
      ...item,
      shortDate: new Date(item.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      }),
      totalWealth: item.value + (item.dividend || 0),
      pnl: item.value + (item.dividend || 0) - item.investment,
      // ✅ สร้างค่าคงที่เพื่อให้แท่งกราฟสูงเท่ากัน (เหมือน Barcode)
      barHeight: 1,
    }));
  }, [history]);

  const pnlStats = useMemo(() => {
    if (!chartData || chartData.length === 0) return { ath: 0, atl: 0 };

    const allPnLs = chartData.map((d) => d.pnl);
    return {
      ath: Math.max(...allPnLs), // จุดกำไรสูงสุด (หรือขาดทุนน้อยสุด)
      atl: Math.min(...allPnLs), // จุดขาดทุนหนักสุด (หรือกำไรน้อยสุด)
    };
  }, [chartData]);

  const latestData = useMemo(() => {
    // กรณีที่ 1: มีข้อมูลกราฟ -> ใช้ข้อมูลจากกราฟ (แม่นยำสุด)
    if (chartData && chartData.length > 0) {
      const lastItem = chartData[chartData.length - 1];
      const prevItem =
        chartData.length > 1 ? chartData[chartData.length - 2] : lastItem;

      const dayChangeValue = lastItem.totalWealth - prevItem.totalWealth;
      const dayChangePercent =
        prevItem.totalWealth > 0
          ? (dayChangeValue / prevItem.totalWealth) * 100
          : 0;

      return {
        wealth: lastItem.totalWealth,
        invested: lastItem.investment,
        pnl: lastItem.pnl,
        pnlPercent:
          lastItem.investment > 0
            ? (lastItem.pnl / lastItem.investment) * 100
            : 0,
        dayChangeValue,
        dayChangePercent,
      };
    }

    // กรณีที่ 2: Fallback (ไม่มีกราฟ) -> คำนวณสดจาก Tokens
    // (ป้องกันหน้าเว็บแสดงค่า 0 ล้วนๆ ถ้ายิง API History ไม่ผ่านแต่ Tokens มา)
    if (tokens && tokens.length > 0) {
      const activeTokens = tokens.filter((t) => t.totalQty > 0);
      const wealth = activeTokens.reduce(
        (acc, t) => acc + t.totalQty * t.currentPrice,
        0
      );
      const invested = activeTokens.reduce((acc, t) => acc + t.totalInv, 0);
      const pnl = wealth - invested;

      return {
        wealth,
        invested,
        pnl,
        pnlPercent: invested > 0 ? (pnl / invested) * 100 : 0,
        dayChangeValue: 0, // Fallback ไม่มีข้อมูลย้อนหลัง
        dayChangePercent: 0,
      };
    }

    // กรณีที่ 3: ไม่เหลืออะไรเลย -> Return 0
    return {
      wealth: 0,
      invested: 0,
      pnl: 0,
      pnlPercent: 0,
      dayChangeValue: 0,
      dayChangePercent: 0,
    };
  }, [chartData, tokens]);

  const volumeChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (volTimeframe === '1D') return chartData;

    // --- Aggregation Logic (รวมยอด) ---
    const groupedData: Record<string, any> = {};

    chartData.forEach((item) => {
      const d = new Date(item.date);
      let key = '';

      if (volTimeframe === '1W') {
        // Group รายสัปดาห์
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor(
          (d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
        );
        const weekNum = Math.ceil((d.getDay() + 1 + days) / 7);
        key = `${d.getFullYear()}-W${weekNum}`;
      } else if (volTimeframe === '1M') {
        // Group รายเดือน
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { ...item };
      } else {
        // อัปเดตวันที่เป็นวันล่าสุดของกลุ่ม
        groupedData[key].date = item.date;
        groupedData[key].shortDate = item.shortDate;

        // 🔥 สำคัญ: Volume ต้อง "บวกเพิ่ม" (Sum)
        groupedData[key].buy += item.buy;
        groupedData[key].sell += item.sell;
      }
    });

    return Object.values(groupedData);
  }, [chartData, volTimeframe]);

  // Helper Function: เลือกสีตาม Sentiment
  const getSentimentColor = (fg: number) => {
    if (fg <= 30) return COLORS.red; // Extreme Fear
    if (fg <= 45) return COLORS.lightRed; // Fear
    if (fg >= 55) return COLORS.lightGreen; // Greed
    if (fg >= 75) return COLORS.green; // Extreme Greed

    return COLORS.stone; // Neutral
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Logic แยก Tooltip ตาม DataKey
      const isSentiment = payload[0].dataKey === 'barHeight';

      return (
        <div className="bg-white/95 border border-earth-cream p-3 rounded-xl shadow-xl backdrop-blur-md min-w-[150px]">
          <p className="text-earth-primary font-mono text-xs mb-2 border-b border-earth-cream pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center text-xs mb-1 gap-3"
            >
              <span className="flex items-center gap-1 text-earth-stone">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></span>
                {isSentiment ? 'Index' : entry.name}:
              </span>
              <span className="font-mono font-medium text-earth-darkbrown">
                {isSentiment
                  ? entry.payload.f_g // ถ้าเป็น Sentiment ให้โชว์ค่าจริง (f_g) ไม่ใช่ความสูงแท่ง (1)
                  : Number(entry.value).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  if (loading) {
    return <DashboardSkeleton />;
  }

  const CustomPnLTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentPnL = payload[0].value;
      const isPositive = currentPnL >= 0;

      return (
        <div className="bg-white/95 border border-earth-cream p-3 rounded-xl shadow-xl backdrop-blur-md min-w-[180px]">
          {/* Header: วันที่ */}
          <p className="text-earth-primary font-mono text-xs mb-2 border-b border-earth-cream pb-1 font-bold">
            {label}
          </p>

          {/* 1. Current PnL (ค่าของวันนี้) */}
          <div className="flex justify-between items-center text-xs mb-3 gap-4">
            <span className="flex items-center gap-1 text-earth-stone">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPositive ? 'bg-green-600' : 'bg-red-600'
                }`}
              ></span>
              Daily PnL:
            </span>
            <span
              className={`font-mono font-bold ${
                isPositive ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isPositive ? '+' : '-'}$
              {Math.abs(currentPnL).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>

          {/* 2. Stats Section (ATH / ATL Reference) */}
          <div className="bg-earth-cream/30 -mx-3 -mb-3 p-2 rounded-b-xl border-t border-earth-cream/50 space-y-1">
            <p className="text-[9px] text-earth-stone font-bold uppercase tracking-wider mb-1 px-1">
              Global Stats
            </p>

            {/* ATH Row */}
            <div className="flex justify-between items-center text-[10px] px-1">
              <span className="text-earth-stone flex items-center gap-1">
                <span className="text-green-600">▲</span> ATH
              </span>
              <span className="font-mono text-earth-darkbrown">
                +$
                {pnlStats.ath.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>

            {/* ATL Row */}
            <div className="flex justify-between items-center text-[10px] px-1">
              <span className="text-earth-stone flex items-center gap-1">
                <span className="text-red-600">▼</span> ATL
              </span>
              <span className="font-mono text-earth-darkbrown">
                {pnlStats.atl >= 0 ? '+' : '-'}$
                {Math.abs(pnlStats.atl).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full animate-in fade-in duration-700 space-y-6">
      {/* 📊 STAT CARDS (SPLIT COMPOSITION STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Net Worth (ใช้ latestData จาก Chart) */}
        <SplitStatCard
          title="Net Worth"
          icon={Wallet}
          total={`$${latestData.wealth.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
          items={[
            {
              label: 'Principal',
              // ✅ แก้ตรงนี้: ใช้ toLocaleString ให้เหมือนยอด Total
              value: `$${latestData.invested.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`,
              color: 'text-earth-stone',
            },
            {
              label: 'Net Profit',
              // ✅ แก้ตรงนี้: ใส่ + หรือ - นำหน้า แล้วตามด้วยตัวเลขเต็มๆ (ใช้ Math.abs เพื่อไม่ให้เครื่องหมายลบซ้อน)
              value: `${latestData.pnl >= 0 ? '+' : '-'}$${Math.abs(
                latestData.pnl
              ).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`,
              color: latestData.pnl >= 0 ? 'text-green-600' : 'text-red-600',
            },
          ]}
        />

        {/* Card 2: Performance (ใช้ latestData จาก Chart) */}
        <SplitStatCard
          title="Performance"
          icon={TrendingUp}
          trend={latestData.pnl >= 0 ? 'up' : 'down'} // ลูกศรใหญ่ดูภาพรวม (กำไร/ขาดทุนสะสม)
          // ตัวเลขหลัก: ROI สะสมทั้งหมด (%)
          total={`${latestData.pnlPercent.toFixed(2)}%`}
          items={[
            // ฝั่งซ้าย: เปลี่ยนแปลง 24 ชม. (เป็นตัวเงิน $)
            {
              label: '24h Change ($)',
              value: `${latestData.dayChangeValue >= 0 ? '+' : '-'}$${Math.abs(
                latestData.dayChangeValue
              ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              color:
                latestData.dayChangeValue >= 0
                  ? 'text-green-600'
                  : 'text-red-600',
            },

            // ฝั่งขวา: เปลี่ยนแปลง 24 ชม. (เป็นเปอร์เซ็นต์ %)
            {
              label: '24h Change (%)',
              value: `${
                latestData.dayChangePercent >= 0 ? '+' : ''
              }${latestData.dayChangePercent.toFixed(2)}%`,
              color:
                latestData.dayChangePercent >= 0
                  ? 'text-green-600'
                  : 'text-red-600',
            },
          ]}
        />

        {/* Card 3: Portfolio Health (แยกเหรียญกำไร vs ขาดทุน) */}
        <SplitStatCard
          title="Asset Health"
          icon={DollarSign}
          total={`${summary.winningTokens + summary.losingTokens} Assets`}
          items={[
            {
              label: 'Winners',
              value: summary.winningTokens,
              color: 'text-green-600',
            },
            {
              label: 'Losers',
              value: summary.losingTokens,
              color: 'text-red-600',
            },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AllocationChart tokens={tokens} />
        <TopMoversCard tokens={tokens} />
      </div>

      <div className="grid grid-cols-12 gap-4 ">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* 1️⃣ CHART: PORTFOLIO WEALTH */}
          <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 shadow-xl h-[380px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-earth-darkbrown font-bold text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-earth-olive"></span>{' '}
                Total Wealth
              </h2>
              <div className="flex gap-4 text-xs font-mono text-earth-stone">
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-1"
                    style={{ backgroundColor: COLORS.gold }}
                  ></span>{' '}
                  Cost
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 opacity-50 rounded-sm"
                    style={{ backgroundColor: COLORS.green }}
                  ></span>{' '}
                  Value
                </span>
              </div>
            </div>

            <div className="flex-1 w-full -ml-2">
              <ZoomableChartWrapper originalData={chartData}>
                {(zoomedData) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={zoomedData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradWealthLight"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.green}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.green}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fill: COLORS.stone, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fill: COLORS.stone, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) =>
                          `${(val / 1000000).toFixed(1)}M`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />

                      <Area
                        type="monotone"
                        dataKey="totalWealth"
                        name="Total Wealth"
                        stroke={COLORS.green}
                        fill="url(#gradWealthLight)"
                        strokeWidth={2}
                        isAnimationActive={false}
                        activeDot={{
                          r: 6,
                          fill: COLORS.green,
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="investment"
                        name="Cost Basis"
                        stroke={COLORS.gold}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        strokeDasharray="5 5"
                        activeDot={{
                          r: 5,
                          fill: COLORS.gold,
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </ZoomableChartWrapper>
            </div>
          </div>

          {/* 2️⃣ CHART: VOLUME */}
          <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 shadow-xl h-[360px] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start mb-2">
              <div>
                <h2 className="text-earth-darkbrown font-bold text-lg">
                  Trading Volume
                </h2>
                <p className="text-xs text-earth-stone mt-1">
                  Buy vs Sell Pressure
                </p>
              </div>
              <div className="flex flex-wrap items-center  gap-5">
                <div className="flex gap-3 text-[10px] font-mono text-earth-stone bg-earth-cream/30 px-2 py-1 rounded border border-earth-cream">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: COLORS.green }}
                    ></div>{' '}
                    Buy
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: COLORS.red }}
                    ></div>{' '}
                    Sell
                  </div>
                </div>
                <div className="flex items-center bg-earth-cream/30 p-1 rounded-lg gap-1">
                  {['1D', '1W', '1M'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setVolTimeframe(tf as any)}
                      className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                        volTimeframe === tf
                          ? 'bg-white text-earth-darkbrown shadow-sm'
                          : 'text-earth-stone hover:bg-earth-cream/50'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ZoomableChartWrapper originalData={volumeChartData}>
                {(zoomedData) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={zoomedData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.grid}
                        vertical={false}
                      />

                      {/* ✅ แก้ไข XAxis ตรงนี้ครับ */}
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fill: COLORS.stone, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={50}
                        dy={10}
                      />

                      <YAxis
                        tick={{ fill: COLORS.stone, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => {
                          if (val >= 1000000)
                            return `${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                          return val;
                        }}
                      />

                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: COLORS.cream, opacity: 0.4 }}
                      />

                      {/* Bar ยังคงเดิม */}
                      <Bar
                        dataKey="buy"
                        name="Buy Vol"
                        fill={COLORS.green}
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="sell"
                        name="Sell Vol"
                        fill={COLORS.red}
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ZoomableChartWrapper>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* 3️⃣ CHART: DAILY PnL TREND */}
          <div className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-xl flex-1 min-h-[200px] flex flex-col">
            <div className="mb-2 flex justify-between items-end">
              <div>
                <h2 className="text-earth-darkbrown font-bold text-lg">
                  Daily PnL Trend
                </h2>
                <p className="text-xs text-earth-stone">Net Profit/Loss</p>
              </div>
            </div>

            <div className="flex-1 w-full">
              <ZoomableChartWrapper originalData={chartData}>
                {(zoomedData) => {
                  // คำนวณจุดตัดศูนย์
                  const gradientOffset = () => {
                    if (zoomedData.length === 0) return 0;
                    const dataMax = Math.max(...zoomedData.map((i) => i.pnl));
                    const dataMin = Math.min(...zoomedData.map((i) => i.pnl));
                    if (dataMax <= 0) return 0;
                    if (dataMin >= 0) return 1;
                    return dataMax / (dataMax - dataMin);
                  };
                  const off = gradientOffset();

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={zoomedData}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                      >
                        <defs>
                          {/* ☁️ Filter: Soft Glow (แสงฟุ้งนวล) */}
                          <filter
                            id="softGlow"
                            height="300%"
                            width="300%"
                            x="-75%"
                            y="-75%"
                          >
                            <feGaussianBlur
                              stdDeviation="1"
                              result="coloredBlur"
                            />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>

                          {/* 🎨 1. Fill Gradient: ไล่สีพื้นหลังให้ "หายวับ (0%)" เมื่อแตะเส้น 0 */}
                          <linearGradient
                            id="splitColorFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            {/* โซนกำไร (บน) */}
                            <stop
                              offset="0%"
                              stopColor={COLORS.green}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset={off}
                              stopColor={COLORS.green}
                              stopOpacity={0.05}
                            />{' '}
                            {/* แตะเส้น 0 ให้ใสเลย */}
                            {/* โซนขาดทุน (ล่าง) */}
                            <stop
                              offset={off}
                              stopColor={COLORS.red}
                              stopOpacity={0.05}
                            />{' '}
                            {/* เริ่มจากใส */}
                            <stop
                              offset="100%"
                              stopColor={COLORS.red}
                              stopOpacity={0.3}
                            />
                          </linearGradient>

                          {/* 🖌️ 2. Stroke Gradient: สร้างรอยต่อที่ "นุ่มนวล" ตรงจุดตัด */}
                          <linearGradient
                            id="splitColorStroke"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            {/* ไล่สีเขียวมาจนเกือบถึงจุดตัด */}
                            <stop
                              offset="0%"
                              stopColor={COLORS.green}
                              stopOpacity={0.5}
                            />
                            <stop
                              offset={Math.max(0, off - 0.02)}
                              stopColor={COLORS.green}
                              stopOpacity={0.5}
                            />

                            {/* ช่วงรอยต่อ (Transition Zone): ปล่อยให้ Gradient ผสมสีกันเองนิดนึง */}

                            {/* ไล่สีแดงต่อจากจุดตัด */}
                            <stop
                              offset={Math.min(1, off + 0.02)}
                              stopColor={COLORS.red}
                              stopOpacity={0.5}
                            />
                            <stop
                              offset="100%"
                              stopColor={COLORS.red}
                              stopOpacity={1}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={COLORS.grid}
                          vertical={false}
                          opacity={0.5}
                        />

                        <XAxis
                          dataKey="shortDate"
                          tick={{ fill: COLORS.stone, fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={35}
                          dy={5}
                        />

                        <YAxis
                          tick={{ fill: COLORS.stone, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) =>
                            val >= 0
                              ? `+$${(val / 1000).toFixed(0)}k`
                              : `-$${Math.abs(val / 1000).toFixed(0)}k`
                          }
                        />

                        <Tooltip content={<CustomPnLTooltip />} offset={20} />

                        <Area
                          type="monotone"
                          dataKey="pnl"
                          strokeWidth={2}
                          stroke="url(#splitColorStroke)"
                          fill="url(#splitColorFill)"
                          style={{ filter: 'url(#softGlow)' }} // ใส่ Glow ให้เส้นดูฟุ้ง
                          isAnimationActive={false}
                        />

                        <ReferenceLine
                          y={0}
                          stroke={COLORS.stone}
                          strokeDasharray="3 3"
                          opacity={0.6}
                        />
                        {/* 🔥 2. เพิ่มเส้น ATH (สีเขียว) ตรงนี้ 🔥 */}
                        <ReferenceLine
                          y={pnlStats.ath}
                          stroke={COLORS.green}
                          strokeDasharray="3 3"
                          opacity={0.5}
                        >
                          <Label
                            value="ATH"
                            position="insideTopRight"
                            fill={COLORS.green}
                            fontSize={10}
                            fontWeight="bold"
                            dy={-10} // ขยับข้อความขึ้นนิดหน่อยไม่ให้ทับเส้น
                          />
                        </ReferenceLine>

                        {/* 🔥 3. เพิ่มเส้น ATL (สีแดง) ตรงนี้ 🔥 */}
                        <ReferenceLine
                          y={pnlStats.atl}
                          stroke={COLORS.red}
                          strokeDasharray="3 3"
                          opacity={0.5}
                        >
                          <Label
                            value="ATL"
                            position="insideBottomRight"
                            fill={COLORS.red}
                            fontSize={10}
                            fontWeight="bold"
                            dy={10} // ขยับข้อความลงนิดหน่อย
                          />
                        </ReferenceLine>
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                }}
              </ZoomableChartWrapper>
            </div>
          </div>

          {/* 4️⃣ CHART: SENTIMENT BARCODE (RECHARTS VERSION) */}
          <div className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[180px]">
            <div className="mb-2 flex justify-between items-end">
              <div>
                <h2 className="text-earth-darkbrown font-bold text-lg">
                  Fear & Greed History
                </h2>
                <p className="text-xs text-earth-stone">Sentiment Trend</p>
              </div>
              {chartData.length > 0 && (
                <div className="text-right">
                  <span
                    className="text-lg font-bold block pb-4 "
                    style={{
                      color: getSentimentColor(
                        chartData[chartData.length - 1].f_g
                      ),
                    }}
                  >
                    Current: {chartData[chartData.length - 1].f_g}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <ZoomableChartWrapper originalData={chartData}>
                {(zoomedData) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={zoomedData}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      barGap={0}
                      barCategoryGap={0}
                    >
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fill: COLORS.stone, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={35}
                        dy={5}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar
                        dataKey="barHeight"
                        name="Sentiment"
                        isAnimationActive={false}
                      >
                        {/* 🔥 3. Map จาก zoomedData แทน */}
                        {zoomedData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getSentimentColor(entry.f_g)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ZoomableChartWrapper>
            </div>

            <div className="flex justify-between text-[10px] text-earth-stone mt-2 font-mono border-t border-earth-cream pt-2">
              <span>
                <span style={{ color: COLORS.red }}>●</span> Fear
              </span>
              <span>
                <span style={{ color: COLORS.stone }}>●</span> Neutral
              </span>
              <span>
                <span style={{ color: COLORS.green }}>●</span> Greed
              </span>
            </div>
          </div>
          {/* 5️⃣ CHART: PRECISE EXECUTION */}

          <div className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-xl flex flex-col h-[340px]">
            <div className="mb-2 flex justify-between items-start">
              <div>
                <h2 className="text-earth-darkbrown font-bold text-lg flex items-center gap-2">
                  Precise Execution
                </h2>

                <div className="flex items-center gap-3 mt-2">
                  {/* Sentiment Legend */}

                  <div className="flex items-center gap-1.5 text-[10px] text-earth-stone font-mono bg-earth-cream/30 px-1.5 py-0.5 rounded border border-earth-cream/50">
                    {/* Icon: Line with Dot */}

                    <div className="flex items-center w-3">
                      <div
                        className="h-0.5 w-full rounded-full"
                        style={{ backgroundColor: COLORS.primary }}
                      ></div>
                    </div>

                    <span>Fear & Greed</span>
                  </div>

                  {/* Volume Legend */}

                  <div className="flex items-center gap-1.5 text-[10px] text-earth-stone font-mono bg-earth-cream/30 px-1.5 py-0.5 rounded border border-earth-cream/50">
                    {/* Icon: Bar */}

                    <div
                      className="w-1.5 h-1.5 rounded-sm"
                      style={{ backgroundColor: COLORS.green, opacity: 0.4 }}
                    ></div>

                    <span>Buy Volume</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative ">
              <ZoomableChartWrapper originalData={chartData}>
                {(zoomedData) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={zoomedData}
                      margin={{ top: 10, right: 0, left: 10, bottom: 0 }}
                    >
                      <ReferenceArea
                        y1={75}
                        y2={100}
                        yAxisId="left"
                        fill={COLORS.red}
                        fillOpacity={0.05} // ความจาง (ปรับเลขนี้ได้ถ้าอยากให้เข้มขึ้น)
                      />

                      {/* โซนล่าง (Fear < 25): สีเขียวจางๆ */}

                      <ReferenceArea
                        y1={0}
                        y2={25}
                        yAxisId="left"
                        fill={COLORS.green}
                        fillOpacity={0.05}
                      />

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.grid}
                        vertical={false}
                      />

                      <YAxis
                        yAxisId="left"
                        domain={[0, 100]}
                        // ลบ hide ออก

                        tick={{ fill: COLORS.stone, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={20} // จองพื้นที่ความกว้างให้ตัวเลข
                      />

                      {/* Volume Axis (Right) - อันนี้ซ่อนไว้เหมือนเดิมดีแล้วครับ เดี๋ยวรก */}

                      <YAxis yAxisId="right" orientation="right" hide />

                      <XAxis
                        dataKey="shortDate"
                        tick={{ fill: COLORS.stone, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                        dy={5}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="f_g"
                        name="Fear & Greed"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={{ r: 4, fill: COLORS.primary }}
                      />

                      <Bar
                        yAxisId="right"
                        dataKey="buy"
                        name="Buy Vol"
                        fill={COLORS.green}
                        opacity={0.2}
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                      />

                      <ReferenceLine
                        yAxisId="left"
                        y={75}
                        stroke={COLORS.red}
                        strokeDasharray="3 3"
                      />

                      <ReferenceLine
                        yAxisId="left"
                        y={25}
                        stroke={COLORS.green}
                        strokeDasharray="3 3"
                      />

                      <ReferenceLine
                        yAxisId="left"
                        y={75}
                        stroke={COLORS.red}
                        strokeDasharray="3 3"
                      />

                      <ReferenceLine
                        yAxisId="left"
                        y={25}
                        stroke={COLORS.green}
                        strokeDasharray="3 3"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </ZoomableChartWrapper>
            </div>
          </div>
        </div>
      </div>
      {/* 🟢 เริ่ม: วางโค้ดส่วนใหม่ตรงนี้ (ต่อท้ายกราฟชุดใหญ่) */}
    </div>
  );
}

function SplitStatCard({ title, total, items, icon: Icon, trend }: any) {
  return (
    <div className="bg-white rounded-2xl border border-earth-cream/60 p-6 shadow-xl transition-all flex flex-col justify-between h-[160px]">
      {/* Header: Title & Total */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs font-bold text-earth-stone uppercase tracking-wider mb-1 flex items-center gap-2">
            <Icon size={14} /> {title}
          </h4>
          <h3 className="text-3xl font-bold text-earth-darkbrown tracking-tight">
            {total}
          </h3>
        </div>

        {/* Trend Badge (Optional) */}
        {trend && (
          <div
            className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend === 'up' ? '▲' : '▼'}
          </div>
        )}
      </div>

      {/* Footer: Split Items */}
      <div className="grid grid-cols-2 gap-4 border-t border-earth-cream pt-3 mt-2">
        {items.map((item: any, idx: number) => (
          <div
            key={idx}
            className={
              idx === 0 ? 'border-r border-earth-cream/40 pr-4' : 'pl-4'
            }
          >
            <p className="text-[10px] text-earth-stone mb-0.5 uppercase">
              {item.label}
            </p>
            <p
              className={`text-sm font-bold ${
                item.color || 'text-earth-darkbrown'
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
// ----------------------------------------------------------------------
// 🍰 Allocation Chart (แบบ Professional Donut + Tooltip เข้าธีม)
// ----------------------------------------------------------------------
function AllocationChart({ tokens }: { tokens: EnrichedToken[] }) {
  // 1. Prepare Data
  const { data, totalValue } = useMemo(() => {
    if (!tokens || tokens.length === 0) return { data: [], totalValue: 0 };

    const calculated = tokens
      .map((t) => {
        const qty =
          Number(t.totalQty || 0) +
          Number(t.otherQty || 0) +
          Number(t.freeQty || 0);
        const price = Number(t.currentPrice || 0);
        return {
          logo: t.logo,
          name: t.symbol || t.contract,
          value: qty * price,
        };
      })
      .filter((t) => t.value > 10) // กรองเศษ < $10 ทิ้ง
      .sort((a, b) => b.value - a.value);

    const total = calculated.reduce((acc, curr) => acc + curr.value, 0);

    // Group Small Assets
    if (calculated.length > 5) {
      const top5 = calculated.slice(0, 5);
      const othersValue = calculated
        .slice(5)
        .reduce((acc, curr) => acc + curr.value, 0);
      return {
        // ✅ สำหรับ Others เราไม่ใส่ logo หรือใส่ null
        data: [...top5, { name: 'Others', value: othersValue, logo: null }],
        totalValue: total,
      };
    }
    return { data: calculated, totalValue: total };
  }, [tokens]);

  const PIE_COLORS = [
    COLORS.green,
    COLORS.sage,
    COLORS.gold,
    COLORS.primary,
    COLORS.stone,
    '#E5E5E5',
  ];

  // 🔥 Custom Tooltip: ใช้ดีไซน์เดียวกับ Chart อื่นเป๊ะๆ แต่เพิ่ม % Port
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const percent = totalValue > 0 ? (d.value / totalValue) * 100 : 0;

      return (
        // ✅ ใช้ Class เดิมของ CustomTooltip เพื่อความ Consistency
        <div className="bg-white/95 border border-earth-cream p-3 rounded-xl shadow-xl backdrop-blur-md min-w-[140px]">
          {/* ✅ Header: Logo + Name */}
          <div className="flex items-center gap-3 mb-2 border-b border-earth-cream pb-2">
            {d.logo ? (
              <img
                src={d.logo}
                alt={d.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              // Fallback กรณีไม่มี Logo หรือเป็น Others
              <div className="w-8 h-8 rounded-full bg-earth-stone/20 flex items-center justify-center text-[8px]  text-earth-stone">
                {d.name[0]}
              </div>
            )}
            <span className="text-earth-darkbrown font-mono text-xs ">
              {d.name}
            </span>
          </div>

          {/* แถวที่ 1: มูลค่า */}
          <div className="flex justify-between items-center text-xs mb-1 gap-3">
            <span className="flex items-center gap-1 text-earth-stone">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: payload[0].fill }}
              ></span>
              Value:
            </span>
            <span className="font-mono font-medium text-earth-darkbrown">
              ${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* แถวที่ 2: เปอร์เซ็นต์ (สิ่งที่เพิ่มมา) */}
          <div className="flex justify-between items-center text-xs gap-3">
            <span className="flex items-center gap-1 text-earth-stone">
              <div className="w-2 h-2"></div> {/* Spacer ให้ตรงกัน */}
              Port:
            </span>
            <span className="font-mono font-bold text-green-700">
              {percent.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-earth-cream/60 rounded-2xl p-6 shadow-xl sm:min-h-[300px] flex flex-col">
      <h2 className="text-earth-darkbrown font-bold text-lg mb-4 flex items-center gap-2">
        Allocation
      </h2>

      <div className="flex flex-col md:flex-row items-center h-full gap-4">
        {/* 1. Chart Area (60% Width) */}
        <div className="relative w-full md:w-[60%] h-[250px]">
          {/* Center Text (ยอดรวมตรงกลางโดนัท) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-earth-darkbrown">
              <QtyDisplay qty={totalValue} prefix="$" />
            </span>
            <span className="text-[12px] text-earth-stone font-bold uppercase tracking-widest">
              TOTAL
            </span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart
              className="outline-none" // ✅ ใส่ Class นี้แทน style ครับ
              accessibilityLayer={false} // ✅ (Optional) ปิด Layer การเข้าถึงถ้าไม่จำเป็น ช่วยแก้เรื่อง Focus ได้เหมือนกัน
            >
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              {/* ✅ เรียกใช้ Tooltip ที่หน้าตาเหมือนเพื่อน แต่ฉลาดกว่า */}
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Custom Legend Area (40% Width) */}
        <div className="w-full md:w-[40%] flex flex-col gap-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
          {data.map((item, index) => {
            const percent =
              totalValue > 0 ? (item.value / totalValue) * 100 : 0;
            return (
              <div
                key={index}
                className="flex items-center justify-between text-xs group hover:bg-earth-cream/20 p-1 rounded-md transition-colors cursor-default"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  ></div>
                  <span className="text-earth-darkbrown font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-earth-stone group-hover:text-earth-darkbrown transition-colors">
                    {percent.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopMoversCard({ tokens }: { tokens: EnrichedToken[] }) {
  // 1. เตรียมข้อมูล (Logic เดิม)
  const movers = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    return tokens
      .map((t) => {
        const qty =
          Number(t.totalQty || 0) +
          Number(t.otherQty || 0) +
          Number(t.freeQty || 0);
        const cost =
          Number(t.totalInv || 0) +
          Number(t.otherInv || 0) +
          Number(t.freeInv || 0);
        const val = qty * Number(t.currentPrice);
        const pnl = val - cost;
        const pnlPercent = cost > 0 ? (pnl / cost) * 100 : val > 0 ? 100 : 0;

        return {
          symbol: t.symbol || t.contract.substring(0, 6),
          logo: t.logo,
          val,
          pnl,
          pnlPercent,
          // 🔥 เตรียมค่า Absolute ไว้สำหรับวาดกราฟ (ให้กราฟพุ่งไปทางขวาเสมอ)
          absPercent: Math.abs(pnlPercent),
        };
      })
      .filter((t) => t.val > 10)
      .sort((a, b) => b.pnlPercent - a.pnlPercent)
      .slice(0, 5);
  }, [tokens]);

  const topToken = movers[0];
  const CustomYAxisTick = ({ y, payload }: any) => {
    return (
      // transform: เลื่อนลงมาตามแกน Y (y) แต่แกน X ฟิกซ์ไว้ที่ 0 เสมอ (ซ้ายสุดของกราฟ)
      <g transform={`translate(0,${y})`}>
        <text
          x={15} // เริ่มเขียนจากพิกัด 0 (ซ้ายสุด)
          y={0}
          dy={4} // จัดกึ่งกลางบรรทัด
          textAnchor="start" // 👈 คีย์สำคัญ: สั่งให้ตัวหนังสือ "เริ่มเขียนจากซ้ายไปขวา"
          fill={COLORS.primary}
          fontSize={12}
          fontWeight={600}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // 🔥 Tooltip แบบเดียวกับ AllocationChart (Clean Code)
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // ข้อมูลต้นฉบับ
      const isPositive = data.pnlPercent >= 0;
      const color = isPositive ? COLORS.sage : COLORS.red;
      const totalCost = data.val - data.pnl;

      return (
        <div className="bg-white/95 border border-earth-cream p-3 rounded-xl shadow-xl backdrop-blur-md min-w-[160px]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2 border-b border-earth-cream pb-2">
            {data.logo ? (
              <img
                src={data.logo}
                alt={data.symbol}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-earth-stone/20 flex items-center justify-center text-[8px] font-bold text-earth-stone">
                {data.symbol[0]}
              </div>
            )}
            <span className="text-earth-darkbrown font-mono text-xs ">
              {data.symbol}
            </span>
          </div>

          {/* Value */}
          <div className="flex justify-between items-center text-xs mb-1 gap-4">
            <span className="flex items-center gap-1 text-earth-stone">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              Value:
            </span>
            <span className="font-mono font-medium text-earth-darkbrown">
              $
              {data.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* 🔥 Row 2: Cost (ต้นทุน) - เพิ่มอันนี้ */}
          <div className="flex justify-between items-center text-xs mb-1 gap-4">
            <span className="flex items-center gap-1 text-earth-stone">
              <div className="w-2 h-2"></div> {/* Spacer */}
              Cost:
            </span>
            <span className="font-mono font-medium text-earth-stone">
              $
              {totalCost.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>

          {/* 🔥 Row 3: PnL $ (กำไรเป็นตัวเงิน) - เพิ่มอันนี้ */}
          <div className="flex justify-between items-center text-xs mb-1 gap-4 border-t border-earth-cream/50 pt-1 mt-1">
            <span className="flex items-center gap-1 text-earth-stone">
              <div className="w-2 h-2"></div>
              PnL:
            </span>
            <span
              className={`font-mono font-bold ${
                isPositive ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isPositive ? '+' : ''}$
              {Math.abs(data.pnl).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>

          {/* ROI */}
          <div className="flex justify-between items-center text-xs gap-4">
            <span className="flex items-center gap-1 text-earth-stone">
              <div className="w-2 h-2"></div>
              ROI:
            </span>
            <span
              className={`font-mono font-bold ${
                isPositive ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isPositive ? '+' : ''}
              {data.pnlPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#F5F2EB] rounded-xl shadow-xl p-6 flex flex-col h-full min-h-[350px]">
      <div className="mb-2 space-y-1">
        <h2 className="text-earth-darkbrown font-bold text-lg">
          Top Performers
        </h2>
        <p className="text-earth-stone text-sm">Total Gainer</p>
      </div>

      <div className="flex-1 w-full ">
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="outline-none"
        >
          {/* layout="vertical" คือหัวใจสำคัญที่ทำให้กราฟเป็นแนวนอน */}
          <BarChart
            layout="vertical"
            data={movers}
            margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
            barCategoryGap={10} // ระยะห่างระหว่างแท่ง
            className="outline-none" // ✅ ใส่ตรงนี้
            accessibilityLayer={false}
          >
            {/* แกน X (ซ่อนไว้ เพราะเราดูตัวเลขใน Tooltip) */}
            <XAxis type="number" hide />

            {/* แกน Y (แสดงชื่อเหรียญ) */}
            <YAxis
              dataKey="symbol"
              type="category"
              width={60} // ✅ จองพื้นที่ว่างด้านซ้าย 60px ให้ตัวหนังสือ (ถ้าชื่อยาว เพิ่มเลขนี้ได้)
              tick={<CustomYAxisTick />} // ✅ เรียกใช้ตัวจัดหน้าแบบบังคับ
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={<CustomBarTooltip />}
              cursor={{ fill: COLORS.cream, opacity: 0.5 }} // Highlight แถวอัตโนมัติ (ไม่ต้องเขียนโค้ดเอง)
            />

            <Bar
              dataKey="absPercent" // ใช้ค่า Absolute เพื่อให้กราฟพุ่งไปทางขวาเสมอ
              radius={[4, 4, 4, 4]} // มนมุมขวา
              barSize={25} // ความสูงของแท่ง
              isAnimationActive={false}
              activeBar={false} // บอกว่าไม่ต้องทำสถานะ Active เวลาคลิก
              tabIndex={-1} // ปิด Animation เพื่อความเร็ว (หรือเปิดก็ได้)
            >
              {/* Map สีรายแท่ง (เขียว/แดง) */}
              {movers.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnlPercent >= 0 ? COLORS.stone : COLORS.red}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-4 border-t border-[#F5F2EB] text-sm">
        {topToken && (
          <div className="flex gap-2 items-center font-medium text-earth-darkbrown">
            Best Performance: {topToken.symbol}
            <TrendingUp className="h-4 w-4 text-earth-stone" />
          </div>
        )}
      </div>
    </div>
  );
}
