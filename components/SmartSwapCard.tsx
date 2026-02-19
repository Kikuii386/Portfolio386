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

const WRAPPED_NATIVE_MAP: Record<number, string> = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Mainnet WETH
    8453: '0x4200000000000000000000000000000000000006', // Base WETH
};

interface SmartSwapCardProps {
    initialToken?: EnrichedToken | null;
    onClose?: () => void;
}

export default function SmartSwapCard({ initialToken, onClose }: SmartSwapCardProps) {
    // State
    const [activeChain, setActiveChain] = useState<ChainConfig>(CHAINS[0]);
    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken, setToToken] = useState<Token | null>(null);
    const [tokenList, setTokenList] = useState<Token[]>([]);
    const [amountIn, setAmountIn] = useState('');
    const [quoteData, setQuoteData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTokenListLoading, setIsTokenListLoading] = useState(false);
    const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);
    const [hasHandledInitial, setHasHandledInitial] = useState(false);
    // Hooks
    const { address: evmAddress, isConnected: isEvmConnected, chain: currentChain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { switchChain } = useSwitchChain();

    const { publicKey: solAddress, signTransaction, connected: isSolConnected } = useWallet();
    const { connection } = useConnection();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState<'from' | 'to'>('from');
    const [fromPrice, setFromPrice] = useState<number>(0);
    const [toPrice, setToPrice] = useState<number>(0);

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
    if (evmAddress && fromToken) {
        if (isNative && nativeBalanceData) {
            displayBalance = formatUnits(nativeBalanceData.value, nativeBalanceData.decimals);
        } else if (!isNative && tokenBalanceData !== undefined) {
            displayBalance = formatUnits(tokenBalanceData as bigint, fromToken.decimals);
        }
    }

    const formattedBalance = displayBalance.includes('.')
        ? displayBalance.slice(0, displayBalance.indexOf('.') + 7)
        : displayBalance;

    const formatUsd = (val: number) => {
        if (val === 0 || isNaN(val)) return '';
        if (val < 0.01) return '<$0.01';
        return `~$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchTokenPrice = async (token: Token) => {
        try {
            let queryAddress = token.address;

            // แปลง Native Token (ETH) ให้เป็น Wrapped (WETH) เพื่อให้ DexScreener หาเจอ
            if (token.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' && token.chainId) {
                queryAddress = WRAPPED_NATIVE_MAP[token.chainId] || token.address;
            }

            // 🔥 เรียก API Price ของเราเอง (ส่ง address และชื่อ chain ไป)
            const res = await fetch(`/api/price?address=${queryAddress}&chain=${activeChain.id}`);
            const data = await res.json();

            return data.price || 0;

        } catch (e) {
            console.error("Failed to fetch price", e);
            return 0;
        }
    };

    useEffect(() => {
        const fetchTokens = async () => {
            if (!activeChain.tokenListUrl) return;

            // เคลียร์ UI ให้ดูเรียบร้อยตอนกำลังโหลด
            setIsTokenListLoading(true);

            try {
                const res = await fetch(activeChain.tokenListUrl);
                const data = await res.json();

                let tokens: Token[] = data.map((t: any) => ({
                    symbol: t.symbol, name: t.name, address: t.address, decimals: t.decimals, logo: t.logo, chainId: t.chainId || 0
                }));

                // เพิ่ม Native
                if (activeChain.type === 'EVM' && !tokens.find(t => t.symbol === 'ETH')) {
                    tokens.unshift({ symbol: 'ETH', name: 'Ether', decimals: 18, address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: activeChain.chainId });
                }
                if (activeChain.type === 'SOLANA' && !tokens.find(t => t.symbol === 'SOL')) {
                    tokens.unshift({ symbol: 'SOL', name: 'Solana', decimals: 9, address: 'So11111111111111111111111111111111111111112', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg', chainId: 0 });
                }

                setTokenList(tokens);

                // 🌟 หัวใจสำคัญ: การตั้งค่า From/To
                if (initialToken && !hasHandledInitial) {
                    // --- กรณี 1: มี initialToken (มาจากหน้าอื่น) ---
                    const foundInList = tokens.find(t => t.address.toLowerCase() === initialToken.contract.toLowerCase());

                    const newToken: Token = {
                        symbol: initialToken.symbol, name: initialToken.name, logo: initialToken.logo || '/smile.png',
                        address: initialToken.contract, decimals: foundInList ? foundInList.decimals : 18, chainId: activeChain.chainId
                    };

                    setFromToken(newToken);
                    if (initialToken.currentPrice) setFromPrice(initialToken.currentPrice);

                    // ตั้งค่า To เป็น Native เสมอ
                    const native = tokens.find(t => t.symbol === 'ETH' || t.symbol === 'SOL' || t.symbol === 'WETH');
                    const stable = tokens.find(t => t.symbol === 'USDC' || t.symbol === 'USDT');

                    if (native && newToken.symbol !== native.symbol) {
                        setToToken(native);
                    } else {
                        setToToken(stable || tokens[1] || null);
                    }

                    // มาร์คว่าจัดการ initialToken เสร็จแล้ว จะได้ไม่ทำซ้ำอีก
                    setHasHandledInitial(true);

                } else if (!hasHandledInitial) {
                    // --- กรณี 2: เข้ามาหน้าเว็บตรงๆ ไม่มี initialToken ---
                    if (tokens.length > 0) setFromToken(tokens[0]);
                    if (tokens.length > 1) {
                        const usdc = tokens.find(t => t.symbol === 'USDC' || t.symbol === 'USDT');
                        setToToken(usdc || tokens[1]);
                    }
                    setHasHandledInitial(true); // ป้องกันการ Reset กลับไปกลับมา
                }

                // ถ้ายูสเซอร์เปลี่ยนเชนเอง (หลังจาก load ครั้งแรกผ่านไปแล้ว) 
                // เราต้องยอมให้มันหาค่า Default ใหม่ แต่ห้ามเอา initialToken มายุ่ง
                if (hasHandledInitial && (!fromToken || !tokens.find(t => t.address === fromToken.address))) {
                    if (tokens.length > 0) setFromToken(tokens[0]);
                    if (tokens.length > 1) {
                        const usdc = tokens.find(t => t.symbol === 'USDC' || t.symbol === 'USDT');
                        setToToken(usdc || tokens[1]);
                    }
                }

            } catch (error) {
                console.error("Failed to load tokens", error);
            } finally {
                setIsTokenListLoading(false);
            }
        };

        fetchTokens();
    }, [activeChain]);

    useEffect(() => {
        if (fromToken) fetchTokenPrice(fromToken).then(setFromPrice);
        else setFromPrice(0);
    }, [fromToken, activeChain]); // เพิ่ม activeChain dependency

    useEffect(() => {
        if (toToken) fetchTokenPrice(toToken).then(setToPrice);
        else setToPrice(0);
    }, [toToken, activeChain]); // เพิ่ม activeChain dependency

    // ✅ 1. UPDATE: Logic เมื่อได้รับ initialToken จาก SwipeableRow
    useEffect(() => {
        if (initialToken && !hasHandledInitial) {
            const chainMap: Record<string, string> = { 'ETH': 'ethereum', 'ETHEREUM': 'ethereum', 'SOL': 'solana', 'SOLANA': 'solana', 'BASE': 'base' };
            const normalizedChainName = chainMap[initialToken.chain.toUpperCase()] || 'ethereum';
            const targetChain = CHAINS.find(c => c.id === normalizedChainName) || CHAINS[0];

            if (activeChain.id !== targetChain.id) {
                setActiveChain(targetChain);
                // รอให้ Chain เปลี่ยนและ fetchTokens ทำงานก่อน
            }
        }
    }, [initialToken, activeChain.id, hasHandledInitial]);// Removed tokenList dependency to avoid loop, logic depends on how initialToken comes in

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
            const amountInSmallest = parseUnits(val, fromToken?.decimals || 18).toString();

            if (activeChain.type === 'SOLANA') {
                const params = new URLSearchParams({
                    inputMint: fromToken?.address || '',
                    outputMint: toToken?.address || '',
                    amount: amountInSmallest,
                    slippageBps: '50' // 0.5%
                });
                const res = await fetch(`/api/quote/solana?${params}`);
                if (!res.ok) throw new Error('Solana quote failed');
                const data = await res.json();

                const priceImpact = data.priceImpactPct
                    ? `${parseFloat(data.priceImpactPct).toFixed(2)}%`
                    : '< 0.01%';

                setQuoteData({
                    // แปลงหน่วยกลับมาโชว์ (outAmount จาก Jupiter เป็น string integer)
                    price: formatUnits(BigInt(data.outAmount), toToken?.decimals || 9),
                    data: data,
                    provider: 'Jupiter',
                    priceImpact: priceImpact
                });

            } else {
                // EVM (0x Protocol)
                const params = new URLSearchParams({
                    chainId: activeChain.chainId?.toString() || '1',
                    sellToken: fromToken?.address || '',
                    buyToken: toToken?.address || '',
                    sellAmount: amountInSmallest,
                    ...(evmAddress ? { taker: evmAddress } : {})
                });

                const res = await fetch(`/api/quote?${params}`);
                if (!res.ok) throw new Error('EVM quote failed');
                const data = await res.json();

                // 0x v2 response structure checks
                // If /swap/v2/price (indication) -> buyAmount
                // If /swap/v2/quote (firm) -> buyAmount, transaction

                const txData = data.transaction || null;
                const buyAmount = data.buyAmount;

                if (!buyAmount) throw new Error('No buyAmount in quote');

                // 🌟 LOGIC แก้ไข: คำนวณ Price Impact เอง (Manual Calculation) 🌟
                // Formula: (OutputUSD - InputUSD) / InputUSD * 100
                // Expect negative value for loss (Slippage + Fee)

                let priceImpactDisplay = '< 0.01%';
                let impactPercent = 0;

                // ตรวจสอบว่ามีราคา USD ครบถ้วน
                if (fromPrice > 0 && toPrice > 0) {
                    const inputUsd = parseFloat(val) * fromPrice;
                    const outputAmount = parseFloat(formatUnits(BigInt(buyAmount), toToken?.decimals || 18));
                    const outputUsd = outputAmount * toPrice;

                    if (inputUsd > 0) {
                        // (98 - 100) / 100 * 100 = -2.0%
                        impactPercent = ((outputUsd - inputUsd) / inputUsd) * 100;
                    }
                }

                // การตัดสินใจว่าจะโชว์เลขไหน
                if (Math.abs(impactPercent) > 0.01) {
                    // Manual calc has priority
                    priceImpactDisplay = `${impactPercent.toFixed(2)}%`;
                } else if (data.estimatedPriceImpact) {
                    const val = parseFloat(data.estimatedPriceImpact);
                    // Standardize to negative for loss
                    const signedVal = val > 0 ? -val : val;
                    priceImpactDisplay = `${signedVal.toFixed(2)}%`;
                }

                setQuoteData({
                    // 1. ราคา (Amount Out)
                    price: formatUnits(BigInt(buyAmount), toToken?.decimals || 18),

                    // 2. ข้อมูลดิบสำหรับ Swap
                    data: {
                        ...data,
                        to: txData?.to,
                        data: txData?.data,
                        value: txData?.value,
                        // 0x v2 allowanceTarget
                        allowanceTarget: data.issues?.allowance?.spender || data.allowanceTarget || '0xdef1c0ded9bec7f1a1670819833240f027b25eff' // Fallback to 0x proxy
                    },

                    provider: '0x Protocol',

                    // 3. Price Impact (ใช้ค่าที่ถูกต้องที่เราคำนวณแล้ว)
                    priceImpact: priceImpactDisplay,

                    isFirmQuote: !!txData
                });
            }
        } catch (error) {
            console.error("Quote Error:", error);
            setQuoteData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!amountIn || !fromToken) {
            setIsInsufficientBalance(false);
            return;
        }
        const balanceNum = parseFloat(formattedBalance); // ใช้ค่าจากตัวแปร formattedBalance ที่คุณคำนวณไว้แล้ว
        const amountNum = parseFloat(amountIn);
        setIsInsufficientBalance(amountNum > balanceNum);
    }, [amountIn, formattedBalance, fromToken]);

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
                if (!quoteData.isFirmQuote) {
                    // เรียก fetchQuote อีกรอบ (รอบนี้มี evmAddress แล้ว ระบบจะดึง /quote ให้เอง)
                    await fetchQuote(amountIn);
                    // (ในทางปฏิบัติควรมี State เช็คว่า fetch เสร็จหรือยัง หรือให้ User กดอีกที)
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
        if (isInsufficientBalance) return 'Insufficient Balance';
        if (!amountIn) return 'Enter Amount';
        if (needsApproval) return isApproving ? 'Approving...' : `Approve ${fromToken?.symbol}`;
        return 'Swap Now';
    };

    const getImpactColor = (impactStr: string) => {
        if (!impactStr) return 'text-green-500';
        if (impactStr.includes('<')) return 'text-green-500'; // น้อยมาก

        // แปลง string เป็นตัวเลข (จะติดลบก็ช่างมัน)
        const rawVal = parseFloat(impactStr.replace('%', ''));
        // ดูแค่ขนาดความเสียหาย (เอาเครื่องหมายออก)
        const val = Math.abs(rawVal);

        if (val < 1.0) return 'text-green-500';   // หายน้อยกว่า 1% -> เขียว
        if (val < 3.0) return 'text-yellow-500';  // หาย 1-3% -> เหลือง
        return 'text-red-500';                    // หายเกิน 3% -> แดง (High Price Impact!)
    };

    const formatDisplayValue = (val: string) => {
        if (!val) return '';
        const num = parseFloat(val);
        if (isNaN(num)) return '';
        // ถ้าเลขน้อยมากๆ ให้โชว์ทศนิยมเยอะหน่อย
        if (num < 0.000001) return num.toFixed(10).replace(/\.?0+$/, "");
        // ปกติโชว์ 6 ตำแหน่งและตัด 0 ต่อท้าย
        return num.toFixed(6).replace(/\.?0+$/, "");
    };


    return (
        <div className="w-full max-w-[480px] mx-auto font-sans">
            <div className="bg-white border border-earth-cream/60 rounded-3xl p-5 shadow-xl relative">
                <div className="flex justify-end mb-4 gap-4">
                    <button className="text-earth-stone hover:text-earth-darkbrown transition-colors">
                        <Settings size={20} />
                    </button>
                    {/* ✅ เพิ่มปุ่ม X ตรงนี้ */}
                    <button
                        className="text-earth-stone hover:text-earth-clay transition-colors p-1 hover:bg-gray-100 rounded-full"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
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
                            {fromToken ? (
                                <div className="relative w-7 h-7 min-w-[24px] shrink-0">
                                    <img
                                        src={fromToken.logo}
                                        className="w-full h-full rounded-full object-contain bg-white"
                                        onError={(e) => e.currentTarget.src = '/smile.png'}
                                    />
                                    {/* โลโก้เชนย่อส่วนให้พอดีกับกรอบ 24px */}
                                    <img
                                        src={activeChain.logo}
                                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-[1.5px] ring-white bg-white object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-earth-stone/10 animate-pulse" />
                            )}
                            <span className="font-bold text-earth-darkbrown">{fromToken?.symbol || 'Select'}</span>
                            <ArrowDown size={14} className="text-earth-stone" />
                        </button>
                    </div>
                    {/* 💵 USD Value */}
                    <div className="px-1 mt-1 text-xs text-earth-stone font-medium min-h-[1.2em]">
                        {amountIn && fromPrice > 0 ? formatUsd(parseFloat(amountIn) * fromPrice) : ''}
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
                            value={quoteData ? formatDisplayValue(quoteData.price) : ''}
                            className="w-full bg-transparent text-3xl font-bold text-earth-darkbrown outline-none placeholder:text-earth-stone/30"
                        />
                        <button
                            onClick={() => { setSelectorMode('to'); setIsSelectorOpen(true); }} // 👈 แก้บรรทัดนี้
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-earth-cream/40 shrink-0 hover:bg-gray-50 transition-colors"
                        >
                            {toToken ? (
                                <div className="relative w-7 h-7 min-w-[24px] shrink-0">
                                    <img
                                        src={toToken.logo}
                                        className="w-full h-full rounded-full object-contain bg-white"
                                        onError={(e) => e.currentTarget.src = '/smile.png'}
                                    />
                                    {/* โลโก้เชนย่อส่วนให้พอดีกับกรอบ 24px */}
                                    <img
                                        src={activeChain.logo}
                                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-[1.5px] ring-white bg-white object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-earth-stone/10 animate-pulse" />
                            )}
                            <span className="font-bold text-earth-darkbrown">{toToken?.symbol || 'Select'}</span>
                            <ArrowDown size={14} className="text-earth-stone" />
                        </button>
                    </div>
                    <div className="px-1 mt-1 text-xs text-earth-stone font-medium min-h-[1.2em]">
                        {quoteData && toPrice > 0 ? formatUsd(parseFloat(quoteData.price) * toPrice) : ''}
                    </div>
                </div>

                {/* Quote Info */}
                <AnimatePresence>
                    {quoteData && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="mt-4 px-4 py-3 bg-earth-sage/10 rounded-xl border border-earth-sage/20 space-y-2 text-xs">

                                {/* 1. แสดง Rate (อัตราแลกเปลี่ยน) */}
                                <div className="flex justify-between items-center text-earth-stone">
                                    <span className="flex items-center gap-1">Rate</span>
                                    <span className="font-bold text-earth-darkbrown">
                                        1 {fromToken?.symbol} ≈ {(parseFloat(quoteData.price) / parseFloat(amountIn || '1')).toFixed(4)} {toToken?.symbol}
                                    </span>
                                </div>

                                {/* 2. แสดง Price Impact (Slippage) */}
                                <div className="flex justify-between items-center text-earth-stone">
                                    <span className="flex items-center gap-1">Price Impact</span>
                                    {/* เช็คค่า impact เพื่อเปลี่ยนสี */}
                                    <span className={`font-bold ${getImpactColor(quoteData.priceImpact)}`}>
                                        {quoteData.priceImpact}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. แสดง Provider (Route via...) */}
                {quoteData && (
                    <div className="flex justify-end items-center gap-1 mt-2 px-1">
                        <span className="text-[10px] text-earth-stone flex items-center gap-1">
                            <RefreshCcw size={10} /> Route via
                        </span>
                        <span className="text-[10px] font-bold text-earth-darkbrown flex items-center gap-1 bg-earth-cream/30 px-2 py-0.5 rounded-full">
                            {quoteData.provider}
                        </span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    // ✅ ปิดปุ่มถ้าเงินไม่พอ แต่ยังให้กดดูราคาได้
                    disabled={isLoading || (!amountIn && isChainConnected) || isApproving || isInsufficientBalance}
                    className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
                        ${isInsufficientBalance ? 'bg-red-500 text-white' : (needsApproval ? 'bg-blue-600 text-white' : 'bg-earth-darkbrown text-white')}
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
                selectedToken={selectorMode === 'from' ? fromToken : toToken}
                onSelect={(token: Token) => {
                    if (selectorMode === 'from') setFromToken(token);
                    else setToToken(token);
                }}
                isLoading={isTokenListLoading}
                // 🌟 ส่งข้อมูล Chain เข้าไป
                chains={CHAINS}
                activeChain={activeChain}
                onChainSelect={(chain: any) => { // <--- เติม : any ตรงนี้ ขีดแดงจะหายไป
                    setActiveChain(chain);
                }}
            />
        </div>
    );
}