'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// EVM Hooks
import { useAccount, useWalletClient, useSwitchChain, useBalance, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
// Solana Hooks
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
// Components
import UnifiedWalletModal from '@/components/UnifiedWalletModal';
import { EnrichedToken } from '@/lib/enrichWithPrices';

// --- Types ---
type ChainType = 'EVM' | 'SOLANA';

interface Token {
    symbol: string;
    name: string;
    logo: string;
    address: string;
    decimals: number;
    chainId?: number; // เพิ่ม chainId สำหรับ EVM
}

interface ChainConfig {
    id: string;
    name: string;
    type: ChainType;
    chainId?: number; // EVM Chain ID
    logo: string;
}

// --- Config ---
// ✅ เพิ่ม Chain ID ให้ครบถ้วนเพื่อใช้เช็คและส่ง API
const CHAINS: ChainConfig[] = [
    { id: 'ethereum', name: 'Ethereum', type: 'EVM', chainId: 1, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { id: 'base', name: 'Base', type: 'EVM', chainId: 8453, logo: 'https://cryptologos.cc/logos/base-token-logo.svg?v=035' },
    { id: 'solana', name: 'Solana', type: 'SOLANA', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
];

// Mock Token List (เอาไว้เป็น Default ตอนเปิดมาเฉยๆ)
const DEFAULT_TOKENS: Record<string, Token[]> = {
    ethereum: [
        { symbol: 'ETH', name: 'Ether', decimals: 18, address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    ],
    base: [
        { symbol: 'ETH', name: 'Ether', decimals: 18, address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    ],
    solana: [
        { symbol: 'SOL', name: 'Solana', decimals: 9, address: 'So11111111111111111111111111111111111111112', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    ]
};

interface SmartSwapCardProps {
    initialToken?: EnrichedToken | null;
}

export default function SmartSwapCard({ initialToken }: SmartSwapCardProps) {
    // State
    const [activeChain, setActiveChain] = useState<ChainConfig>(CHAINS[0]);
    const [fromToken, setFromToken] = useState<Token>(DEFAULT_TOKENS['ethereum'][0]);
    const [toToken, setToToken] = useState<Token>(DEFAULT_TOKENS['ethereum'][1]);
    const [amountIn, setAmountIn] = useState('');
    const [quoteData, setQuoteData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);

    // Hooks
    const { address: evmAddress, isConnected: isEvmConnected, chain: currentChain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { switchChain } = useSwitchChain();

    const { publicKey: solAddress, signTransaction, connected: isSolConnected } = useWallet();
    const { connection } = useConnection();

    // Optional: Balance Hook
    // Optional: Balance Hook
    const isNative = fromToken.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    const { data: nativeBalanceData } = useBalance({
        address: evmAddress,
        chainId: activeChain.chainId,
        query: {
            enabled: isNative && !!evmAddress
        }
    });

    const { data: tokenBalanceData } = useReadContract({
        address: fromToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: evmAddress ? [evmAddress] : undefined,
        chainId: activeChain.chainId,
        query: {
            enabled: !isNative && !!evmAddress
        }
    });

    const evmBalance = isNative
        ? (nativeBalanceData
            ? {
                value: nativeBalanceData.value,
                decimals: nativeBalanceData.decimals,
                symbol: nativeBalanceData.symbol,
                formatted: formatUnits(nativeBalanceData.value, nativeBalanceData.decimals)
            }
            : undefined)
        : (tokenBalanceData !== undefined
            ? {
                formatted: formatUnits(tokenBalanceData as bigint, fromToken.decimals),
                symbol: fromToken.symbol,
                decimals: fromToken.decimals,
                value: tokenBalanceData as bigint
            }
            : undefined);

    // ✅ 1. UPDATE: Logic เมื่อได้รับ initialToken จาก SwipeableRow
    useEffect(() => {
        if (initialToken) {
            // หา Chain จากชื่อ (ต้อง map ให้ตรงกับ id ใน CHAINS)
            // sheet อาจส่งมาเป็น "ETH", "SOL", "BASE" -> ต้องแปลงเป็น id ตัวเล็ก
            const chainMap: Record<string, string> = {
                'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
                'SOL': 'solana', 'SOLANA': 'solana',
                'BASE': 'base'
            };

            const normalizedChainName = chainMap[initialToken.chain.toUpperCase()] || 'ethereum';
            const targetChain = CHAINS.find(c => c.id === normalizedChainName) || CHAINS[0];

            setActiveChain(targetChain);

            // สร้าง Token Object
            // ⚠️ WARNING: Sheet ไม่มี decimals -> ต้องหาทางรู้ให้ได้
            // วิธีแก้เบื้องต้น: เช็คชื่อเหรียญยอดนิยม
            let decimals = 18;
            if (['USDC', 'USDT'].includes(initialToken.symbol.toUpperCase())) decimals = 6;
            if (['WBTC'].includes(initialToken.symbol.toUpperCase())) decimals = 8;
            if (targetChain.type === 'SOLANA') {
                if (initialToken.symbol === 'SOL') decimals = 9;
                if (initialToken.symbol === 'USDC') decimals = 6;
            }

            const newToken: Token = {
                symbol: initialToken.symbol,
                name: initialToken.name,
                logo: initialToken.logo || '/smile.png',
                address: initialToken.contract, // EnrichedToken เก็บ address ใน field contract
                decimals: decimals,
                chainId: targetChain.chainId
            };
            setFromToken(newToken);

            // เลือก To Token เป็น USDC ของ Chain นั้นๆ (หรือ ETH ถ้าเลือก USDC มา)
            const defaults = DEFAULT_TOKENS[targetChain.id] || DEFAULT_TOKENS['ethereum'];
            const defaultTo = defaults.find(t => t.symbol !== newToken.symbol) || defaults[1];
            setToToken(defaultTo);

            setQuoteData(null);
            setAmountIn('');
        }
    }, [initialToken]);

    // ✅ 2. UPDATE: Fetch Quote Logic
    const fetchQuote = async (val: string) => {
        if (!val || parseFloat(val) <= 0) {
            setQuoteData(null);
            return;
        }
        setIsLoading(true);

        try {
            // ใช้ parseUnits เพื่อความแม่นยำ (ป้องกันปัญหา floating point)
            const amountInSmallest = parseUnits(val, fromToken.decimals).toString();

            if (activeChain.type === 'SOLANA') {
                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: toToken.address,
                    amount: amountInSmallest,
                    slippageBps: '50' // 0.5%
                });
                const res = await fetch(`/api/quote/solana?${params}`);
                if (!res.ok) throw new Error('Solana quote failed');
                const data = await res.json();

                setQuoteData({
                    // แปลงหน่วยกลับมาโชว์ (outAmount จาก Jupiter เป็น string integer)
                    price: formatUnits(BigInt(data.outAmount), toToken.decimals),
                    data: data,
                    provider: 'Jupiter'
                });

            } else {
                const params = new URLSearchParams({
                    chainId: activeChain.chainId?.toString() || '1',
                    sellToken: fromToken.address,
                    buyToken: toToken.address,
                    sellAmount: amountInSmallest,
                    takerAddress: evmAddress || '' // ส่ง address ไปด้วยเพื่อให้ 0x เช็ค allowance ได้แม่นขึ้น
                });
                const res = await fetch(`/api/quote?${params}`);
                if (!res.ok) throw new Error('EVM quote failed');
                const data = await res.json();

                setQuoteData({
                    // 0x ส่งกลับมาเป็น buyAmount
                    price: formatUnits(BigInt(data.buyAmount), toToken.decimals),
                    data: data,
                    provider: '0x Protocol'
                });
            }
        } catch (error) {
            console.error("Quote Error:", error);
            setQuoteData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce Input
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (amountIn) fetchQuote(amountIn);
        }, 600);
        return () => clearTimeout(timeout);
    }, [amountIn, fromToken, toToken]); // เพิ่ม dependencies

    // ✅ 3. UPDATE: Handle Swap
    const handleSwap = async () => {
        if (!quoteData) return;

        try {
            if (activeChain.type === 'SOLANA') {
                if (!solAddress || !signTransaction) return alert('Connect Solana Wallet first');

                const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quoteResponse: quoteData.data,
                        userPublicKey: solAddress.toString(),
                        wrapAndUnwrapSol: true,
                    })
                });

                const swapJson = await swapRes.json();
                const swapTransactionBuf = Buffer.from(swapJson.swapTransaction, 'base64');
                var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                const signature = await signTransaction(transaction);
                const txid = await connection.sendRawTransaction(signature.serialize());
                await connection.confirmTransaction(txid);
                alert(`Swap Success! Tx: ${txid}`);

            } else {
                if (!evmAddress || !walletClient) return alert('Connect EVM Wallet first');

                // เช็ค Chain ก่อนส่ง
                if (currentChain?.id !== activeChain.chainId) {
                    switchChain({ chainId: activeChain.chainId! });
                    return;
                }

                const quote = quoteData.data;
                // TODO: เพิ่ม Logic Check Allowance ตรงนี้ถ้าจำเป็น (0x api จะส่ง allowanceTarget มาให้)

                const hash = await walletClient.sendTransaction({
                    account: evmAddress as `0x${string}`,
                    to: quote.to as `0x${string}`,
                    data: quote.data as `0x${string}`,
                    value: BigInt(quote.value),
                    kzg: undefined, // Fix type error: Property 'kzg' is missing
                    chain: undefined,

                });
                alert(`Swap Submitted! Hash: ${hash}`);
            }
        } catch (error: any) {
            console.error('Swap Failed', error);
            alert(`Swap Failed: ${error.message}`);
        }
    };

    const isChainConnected = activeChain.type === 'EVM' ? isEvmConnected : isSolConnected;

    const handleAction = () => {
        if (!isChainConnected) setIsUnifiedModalOpen(true);
        else handleSwap();
    };

    const getButtonText = () => {
        if (!isChainConnected) return activeChain.type === 'EVM' ? 'Connect Wallet (EVM)' : 'Connect Wallet (SOL)';
        if (isLoading) return 'Fetching Best Price...';
        if (!amountIn) return 'Enter Amount';
        return 'Swap Now';
    };

    return (
        <div className="w-full max-w-[480px] mx-auto font-sans">
            <div className="bg-white border border-earth-cream/60 rounded-3xl p-5 shadow-xl relative">

                {/* Header: Chain Selector (disabled when from initialToken to prevent confusion) */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2 bg-earth-cream/20 p-1 rounded-xl overflow-x-auto">
                        {CHAINS.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveChain(c)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeChain.id === c.id ? 'bg-white text-earth-darkbrown shadow-sm' : 'text-earth-stone hover:bg-white/50'
                                    }`}
                            >
                                <img src={c.logo} className="w-4 h-4 rounded-full" />
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input: Sell */}
                <div className="bg-earth-cream/20 p-4 rounded-2xl border border-transparent hover:border-earth-cream/60 transition-all mb-1">
                    <div className="flex justify-between text-xs text-earth-stone mb-2">
                        <span>You Pay</span>
                        {/* โชว์ Balance จริง */}
                        <span>Balance: {activeChain.type === 'EVM' ? evmBalance?.formatted.slice(0, 6) : '0.00'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amountIn}
                            onChange={(e) => setAmountIn(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold text-earth-darkbrown outline-none placeholder:text-earth-stone/30"
                        />
                        <button className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-earth-cream/40 shrink-0">
                            {/* ใช้ logo จาก Google Sheet ถ้ามี */}
                            <img src={fromToken.logo} className="w-6 h-6 rounded-full" onError={(e) => e.currentTarget.src = '/smile.png'} />
                            <span className="font-bold text-earth-darkbrown">{fromToken.symbol}</span>
                            <ArrowDown size={14} className="text-earth-stone" />
                        </button>
                    </div>
                </div>

                {/* Swap Arrow */}
                <div className="relative h-4">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="bg-white p-2 rounded-xl border-4 border-white shadow-sm text-earth-primary">
                            <ArrowDown size={18} strokeWidth={3} />
                        </div>
                    </div>
                </div>

                {/* Input: Buy */}
                <div className="bg-earth-cream/20 p-4 rounded-2xl border border-transparent hover:border-earth-cream/60 transition-all mt-1">
                    <div className="flex justify-between text-xs text-earth-stone mb-2">
                        <span>You Receive</span>
                        {isLoading && <Loader2 className="animate-spin w-3 h-3" />}
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            readOnly
                            placeholder="0.00"
                            value={quoteData ? parseFloat(quoteData.price).toFixed(6) : ''}
                            className="w-full bg-transparent text-3xl font-bold text-earth-darkbrown outline-none placeholder:text-earth-stone/30"
                        />
                        <button className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-earth-cream/40 shrink-0">
                            <img src={toToken.logo} className="w-6 h-6 rounded-full" onError={(e) => e.currentTarget.src = '/smile.png'} />
                            <span className="font-bold text-earth-darkbrown">{toToken.symbol}</span>
                            <ArrowDown size={14} className="text-earth-stone" />
                        </button>
                    </div>
                </div>

                {/* Quote Info */}
                <AnimatePresence>
                    {quoteData && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="mt-4 px-4 py-3 bg-earth-sage/10 rounded-xl border border-earth-sage/20 space-y-2 text-xs">
                                <div className="flex justify-between items-center text-earth-stone">
                                    <span className="flex items-center gap-1">Route via <RefreshCcw size={10} /></span>
                                    <span className="font-bold text-earth-darkbrown flex items-center gap-1">
                                        {quoteData.provider}
                                        {activeChain.type === 'SOLANA' ? '🪐' : '⚡'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    disabled={isLoading || (!amountIn && isChainConnected)}
                    className="w-full mt-4 bg-earth-darkbrown text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#5c4a3b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {getButtonText()}
                </button>

            </div>

            <UnifiedWalletModal isOpen={isUnifiedModalOpen} onClose={() => setIsUnifiedModalOpen(false)} />
        </div>
    );
}