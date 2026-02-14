'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, Loader2, RefreshCcw, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// EVM Hooks
import { useAccount, useWalletClient, useSwitchChain, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, erc20Abi, type Address } from 'viem';
// Solana Hooks
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
// Components
import UnifiedWalletModal from '@/components/UnifiedWalletModal';
import { EnrichedToken } from '@/lib/enrichWithPrices';
import TokenSelectorModal, { Token } from '@/components/TokenSelectorModal';

// --- Types ---
type ChainType = 'EVM' | 'SOLANA';

interface ChainConfig {
    id: string;
    name: string;
    type: ChainType;
    chainId?: number; // EVM Chain ID
    logo: string;
    tokenListUrl?: string;
}

const CHAINS: ChainConfig[] = [
    {
        id: 'ethereum', name: 'Ethereum', type: 'EVM', chainId: 1,
        logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
        // ✅ เรียก API Route ที่เราเพิ่งสร้าง
        tokenListUrl: '/api/tokens?chain=ethereum'
    },
    {
        id: 'base', name: 'Base', type: 'EVM', chainId: 8453,
        logo: 'https://cryptologos.cc/logos/base-token-logo.svg?v=035',
        // ✅ เรียก API Route ที่เราเพิ่งสร้าง
        tokenListUrl: '/api/tokens?chain=base'
    },
    {
        id: 'solana', name: 'Solana', type: 'SOLANA',
        logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
        // ✅ เรียก API Route ที่เราเพิ่งสร้าง
        tokenListUrl: '/api/tokens?chain=solana'
    },
];

interface SmartSwapCardProps {
    initialToken?: EnrichedToken | null;
}

