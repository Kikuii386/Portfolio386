'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, Wallet, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWalletClient } from 'wagmi'; // EVM
import { useWallet, useConnection } from '@solana/wallet-adapter-react'; // Solana
import { VersionedTransaction } from '@solana/web3.js'; // Solana Utils
import { EnrichedToken } from '@/lib/enrichWithPrices';
import { useConnectModal } from '@rainbow-me/rainbowkit'; // สำหรับ EVM
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// --- Types ---
type ChainType = 'EVM' | 'SOLANA';

interface Token {
    symbol: string;
    name: string;
    logo: string;
    address: string; // Contract Address (EVM) หรือ Mint Address (SOL)
    decimals: number;
}

interface ChainConfig {
    id: string;
    name: string;
    type: ChainType;
    logo: string;
}

// --- Config ---
const CHAINS: ChainConfig[] = [
    { id: 'ethereum', name: 'Ethereum', type: 'EVM', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { id: 'solana', name: 'Solana', type: 'SOLANA', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
    { id: 'base', name: 'Base', type: 'EVM', logo: 'https://cryptologos.cc/logos/base-token-logo.svg?v=035' }, // 0x รองรับ Base
];

// Mock Tokens (ในของจริงต้องดึงจาก Token List ตาม Chain ที่เลือก)
const MOCK_TOKENS: Record<string, Token[]> = {
    ethereum: [
        { symbol: 'ETH', name: 'Ether', decimals: 18, address: '0x...', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xa0b8...', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    ],
    solana: [
        { symbol: 'SOL', name: 'Solana', decimals: 9, address: 'So111...', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: 'EPjFW...', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    ]
};

interface SmartSwapCardProps {
    initialToken?: EnrichedToken | null;
}

export default function SmartSwapCard({ initialToken }: SmartSwapCardProps) {
    const [activeChain, setActiveChain] = useState<ChainConfig>(CHAINS[0]);
    const [fromToken, setFromToken] = useState<Token>(MOCK_TOKENS['ethereum'][0]);
    const [toToken, setToToken] = useState<Token>(MOCK_TOKENS['ethereum'][1]);
    const { openConnectModal } = useConnectModal(); // ของ RainbowKit
    const { setVisible: setSolanaModalVisible } = useWalletModal();
    const [amountIn, setAmountIn] = useState('');
    const [quoteData, setQuoteData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Hook สำหรับ EVM
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    // 2. Hook สำหรับ Solana
    const { publicKey: solAddress, signTransaction, connected: isSolConnected } = useWallet();
    const { connection } = useConnection();

    // ✅ Logic: ตั้งค่าเริ่มต้นเมื่อได้รับ initialToken
    useEffect(() => {
        if (initialToken) {
            // เช็คว่าเป็นเชนไหน
            const targetChain = CHAINS.find(c => c.name.toLowerCase() === initialToken.chain.toLowerCase()) || CHAINS[0];
            setActiveChain(targetChain);

            // สร้าง Object Token จากข้อมูลที่มี
            const newToken: Token = {
                symbol: initialToken.symbol,
                name: initialToken.name,
                logo: initialToken.logo || '/smile.png',
                address: initialToken.contract,
                decimals: (initialToken as any).decimals || 18
            };
            setFromToken(newToken);

            // เลือกตัวรับเป็น USDC ของเชนนั้นๆ อัตโนมัติ
            const tokens = MOCK_TOKENS[targetChain.id] || MOCK_TOKENS['ethereum'];
            const defaultTo = tokens.find(t => t.symbol === 'USDC') || tokens[1];
            setToToken(defaultTo);
        }
    }, [initialToken]);

    // ฟังก์ชัน Execute Swap (เมื่อกดปุ่ม Swap Now)
    const handleSwap = async () => {
        if (!quoteData) return;

        try {
            if (activeChain.type === 'SOLANA') {
                // --- Logic ฝั่ง Solana (Jupiter) ---
                if (!solAddress || !signTransaction) return alert('Connect Solana Wallet first');

                // 1. ขอ Transaction จาก API ของเรา (หรือ Jupiter)
                const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quoteResponse: quoteData.data, // ข้อมูล Quote ที่ได้มาก่อนหน้านี้
                        userPublicKey: solAddress.toString(),
                        wrapAndUnwrapSol: true,
                    })
                });

                const swapJson = await swapRes.json();

                // 2. Deserialize Transaction
                const swapTransactionBuf = Buffer.from(swapJson.swapTransaction, 'base64');
                var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

                // 3. Sign & Send
                const signature = await signTransaction(transaction); // ให้ User กดยืนยันใน Phantom

                // 4. ส่งเข้า Blockchain
                const txid = await connection.sendRawTransaction(signature.serialize());
                await connection.confirmTransaction(txid);

                alert(`Swap Success! Tx: ${txid}`);

            } else {
                // --- Logic ฝั่ง EVM (0x) ---
                if (!evmAddress || !walletClient) return alert('Connect EVM Wallet first');

                // ✅ แก้ไข: ยัด Object เข้าไปตรงๆ แล้วใส่ 'as any' เพื่อแก้ขีดแดง
                const hash = await walletClient.sendTransaction({
                    account: evmAddress,
                    to: quoteData.data.to,
                    data: quoteData.data.data,
                    value: BigInt(quoteData.data.value), // แปลงเป็น BigInt ถูกแล้ว
                    chain: null, // ใส่ null เพื่อให้ wallet จัดการเรื่อง chain เอง
                } as any);

                alert(`Swap Submitted! Hash: ${hash}`);
            }
        } catch (error) {
            console.error('Swap Failed', error);
            alert('Swap Failed');
        }
    };

    // เปลี่ยน Token List เมื่อเปลี่ยน Chain
    useEffect(() => {
        const tokens = MOCK_TOKENS[activeChain.id] || MOCK_TOKENS['ethereum'];
        setFromToken(tokens[0]);
        setToToken(tokens[1]);
        setQuoteData(null);
        setAmountIn('');
    }, [activeChain]);

    // --- 🔥 The Brain: Quote Fetcher ---
    const fetchQuote = async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) return;
        setIsLoading(true);

        try {
            if (activeChain.type === 'SOLANA') {
                // ✅ [UPDATED] เรียกผ่าน API Route ของเราเอง (/api/quote/solana)

                const amountInSmallestUnit = Math.floor(parseFloat(amount) * (10 ** fromToken.decimals));

                // สร้าง Query String ส่งไปให้หลังบ้าน
                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: toToken.address,
                    amount: amountInSmallestUnit.toString(),
                    slippageBps: '50' // 0.5% slippage
                });

                // ยิงไปที่ Local API
                const res = await fetch(`/api/quote/solana?${params.toString()}`);

                if (!res.ok) throw new Error('Solana quote failed');

                const data = await res.json();

                setQuoteData({
                    // Jupiter ส่งกลับมาเป็น outAmount (string)
                    price: parseFloat(data.outAmount) / (10 ** toToken.decimals),
                    provider: 'Jupiter',
                    data: data
                });

            } else {
                // ✅ 2. เรียกผ่าน API Route ของเราเอง (Secure Proxy)
                const amountInSmallestUnit = Math.floor(parseFloat(amount) * (10 ** fromToken.decimals));

                // ยิงไปที่ Local API ของเราแทน
                const url = `/api/quote?sellToken=${fromToken.address}&buyToken=${toToken.address}&sellAmount=${amountInSmallestUnit}`;

                // ไม่ต้องใส่ Header Key ตรงนี้แล้ว เพราะ API Route ใส่ให้แล้ว
                const res = await fetch(url);

                if (!res.ok) throw new Error('Quote failed');

                const data = await res.json();
                setQuoteData({
                    price: data.buyAmount / (10 ** toToken.decimals),
                    provider: '0x Protocol',
                    data: data
                });
            }
        } catch (error) {
            console.error("Quote Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce การพิมพ์เพื่อไม่ให้ยิง API รัวเกินไป
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (amountIn) fetchQuote(amountIn);
        }, 600);
        return () => clearTimeout(timeout);
    }, [amountIn]);

    const isChainConnected = activeChain.type === 'EVM' ? isEvmConnected : isSolConnected;

    const handleAction = () => {
        // ถ้ายังไม่เชื่อมต่อ ให้เปิด Modal ตามชนิด Chain
        if (!isChainConnected) {
            if (activeChain.type === 'EVM') {
                if (openConnectModal) openConnectModal();
            } else {
                setSolanaModalVisible(true);
            }
            return;
        }
        // ถ้าเชื่อมแล้ว ให้ Swap
        handleSwap();
    };

    const getButtonText = () => {
        if (!isChainConnected) return activeChain.type === 'EVM' ? 'Connect Wallet (EVM)' : 'Connect Wallet (SOL)';
        if (isLoading) return 'Fetching Best Price...';
        if (!amountIn) return 'Enter Amount';
        return 'Swap Now';
    };

    return (
        <div className="w-full max-w-[480px] mx-auto font-sans">
            {/* Container */}
            <div className="bg-white border border-earth-cream/60 rounded-3xl p-5 shadow-xl relative">

                {/* Header: Chain Selector */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2 bg-earth-cream/20 p-1 rounded-xl">
                        {CHAINS.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveChain(c)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeChain.id === c.id
                                    ? 'bg-white text-earth-darkbrown shadow-sm'
                                    : 'text-earth-stone hover:bg-white/50'
                                    }`}
                            >
                                <img src={c.logo} className="w-4 h-4 rounded-full" />
                                {c.name}
                            </button>
                        ))}
                    </div>
                    <button className="text-earth-stone hover:bg-earth-cream/30 p-2 rounded-full transition-colors">
                        <Settings size={20} />
                    </button>
                </div>

                {/* --- Input Section --- */}
                <div className="space-y-1">
                    {/* SELL */}
                    <div className="bg-earth-cream/30 p-4 rounded-2xl border border-transparent hover:border-earth-cream/60 transition-all">
                        <div className="flex justify-between text-xs text-earth-stone mb-2">
                            <span>You Pay</span>
                            <span>Balance: 0.00</span>
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
                                <img src={fromToken.logo} className="w-6 h-6 rounded-full" />
                                <span className="font-bold text-earth-darkbrown">{fromToken.symbol}</span>
                                <ArrowDown size={14} className="text-earth-stone" />
                            </button>
                        </div>
                    </div>

                    {/* Swap Arrow */}
                    <div className="relative h-4">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="bg-white p-2 rounded-xl border-4 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform text-earth-primary">
                                <ArrowDown size={18} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    {/* BUY */}
                    <div className="bg-earth-cream/30 p-4 rounded-2xl border border-transparent hover:border-earth-cream/60 transition-all">
                        <div className="flex justify-between text-xs text-earth-stone mb-2">
                            <span>You Receive</span>
                            <span>Balance: 0.00</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {isLoading ? (
                                <div className="w-full h-9 flex items-center">
                                    <Loader2 className="animate-spin text-earth-stone" size={24} />
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="0.00"
                                    value={quoteData ? parseFloat(quoteData.price).toFixed(6) : ''}
                                    className="w-full bg-transparent text-3xl font-bold text-earth-darkbrown outline-none placeholder:text-earth-stone/30"
                                />
                            )}
                            <button className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-earth-cream/40 shrink-0">
                                <img src={toToken.logo} className="w-6 h-6 rounded-full" />
                                <span className="font-bold text-earth-darkbrown">{toToken.symbol}</span>
                                <ArrowDown size={14} className="text-earth-stone" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Quote Info (Accordion) --- */}
                <AnimatePresence>
                    {quoteData && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 px-4 py-3 bg-earth-sage/10 rounded-xl border border-earth-sage/20 space-y-2 text-xs">
                                <div className="flex justify-between items-center text-earth-stone">
                                    <span className="flex items-center gap-1">Route via <RefreshCcw size={10} /></span>
                                    <span className="font-bold text-earth-darkbrown flex items-center gap-1">
                                        {quoteData.provider}
                                        {activeChain.type === 'SOLANA' ? '🪐' : '⚡'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-earth-stone">
                                    <span>Est. Network Fee</span>
                                    <span className="font-medium text-earth-darkbrown">~$0.05</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ✅ Action Button: ใส่ onClick แล้ว */}
                <button
                    onClick={handleAction}
                    disabled={isLoading || (!amountIn && isChainConnected)}
                    className="w-full mt-4 bg-earth-darkbrown text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#5c4a3b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-earth-darkbrown/20"
                >
                    {getButtonText()}
                </button>

            </div>
        </div>
    );
}