export default function SmartSwapCard({ initialToken }: SmartSwapCardProps) {
    // State
    const [activeChain, setActiveChain] = useState<ChainConfig>(CHAINS[0]);
    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken, setToToken] = useState<Token | null>(null);
    const [tokenList, setTokenList] = useState<Token[]>([]);
    const [amountIn, setAmountIn] = useState('');
    const [quoteData, setQuoteData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Hooks
    const { address: evmAddress, isConnected: isEvmConnected, chain: currentChain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { switchChain } = useSwitchChain();

    const { publicKey: solAddress, signTransaction, connected: isSolConnected } = useWallet();
    const { connection } = useConnection();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState<'from' | 'to'>('from');

    // Optional: Balance Hook
    // Optional: Balance Hook
    const isNative = fromToken?.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    const { data: nativeBalanceData } = useBalance({
        address: evmAddress,
        chainId: activeChain.chainId,
        query: {
            // เพิ่ม !fromToken เช็คด้วย
            enabled: !!fromToken && isNative && !!evmAddress
        }
    });

    const { data: tokenBalanceData } = useReadContract({
        address: fromToken?.address as `0x${string}`, // ใส่ ? กันเหนียว
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: evmAddress ? [evmAddress] : undefined,
        chainId: activeChain.chainId,
        query: {
            // เพิ่ม !fromToken เช็คด้วย
            enabled: !!fromToken && !isNative && !!evmAddress
        }
    });

    let displayBalance = '0.00';

    // ตรวจสอบว่ามี User และมี Token ให้เช็คไหม
    if (evmAddress && fromToken) {
        // กรณี 1: เป็น Native Token (ETH) และโหลดข้อมูลเสร็จแล้ว
        if (isNative && nativeBalanceData) {
            displayBalance = formatUnits(nativeBalanceData.value, nativeBalanceData.decimals);
        }
        // กรณี 2: เป็น ERC20 Token (USDC, etc.) และโหลดข้อมูลเสร็จแล้ว
        else if (!isNative && tokenBalanceData !== undefined) {
            displayBalance = formatUnits(tokenBalanceData as bigint, fromToken.decimals);
        }
    }

    // ตัดทศนิยมให้สวยงาม (เช่น ไม่เกิน 6 ตำแหน่ง)
    const formattedBalance = displayBalance.includes('.')
        ? displayBalance.slice(0, displayBalance.indexOf('.') + 7)
        : displayBalance;

    useEffect(() => {
        const fetchTokens = async () => {
            if (!activeChain.tokenListUrl) return;
            try {
                const res = await fetch(activeChain.tokenListUrl);
                const data = await res.json();

                let tokens: Token[] = [];

                // แปลงข้อมูลให้ตรง Format ของเรา
                if (activeChain.type === 'SOLANA') {
                    tokens = data.map((t: any) => ({
                        symbol: t.symbol, name: t.name, address: t.address, decimals: t.decimals, logo: t.logoURI, chainId: 0
                    }));
                } else {
                    tokens = data.tokens
                        .filter((t: any) => t.chainId === activeChain.chainId)
                        .map((t: any) => ({
                            symbol: t.symbol, name: t.name, address: t.address, decimals: t.decimals, logo: t.logoURI, chainId: t.chainId
                        }));
                }

                // เพิ่ม Native Token (ETH/SOL) ถ้าไม่มี
                if (activeChain.type === 'EVM' && !tokens.find(t => t.symbol === 'ETH')) {
                    tokens.unshift({ symbol: 'ETH', name: 'Ether', decimals: 18, address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: activeChain.chainId });
                }
                if (activeChain.type === 'SOLANA' && !tokens.find(t => t.symbol === 'SOL')) {
                    tokens.unshift({ symbol: 'SOL', name: 'Solana', decimals: 9, address: 'So11111111111111111111111111111111111111112', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg', chainId: 0 });
                }

                setTokenList(tokens);

                // ตั้งค่าเริ่มต้น (ถ้ายังไม่มี)
                if (tokens.length > 0 && !fromToken) setFromToken(tokens[0]);
                if (tokens.length > 1 && !toToken) {
                    const usdc = tokens.find(t => t.symbol === 'USDC');
                    setToToken(usdc || tokens[1]);
                }

            } catch (error) {
                console.error("Failed to load tokens", error);
            }
        };

        fetchTokens();
    }, [activeChain]);

    // ✅ 1. UPDATE: Logic เมื่อได้รับ initialToken จาก SwipeableRow
    useEffect(() => {
        if (initialToken) {
            // 1. หา Chain
            const chainMap: Record<string, string> = {
                'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
                'SOL': 'solana', 'SOLANA': 'solana',
                'BASE': 'base'
            };

            const normalizedChainName = chainMap[initialToken.chain.toUpperCase()] || 'ethereum';
            const targetChain = CHAINS.find(c => c.id === normalizedChainName) || CHAINS[0];

            setActiveChain(targetChain);

            // 2. หา Decimals (ปรับปรุงใหม่)
            let decimals = 18; // Default

            // พยายามหาเหรียญนี้ใน tokenList ก่อน เพื่อเอา decimals ของจริง
            const foundInList = tokenList.find(t =>
                t.address.toLowerCase() === initialToken.contract.toLowerCase()
            );

            if (foundInList) {
                decimals = foundInList.decimals; // ✅ เจอใน list ใช้ของจริงเลย
            } else {
                // ⚠️ ถ้ายังไม่โหลด list หรือหาไม่เจอ -> ใช้ Logic การเดาเหมือนเดิม
                if (['USDC', 'USDT'].includes(initialToken.symbol.toUpperCase())) decimals = 6;
                if (['WBTC'].includes(initialToken.symbol.toUpperCase())) decimals = 8;
                if (targetChain.type === 'SOLANA') {
                    if (initialToken.symbol === 'SOL') decimals = 9;
                    if (initialToken.symbol === 'USDC') decimals = 6;
                }
            }

            const newToken: Token = {
                symbol: initialToken.symbol,
                name: initialToken.name,
                logo: initialToken.logo || '/smile.png',
                address: initialToken.contract,
                decimals: decimals,
                chainId: targetChain.chainId
            };
            setFromToken(newToken);

            // 3. เลือก To Token จาก tokenList (เลิกใช้ DEFAULT_TOKENS)
            if (tokenList.length > 0) {
                // ถ้า TokenList โหลดเสร็จแล้ว ให้หา USDC ใน List นั้น
                const usdc = tokenList.find(t => t.symbol === 'USDC');
                const native = tokenList.find(t => t.symbol === 'ETH' || t.symbol === 'SOL' || t.symbol === 'WETH');

                // Logic สลับคู่: ถ้าเราขาย USDC -> ให้ Default ช่องรับเป็น ETH/SOL
                if (newToken.symbol === 'USDC' && native) {
                    setToToken(native);
                } else if (usdc) {
                    // กรณีอื่น -> ให้ Default ช่องรับเป็น USDC
                    setToToken(usdc);
                } else {
                    // ถ้าหาไม่เจอจริงๆ เอาตัวที่ 2 ของ List
                    setToToken(tokenList[1] || tokenList[0]);
                }
            } else {
                // กรณี TokenList ยังโหลดไม่เสร็จ (List ว่าง) 
                // ตั้งเป็น null ไปก่อน หรือใส่ Placeholder ชั่วคราว (เดี๋ยวพอมันโหลดเสร็จ User ค่อยกดเลือกใหม่ได้)
                setToToken(null);
            }

            setQuoteData(null);
            setAmountIn('');
        }
    }, [initialToken, tokenList]);

    // ✅ CHECK ALLOWANCE (EVM Only)
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: fromToken?.address as Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [evmAddress as Address, quoteData?.data?.allowanceTarget as Address],
        chainId: activeChain.chainId,
        query: {
            enabled: !!evmAddress && !!fromToken && !isNative && !!quoteData?.data?.allowanceTarget && activeChain.type === 'EVM',
        }
    });

    // ✅ WATCH APPROVE TRANSACTION
    const { writeContractAsync: approveToken } = useWriteContract();

    // Check if needs approval
    useEffect(() => {
        if (activeChain.type !== 'EVM' || isNative || !amountIn || !quoteData || !allowance) {
            setNeedsApproval(false);
            return;
        }

        const amountBigInt = parseUnits(amountIn, fromToken?.decimals || 18);
        if (allowance < amountBigInt) {
            setNeedsApproval(true);
        } else {
            setNeedsApproval(false);
        }
    }, [activeChain, isNative, amountIn, quoteData, allowance, fromToken]);


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


    const handleApprove = async () => {
        if (!quoteData || !fromToken) return;
        setIsApproving(true);
        try {
            const amountBigInt = parseUnits(amountIn, fromToken.decimals);

            // Approve Max or Exact Amount? Let's approve Max for convenience or Exact for security.
            // Usually Exact is safer, but Max saves gas for future swaps.
            // Let's go with exact amount for now to be safe.
            const txHash = await approveToken({
                address: fromToken.address as Address,
                abi: erc20Abi,
                functionName: 'approve',
                args: [quoteData.data.allowanceTarget as Address, amountBigInt],
                chainId: activeChain.chainId,
                account: evmAddress as Address,
                chain: currentChain,
            });

            alert(`Approve Submitted! Hash: ${txHash}`);

            // รอ Transaction Confirm (แบบง่ายๆ หรือจะใช้ useWaitForTransactionReceipt ก็ได้)
            // แต่ในที่นี้เราแค่รอสักพัก แล้ว Refetch Allowance
            setTimeout(() => {
                refetchAllowance();
                setIsApproving(false);
            }, 5000); // รอ 5 วิ (จริงๆ ควรใช้ wagmi hook รอ confirm)

        } catch (error: any) {
            console.error("Approve Failed:", error);
            alert(`Approve Failed: ${error.message || error}`);
            setIsApproving(false);
        }
    };

    const isChainConnected = activeChain.type === 'EVM' ? isEvmConnected : isSolConnected;

    const handleAction = () => {
        if (!isChainConnected) setIsUnifiedModalOpen(true);
        else if (needsApproval) handleApprove();
        else handleSwap();
    };

    const getButtonText = () => {
        if (!isChainConnected) return activeChain.type === 'EVM' ? 'Connect Wallet (EVM)' : 'Connect Wallet (SOL)';
        if (isLoading) return 'Fetching Best Price...';
        if (!amountIn) return 'Enter Amount';
        if (needsApproval) return isApproving ? 'Approving...' : `Approve ${fromToken?.symbol}`;
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
                        <span>Balance: {activeChain.type === 'EVM' ? formattedBalance : '0.00'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amountIn}
                            onChange={(e) => setAmountIn(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold text-earth-darkbrown outline-none placeholder:text-earth-stone/30"
                        />
                        <button
                            onClick={() => { setSelectorMode('from'); setIsSelectorOpen(true); }} // 👈 แก้บรรทัดนี้
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-earth-cream/40 shrink-0 hover:bg-gray-50 transition-colors"
                        >
                            {/* ใส่ ? เพื่อกัน Error ตอนข้อมูลยังไม่มา */}
                            <img src={fromToken?.logo || '/smile.png'} className="w-6 h-6 rounded-full" onError={(e) => e.currentTarget.src = '/smile.png'} />
                            <span className="font-bold text-earth-darkbrown">{fromToken?.symbol || 'Select'}</span>
                            <ArrowDown size={14} className="text-earth-stone" />
                        </button>
                    </div>
                </div>

                {/* Swap Arrow */}
                <div className="relative h-4">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div
                            className="bg-white p-2 rounded-xl border-4 border-white shadow-sm text-earth-primary cursor-pointer hover:scale-110 transition-transform"
                            // ✅ เพิ่ม onClick ตรงนี้ครับ
                            onClick={() => {
                                const temp = fromToken;
                                setFromToken(toToken);
                                setToToken(temp);
                                setAmountIn(''); // เคลียร์ยอดเงินด้วย เดี๋ยวคำนวณผิด
                                setQuoteData(null);
                            }}
                        >
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
                        <button
                            onClick={() => { setSelectorMode('to'); setIsSelectorOpen(true); }} // 👈 แก้บรรทัดนี้
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-earth-cream/40 shrink-0 hover:bg-gray-50 transition-colors"
                        >
                            <img src={toToken?.logo || '/smile.png'} className="w-6 h-6 rounded-full" onError={(e) => e.currentTarget.src = '/smile.png'} />
                            <span className="font-bold text-earth-darkbrown">{toToken?.symbol || 'Select'}</span>
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
                    disabled={isLoading || (!amountIn && isChainConnected) || isApproving}
                    className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
                        ${needsApproval ? 'bg-blue-600 text-white' : 'bg-earth-darkbrown text-white'}
                    `}
                >
                    {getButtonText()}
                </button>

            </div>

            <UnifiedWalletModal isOpen={isUnifiedModalOpen} onClose={() => setIsUnifiedModalOpen(false)} />
            <TokenSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                tokens={tokenList}
                // ส่งตัวที่กำลังเลือกไป เพื่อโชว์ติ๊กถูก
                selectedToken={selectorMode === 'from' ? fromToken : toToken}
                onSelect={(token: Token) => {
                    if (selectorMode === 'from') setFromToken(token);
                    else setToToken(token);
                }}
            />
        </div>
    );
}