'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, Settings, Loader2, RefreshCcw, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// EVM Hooks
import { useAccount, useWalletClient, useSwitchChain, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, erc20Abi, type Address } from 'viem';
// Solana Hooks
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
// Components
import UnifiedWalletModal from '@/components/UnifiedWalletModal';
import { EnrichedToken } from '@/lib/enrichWithPrices';
import TokenSelectorModal, { Token } from '@/components/TokenSelectorModal';
import QtyDisplay from '@/components/QtyDisplay';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

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
    { id: 'ethereum', name: 'Ethereum', type: 'EVM', chainId: 1, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', tokenListUrl: '/api/tokens?chain=ethereum' },
    { id: 'bsc', name: 'BNB Chain', type: 'EVM', chainId: 56, logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg', tokenListUrl: '/api/tokens?chain=bsc' },
    { id: 'polygon', name: 'Polygon', type: 'EVM', chainId: 137, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg', tokenListUrl: '/api/tokens?chain=polygon' },
    { id: 'arbitrum', name: 'Arbitrum', type: 'EVM', chainId: 42161, logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg', tokenListUrl: '/api/tokens?chain=arbitrum' },
    { id: 'base', name: 'Base', type: 'EVM', chainId: 8453, logo: 'https://cdn.brandfetch.io/id6XsSOVVS/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1757929784005', tokenListUrl: '/api/tokens?chain=base' },
    { id: 'optimism', name: 'Optimism', type: 'EVM', chainId: 10, logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg', tokenListUrl: '/api/tokens?chain=optimism' },
    { id: 'linea', name: 'Linea', type: 'EVM', chainId: 59144, logo: 'https://images.seeklogo.com/logo-png/52/1/linea-logo-png_seeklogo-527155.png', tokenListUrl: '/api/tokens?chain=linea' },
    { id: 'blast', name: 'Blast', type: 'EVM', chainId: 81457, logo: 'https://cdn.prod.website-files.com/65a6baa1a3f8ed336f415cb4/65a6cee39aadb0fa7418aa77_Blast%20Logo%20Icon%20Yellow.svg', tokenListUrl: '/api/tokens?chain=blast' },
    { id: 'avalanche', name: 'Avalanche', type: 'EVM', chainId: 43114, logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg', tokenListUrl: '/api/tokens?chain=avalanche' },
    { id: 'sonic', name: 'Sonic', type: 'EVM', chainId: 146, logo: 'https://gateway.soniclabs.com/sonic.svg', tokenListUrl: '/api/tokens?chain=sonic' },
    { id: 'berachain', name: 'Berachain', type: 'EVM', chainId: 80094, logo: 'https://public.saasexch.com/static/cms/cmsSassLandingPage1/202502/a4755dc9da81e4a9735f91b9ee4fe57b.png', tokenListUrl: '/api/tokens?chain=berachain' },
    { id: 'abstract', name: 'Abstract', type: 'EVM', chainId: 2741, logo: 'https://pbs.twimg.com/profile_images/1947751080705630208/0OQFUJxI_400x400.jpg', tokenListUrl: '/api/tokens?chain=abstract' },
    { id: 'hyperliquid', name: 'Hyperliquid', type: 'EVM', chainId: 998, logo: 'https://cdn.brandfetch.io/idGSMNVeGY/w/270/h/270/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1768327356373', tokenListUrl: '/api/tokens?chain=hyperliquid' },
    { id: 'zksync', name: 'zkSync', type: 'EVM', chainId: 324, logo: 'https://www.zksync.io/brand/zksync-logo/zksync-logomark-dark-transparent.svg', tokenListUrl: '/api/tokens?chain=zksync' },
    // Solana (Non-EVM เก็บไว้ตัวสุดท้าย)
    { id: 'solana', name: 'Solana', type: 'SOLANA', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg', tokenListUrl: '/api/tokens?chain=solana' },
];

const WRAPPED_NATIVE_MAP: Record<number, string> = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',      // Ethereum: WETH
    56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',     // BNB Chain: WBNB
    137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',    // Polygon: WPOL (formerly WMATIC)
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',  // Arbitrum: WETH
    8453: '0x4200000000000000000000000000000000000006',   // Base: WETH
    10: '0x4200000000000000000000000000000000000006',     // Optimism: WETH
    59144: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',  // Linea: WETH
    81457: '0x4300000000000000000000000000000000000004',  // Blast: WETH
    43114: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',  // Avalanche: WAVAX
    146: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',    // Sonic: wS
    80094: '0x6969696969696969696969696969696969696969',  // Berachain: WBERA
    2741: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',   // Abstract: WETH (Standard ZK-Stack)
    998: '0x5555555555555555555555555555555555555555',    // Hyperliquid (Testnet 998): WHYPE
    324: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',    // zkSync Era: WETH
};

const DEFAULT_TOKENS: Record<string, Token> = {
    'ethereum': { symbol: 'ETH', name: 'Ethereum', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 1 },
    'bsc': { symbol: 'BNB', name: 'BNB Chain', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg', chainId: 56 },
    'polygon': { symbol: 'POL', name: 'Polygon', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg', chainId: 137 },
    'arbitrum': { symbol: 'ETH', name: 'Arbitrum', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 42161 },
    'base': { symbol: 'ETH', name: 'Base', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 8453 },
    'optimism': { symbol: 'ETH', name: 'Optimism', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg', chainId: 10 },
    'linea': { symbol: 'ETH', name: 'Linea', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 59144 },
    'blast': { symbol: 'ETH', name: 'Blast', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 81457 },
    'avalanche': { symbol: 'AVAX', name: 'Avalanche', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg', chainId: 43114 },
    'sonic': { symbol: 'S', name: 'Sonic', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/sonic-logo.svg', chainId: 146 },
    'berachain': { symbol: 'BERA', name: 'Berachain', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://berascan.com/assets/bera/images/svg/logos/token-light.svg', chainId: 80094 },
    'abstract': { symbol: 'ETH', name: 'Abstract', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 2741 },
    'hyperliquid': { symbol: 'HYPE', name: 'Hyperliquid', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/hyperliquid-logo.svg', chainId: 998 },
    'zksync': { symbol: 'ETH', name: 'zkSync', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', chainId: 324 },
    'solana': { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112', decimals: 9, logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg', chainId: 0 },
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
    const [quoteUsdValue, setQuoteUsdValue] = useState<number | null>(null);
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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [slippage, setSlippage] = useState('0.5');
    const settingsRef = useRef<HTMLDivElement>(null);
    const { publicKey } = useWallet(); //
    const [tokenBalance, setTokenBalance] = useState<string>('0.00');

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
    const { data: realFromDecimals, isLoading: isDecimalsLoading } = useReadContract({
        address: fromToken?.address as Address,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: activeChain.chainId,
        query: {
            enabled: !!fromToken && !isNative && activeChain.type === 'EVM',
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
    const finalDisplayBalance = activeChain.type === 'SOLANA' ? tokenBalance : formattedBalance;
    const formatUsd = (val: number) => {
        if (val === 0 || isNaN(val)) return '';
        if (val < 0.01) return '<$0.01';
        return `~$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchTokenPrice = async (token: Token) => {
        try {
            let queryAddress = token.address;

            // แปลง Native Token (ETH) ให้เป็น Wrapped (WETH) เพื่อให้ DexScreener หาเจอ
            const isNative = token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
                token.address.toLowerCase() === 'native';

            if (isNative && token.chainId) {
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
        const fetchCurrentTokenBalance = async () => {
            if (!publicKey || !fromToken) {
                setTokenBalance('0.00');
                return;
            }

            try {
                // 1. ถ้าเป็นเหรียญ Native SOL
                if (fromToken.address === 'So11111111111111111111111111111111111111112') {
                    const bal = await connection.getBalance(publicKey);
                    setTokenBalance((bal / 1e9).toFixed(4));
                }
                // 2. ถ้าเป็นเหรียญ Token อื่นๆ (SPL Token)
                else {
                    const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
                        mint: new PublicKey(fromToken.address),
                    });

                    if (response.value.length > 0) {
                        // ดึงยอดจาก Account แรกที่เจอ
                        const amount = response.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                        setTokenBalance(amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }));
                    } else {
                        setTokenBalance('0.00');
                    }
                }
            } catch (error) {
                console.error("Fetch Balance Error:", error);
                setTokenBalance('0.00');
            }
        };

        if (activeChain.type === 'SOLANA') {
            fetchCurrentTokenBalance();
        }
        // 🔥 ให้รันใหม่ทุกครั้งที่เปลี่ยนเหรียญ (fromToken) หรือเปลี่ยนกระเป๋า
    }, [publicKey, connection, fromToken, activeChain]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // ถ้าคลิกเป้าหมาย (event.target) ไม่อยู่ใน settingsRef ให้ปิดเมนู
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };

        // เปิดรับ Event เมื่อ component ทำงาน
        document.addEventListener('mousedown', handleClickOutside);

        // ล้าง Event เมื่อ component ถูกทำลาย ป้องกันบั๊ก
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchTokens = async () => {
            if (!activeChain.tokenListUrl) return;

            setIsTokenListLoading(true);

            try {
                const res = await fetch(activeChain.tokenListUrl);
                const data = await res.json();

                if (!isMounted) return;

                let tokens: Token[] = data.map((t: any) => ({
                    symbol: t.symbol,
                    name: t.name,
                    address: t.address,
                    decimals: t.decimals,
                    logo: t.logo,
                    chainId: t.chainId || 0
                }));

                // ✅ 1. แก้ไขการเพิ่ม Native Token ให้ dynamic ตามเชน
                if (activeChain.type === 'EVM') {
                    // หาว่า Native ของเชนนี้ควรชื่ออะไร (ดึงจาก DEFAULT_TOKENS ที่เราสร้างไว้)
                    const defaultNative = DEFAULT_TOKENS[activeChain.id] || DEFAULT_TOKENS['ethereum'];

                    // ตรวจสอบว่าในลิสต์มีเหรียญ symbol นี้หรือยัง (เช่น BNB หรือ ETH)
                    if (!tokens.find(t => t.symbol === defaultNative.symbol)) {
                        tokens.unshift(defaultNative);
                    }
                }

                if (activeChain.type === 'SOLANA') {
                    // 1. เตะเหรียญที่ชื่อ SOL (ตัวปลอมที่ API อาจจะส่งมา) ทิ้งไปก่อน
                    tokens = tokens.filter(t => t.symbol !== 'SOL');

                    // 2. ยัด SOL ของแท้ (So111...) เข้าคิวที่ 1 เสมอ
                    tokens.unshift(DEFAULT_TOKENS['solana']);

                    // 3. ถ้าในลิสต์ไม่มี USDC ให้สร้างขึ้นมาแล้วยัดเข้าคิวที่ 2
                    if (!tokens.find(t => t.symbol === 'USDC')) {
                        tokens.splice(1, 0, {
                            symbol: 'USDC',
                            name: 'USD Coin',
                            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Address ของแท้
                            decimals: 6,
                            logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
                            chainId: 0
                        });
                    }
                }

                setTokenList(tokens);

                // 🌟 การจัดการ From/To
                if (initialToken && !hasHandledInitial) {
                    const foundInList = tokens.find(t => t.address.toLowerCase() === initialToken.contract.toLowerCase());

                    const newToken: Token = {
                        symbol: initialToken.symbol,
                        name: initialToken.name,
                        logo: initialToken.logo || '/smile.png',
                        address: initialToken.contract,
                        decimals: foundInList ? foundInList.decimals : ((initialToken as any).decimals || 18),
                        chainId: activeChain.chainId
                    };

                    setFromToken(newToken);
                    if (initialToken.currentPrice) setFromPrice(initialToken.currentPrice);

                    // ✅ 2. ปรับการหาเหรียญปลายทาง (To Token) ให้ฉลาดขึ้น
                    const native = tokens[0]; // ตัวแรกที่เรา unshift เข้าไป (BNB/ETH/SOL)
                    const stable = tokens.find(t => t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'USDT.e');

                    if (native && newToken.address.toLowerCase() !== native.address.toLowerCase()) {
                        setToToken(native);
                    } else {
                        setToToken(stable || tokens[1] || null);
                    }

                    setHasHandledInitial(true);

                } else if (!hasHandledInitial || (hasHandledInitial && activeChain)) {
                    // ✅ 3. กรณีเปลี่ยนเชน หรือเข้าหน้าเว็บครั้งแรก
                    // ให้เลือกเหรียญแรกในลิสต์ (ซึ่งเราเอา Native ใส่ไว้ตัวแรกเสมอ)
                    if (tokens.length > 0) {
                        setFromToken(tokens[0]);
                    }
                    if (tokens.length > 1) {
                        const usdc = tokens.find(t => t.symbol === 'USDC' || t.symbol === 'USDT');
                        setToToken(usdc || tokens[1]);
                    }
                    setHasHandledInitial(true);
                }

            } catch (error) {
                console.error("Failed to load tokens", error);
            } finally {
                setIsTokenListLoading(false);
            }
        };

        fetchTokens();
        return () => {
            isMounted = false;
        };
    }, [activeChain]);

    useEffect(() => {
        // 🔥 1. เคลียร์ราคาเก่าทิ้ง "ทันที" ป้องกันการเอาไปคูณข้ามเหรียญ
        setFromPrice(0);
        if (fromToken) fetchTokenPrice(fromToken).then(setFromPrice);
    }, [fromToken, activeChain]);

    useEffect(() => {
        // 🔥 1. เคลียร์ราคาเก่าทิ้งทันที
        setToPrice(0);
        if (toToken) fetchTokenPrice(toToken).then(setToPrice);
    }, [toToken, activeChain]);

    // 🔥 2. เคลียร์ Quote เก่าทิ้งด้วยเมื่อเปลี่ยนเหรียญ
    useEffect(() => {
        setQuoteData(null);
    }, [fromToken?.address, toToken?.address, activeChain.id]);

    // ✅ 1. UPDATE: Logic เมื่อได้รับ initialToken จาก SwipeableRow
    useEffect(() => {
        if (initialToken) {
            const chainMap: Record<string, string> = {
                'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
                'BSC': 'bsc', 'BNB': 'bsc',
                'POLYGON': 'polygon', 'MATIC': 'polygon',
                'ARB': 'arbitrum', 'ARBITRUM': 'arbitrum',
                'BASE': 'base',
                'OP': 'optimism', 'OPTIMISM': 'optimism',
                'LINEA': 'linea',
                'BLAST': 'blast',
                'AVAX': 'avalanche', 'AVALANCHE': 'avalanche',
                'SONIC': 'sonic',
                'BERA': 'berachain', 'BERACHAIN': 'berachain',
                'ABSTRACT': 'abstract',
                'HYPE': 'hyperliquid', 'HYPERLIQUID': 'hyperliquid',
                'ZK': 'zksync', 'ZKSYNC': 'zksync',
                'SOL': 'solana', 'SOLANA': 'solana'
            };
            const normalizedChainName = chainMap[initialToken.chain.toUpperCase()] || 'ethereum';
            const targetChain = CHAINS.find(c => c.id === normalizedChainName) || CHAINS[0];

            // 🌟 สั่งให้ทำงานแค่การตั้งค่าเริ่มต้นเท่านั้น ไม่ต้องเช็คเงื่อนไขย้อนหลัง
            setActiveChain(targetChain);
            setHasHandledInitial(false); // ปล่อยให้ระบบไปโหลด Token ต่อ
        }
    }, [initialToken]);

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
            // 🌟 3. ใช้ทศนิยมของจริงจาก Blockchain (ถ้าหาไม่ได้ค่อยใช้ 18)
            const actualDecimals = activeChain.type === 'EVM' && !isNative && realFromDecimals !== undefined
                ? realFromDecimals
                : (fromToken?.decimals || (activeChain.type === 'SOLANA' ? 9 : 18));

            // ใช้ parseUnits ควบคู่กับ actualDecimals ที่แม่นยำ 100%
            const amountInSmallest = parseUnits(val, actualDecimals).toString();

            if (activeChain.type === 'SOLANA') {
                const params = new URLSearchParams({
                    inputMint: fromToken?.address || '',
                    outputMint: toToken?.address || '',
                    amount: amountInSmallest,
                    slippageBps: Math.floor(parseFloat(slippage || '0.5') * 100).toString()
                });
                const res = await fetch(`/api/quote/solana?${params}`);
                if (!res.ok) throw new Error('Solana quote failed');
                const data = await res.json();
                if (data.swapUsdValue) {
                    const totalUsd = parseFloat(data.swapUsdValue);
                    setQuoteUsdValue(totalUsd);

                    // 🔥 2. เอามาหารกลับเพื่อบังคับให้ toPrice (ราคาต่อ 1 เหรียญ) ตรงกับความเป็นจริงเป๊ะๆ!
                    const outAmountParsed = parseFloat(formatUnits(BigInt(data.outAmount), toToken?.decimals || 9));
                    if (outAmountParsed > 0) {
                        setToPrice(totalUsd / outAmountParsed);
                    }
                } else {
                    setQuoteUsdValue(null);
                }

                // 🌟 1. ดึงชื่อ DEX ที่ใช้สลับเหรียญ (เช่น Scorch + SolFi V2)
                const sources = data.routePlan?.map((r: any) => r.swapInfo.label) || [];
                const uniqueSources = Array.from(new Set(sources));
                const routeText = uniqueSources.length > 0 ? uniqueSources.join(' + ') : 'Jupiter';

                // 🌟 2. คำนวณ Price Impact ให้สีและรูปแบบเหมือน EVM
                let priceImpactDisplay = '< 0.01%';
                if (data.priceImpactPct) {
                    const valRaw = parseFloat(data.priceImpactPct);
                    const percentRaw = valRaw * 100;
                    const signedVal = percentRaw > 0 ? -percentRaw : percentRaw;
                    if (Math.abs(signedVal) >= 0.01) {
                        priceImpactDisplay = `${signedVal.toFixed(2)}%`;
                    }
                }

                setQuoteData({
                    // จำนวนเหรียญที่ได้
                    price: formatUnits(BigInt(data.outAmount), toToken?.decimals || 9),
                    data: data,

                    // แสดงชื่อ DEX ที่วิ่งไปหา
                    provider: routeText,
                    priceImpact: priceImpactDisplay,
                    isFirmQuote: true, // ของ Solana สามารถนำไปใช้ Swap ได้เลย

                    // 🌟 3. ข้อมูลเพิ่มเติมสำหรับความโปร่งใสแบบ EVM
                    minReceived: data.otherAmountThreshold
                        ? formatUnits(BigInt(data.otherAmountThreshold), toToken?.decimals || 9)
                        : null,

                    // ฝั่ง Solana ค่าธรรมเนียมเน็ตเวิร์คถูกมาก (ระดับสตางค์) และไม่มี Tax เหมือนฝั่ง EVM จึงตั้งเป็น 0
                    networkFee: null,
                    sellTax: 0,
                    buyTax: 0,
                });

            } else {
                // EVM (0x Protocol)
                const params = new URLSearchParams({
                    chainId: activeChain.chainId?.toString() || '1',
                    sellToken: fromToken?.address || '',
                    buyToken: toToken?.address || '',
                    sellAmount: amountInSmallest,
                    slippagePercentage: (parseFloat(slippage || '0.5') / 100).toString(),
                    ...(evmAddress ? { taker: evmAddress } : {})
                });

                const res = await fetch(`/api/quote?${params}`);
                if (!res.ok) throw new Error('EVM quote failed');
                const data = await res.json();

                const txData = data.transaction || null;
                const buyAmount = data.buyAmount;
                const sources = data.route?.fills?.map((f: any) => f.source.replace('_', ' ')) || [];
                const uniqueSources = Array.from(new Set(sources));
                const routeText = uniqueSources.length > 0 ? uniqueSources.join(' + ') : '0x Protocol';

                if (!buyAmount) throw new Error('No buyAmount in quote');
                let priceImpactDisplay = '< 0.01%';
                if (data.estimatedPriceImpact) {
                    const valRaw = parseFloat(data.estimatedPriceImpact);
                    const signedVal = valRaw > 0 ? -valRaw : valRaw;
                    if (Math.abs(signedVal) >= 0.01) {
                        priceImpactDisplay = `${signedVal.toFixed(2)}%`;
                    }
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

                    // 🌟 อัปเดต Provider ให้แสดงชื่อ DEX แทนคำว่า 0x Protocol แข็งๆ
                    provider: routeText,

                    // 3. Price Impact (ใช้ค่าที่ถูกต้องที่เราคำนวณแล้ว)
                    priceImpact: priceImpactDisplay,

                    isFirmQuote: !!txData,

                    // 🌟 4. ข้อมูลเพิ่มเติมสำหรับแสดงโชว์ความโปร่งใส (Min Received, Fee, Tax)
                    minReceived: data.minBuyAmount ? formatUnits(BigInt(data.minBuyAmount), toToken?.decimals || 18) : null,

                    networkFee: data.totalNetworkFee ? formatUnits(BigInt(data.totalNetworkFee), 18) : null,

                    sellTax: data.tokenMetadata?.sellToken?.sellTaxBps ? (parseInt(data.tokenMetadata.sellToken.sellTaxBps) / 100) : 0,

                    buyTax: data.tokenMetadata?.buyToken?.buyTaxBps ? (parseInt(data.tokenMetadata.buyToken.buyTaxBps) / 100) : 0,
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
            // 🌟 2. รอให้โหลดทศนิยมจากเชนเสร็จก่อน ค่อยส่งไปหา 0x
            if (amountIn && !isDecimalsLoading) fetchQuote(amountIn);
        }, 600);
        return () => clearTimeout(timeout);
    }, [amountIn, fromToken, toToken, realFromDecimals, isDecimalsLoading]);

    // ✅ 3. UPDATE: Handle Swap
    const handleSwap = async () => {
        if (!quoteData) return;

        try {
            if (activeChain.type === 'SOLANA') {
                if (!solAddress || !signTransaction) return alert('Connect Solana Wallet first');

                // 🌟 ยิงไปที่ Route เดิมของคุณเลย แต่ใช้ method POST
                const swapRes = await fetch('/api/quote/solana', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quoteResponse: quoteData.data,
                        userPublicKey: solAddress.toString(),
                        dynamicComputeUnitLimit: true,
                        wrapAndUnwrapSol: true,
                    })
                });

                if (!swapRes.ok) {
                    const errData = await swapRes.json();
                    throw new Error(errData.error || 'Failed to get swap transaction');
                }

                const swapJson = await swapRes.json();

                const swapTransactionBuf = Buffer.from(swapJson.swapTransaction, 'base64');
                var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

                const signature = await signTransaction(transaction);

                const txid = await connection.sendRawTransaction(signature.serialize(), {
                    skipPreflight: true,
                    maxRetries: 2,
                });

                alert(`Swap Submitted! Tx: ${txid}`);
                await connection.confirmTransaction(txid);

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

    const handleMax = () => {
        // เลือกยอดเงินตามประเภท Chain ที่ใช้งานอยู่
        const maxAmount = activeChain.type === 'SOLANA' ? tokenBalance : formattedBalance;

        // ลบเครื่องหมาย comma (,) ออกเพื่อให้ input นำไปคำนวณต่อได้ถูกต้อง
        const cleanAmount = maxAmount.replace(/,/g, '');

        // ถ้าเป็น 0.00 หรือไม่มีเงิน ไม่ต้องใส่ค่า
        if (parseFloat(cleanAmount) > 0) {
            setAmountIn(cleanAmount);
        }
    };

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

    const getLivePriceImpact = () => {
        if (!quoteData || !amountIn) return { text: '< 0.01%', color: 'text-green-500' };

        // 1. ดึงค่า Default ที่ได้จาก API (Jupiter/0x) มาตั้งไว้ก่อน
        let displayImpact = quoteData.priceImpact;

        // 2. คำนวณสดๆ ตรงนี้เลย เพื่อบังคับใช้ราคา USD บนหน้าจอที่สดใหม่ที่สุด!
        if (fromPrice > 0) {
            const inputUsd = parseFloat(amountIn) * fromPrice;

            // 🔥 ปรับให้ใช้ quoteUsdValue ก่อน ถ้าไม่มีค่อยไปใช้สูตรคูณเดิม
            let outputUsd = 0;
            if (quoteUsdValue) {
                outputUsd = quoteUsdValue;
            } else if (toPrice > 0) {
                outputUsd = parseFloat(quoteData.price) * toPrice;
            }

            // คำนวณเฉพาะตอนที่มี outputUsd ครบถ้วน
            if (inputUsd > 0 && outputUsd > 0) {
                const impactPercent = ((outputUsd - inputUsd) / inputUsd) * 100;

                // ถ้าคำนวณแล้วกำไรพุ่งเกิน 5% (ราคา API เพี้ยน) ให้กลับไปใช้ค่าของ 0x/Jupiter
                // แต่ถ้าปกติติดลบ (ขาดทุน) หรือกำไรนิดหน่อย ให้โชว์ค่าที่เราคำนวณสดๆ ได้เลย
                if (Math.abs(impactPercent) > 0.01 && impactPercent <= 5) {
                    displayImpact = `${impactPercent.toFixed(2)}%`;
                }
            }
        }

        // 3. จัดการเรื่องสี (เขียว เหลือง แดง)
        let colorClass = 'text-green-500';
        if (displayImpact !== 'Unknown' && !displayImpact.includes('<')) {
            const val = Math.abs(parseFloat(displayImpact.replace('%', '')));
            if (val >= 1.0 && val < 3.0) colorClass = 'text-yellow-500';
            else if (val >= 3.0) colorClass = 'text-red-500';
        }

        return { text: displayImpact, color: colorClass };
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
                    <div ref={settingsRef} className="relative flex items-center">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`transition-colors p-1 rounded-full ${isSettingsOpen ? 'bg-earth-sage/20 text-earth-olive' : 'text-earth-stone hover:bg-gray-100 hover:text-earth-darkbrown'}`}
                        >
                            <Settings size={20} />
                        </button>

                        {/* กล่องเมนูตั้งค่า Slippage (ซ่อน/โชว์) */}
                        <AnimatePresence>
                            {isSettingsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-10 right-0 bg-white border border-earth-cream/60 shadow-xl rounded-xl p-4 w-64 z-50"
                                >
                                    <div className="text-sm font-bold text-earth-darkbrown mb-3">Settings</div>
                                    <div className="text-xs text-earth-stone mb-2">Max Slippage (%)</div>
                                    <div className="flex gap-2 mb-3">
                                        {/* ปุ่มตั้งค่าแบบด่วน */}
                                        {['0.1', '0.5', '1.0'].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setSlippage(val)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${slippage === val ? 'bg-earth-olive text-white' : 'bg-earth-cream/30 text-earth-stone hover:bg-earth-cream'}`}
                                            >
                                                {val}%
                                            </button>
                                        ))}
                                    </div>
                                    {/* ช่องกรอกแบบ Custom */}
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-earth-olive focus-within:ring-1 focus-within:ring-earth-olive transition-all">
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Custom"
                                            value={slippage}
                                            onChange={(e) => setSlippage(e.target.value)}
                                            className="w-full bg-transparent outline-none text-earth-darkbrown text-sm font-medium"
                                        />
                                        <span className="text-earth-stone text-sm ml-1">%</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* ✅ เพิ่มปุ่ม X ตรงนี้ */}
                    <button
                        className="text-earth-stone hover:text-earth-clay transition-colors p-1 hover:bg-gray-100 rounded-full"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                    {/* ✅ 2. UI กล่องตั้งค่า Slippage (จะโชว์เมื่อ isSettingsOpen เป็น true) */}

                </div>
                {/* Input: Sell */}
                <div className="bg-earth-cream/40 p-4 rounded-2xl border border-transparent hover:border-earth-cream/60 transition-all mb-1">
                    <div className="flex justify-between text-xs text-earth-stone mb-2">
                        <span>You Pay</span>
                        {isChainConnected ? (
                            <div className="flex items-center gap-2">
                                <span>
                                    Balance: <span className="text-earth-darkbrown font-bold">
                                        {activeChain.type === 'SOLANA' ? tokenBalance : formattedBalance}
                                    </span>
                                </span>
                                {/* 🔥 ปุ่ม MAX ดีไซน์เข้ากับธีม Earth ของคุณ */}
                                <button
                                    onClick={handleMax}
                                    className="text-[10px] bg-earth-sage/20 text-earth-sage px-1.5 py-0.5 rounded-md hover:bg-earth-sage/30 transition-colors font-bold border border-earth-sage/20 active:scale-95"
                                >
                                    MAX
                                </button>
                            </div>
                        ) : (
                            <span className="opacity-40 italic">Connect wallet to see balance</span>
                        )}
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
                                        referrerPolicy="no-referrer"
                                    />
                                    {/* โลโก้เชนย่อส่วนให้พอดีกับกรอบ 24px */}
                                    <img
                                        src={activeChain.logo}
                                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-[1.5px] ring-white bg-white object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-earth-stone/10 animate-pulse" />
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
                            onClick={() => {
                                const temp = fromToken;
                                setFromToken(toToken);
                                setToToken(temp);
                                setAmountIn('');
                                setQuoteData(null);
                                setQuoteUsdValue(null); // 🔥 เคลียร์ค่า USD เก่าทิ้งด้วย
                            }}
                        >
                            <ArrowDown size={18} strokeWidth={3} />
                        </div>
                    </div>
                </div>

                {/* Input: Buy */}
                <div className="bg-earth-cream/40 p-4 rounded-2xl border border-transparent hover:border-earth-cream/60 transition-all mt-1">
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
                                        referrerPolicy="no-referrer"
                                        onError={(e) => e.currentTarget.src = '/smile.png'}
                                    />
                                    {/* โลโก้เชนย่อส่วนให้พอดีกับกรอบ 24px */}
                                    <img
                                        src={activeChain.logo}
                                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-[1.5px] ring-white bg-white object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-earth-stone/10 animate-pulse" />
                            )}
                            <span className="font-bold text-earth-darkbrown">{toToken?.symbol || 'Select'}</span>
                            <ArrowDown size={14} className="text-earth-stone" />
                        </button>
                    </div>
                    <div className="px-1 mt-1 text-xs text-earth-stone font-medium min-h-[1.2em]">
                        {/* 🔥 ดึงค่า quoteUsdValue มาโชว์เป็นหลัก ถ้าไม่มีค่อยใช้สูตรคูณเดิม */}
                        {quoteUsdValue
                            ? formatUsd(quoteUsdValue)
                            : (quoteData && toPrice > 0 ? formatUsd(parseFloat(quoteData.price) * toPrice) : '')}
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
                                    <span className="font-bold text-earth-darkbrown flex items-center gap-1">
                                        1 {fromToken?.symbol} ≈
                                        <QtyDisplay qty={parseFloat(quoteData.price) / parseFloat(amountIn || '1')} />
                                        <span className="ml-0.5">{toToken?.symbol}</span>
                                    </span>
                                </div>

                                {/* 2. แสดง Price Impact (Slippage) */}
                                <div className="flex justify-between items-center text-earth-stone">
                                    <span className="flex items-center gap-1">Price Impact</span>
                                    {/* 🔥 เรียกใช้ฟังก์ชัน Live Calculation ตรงนี้ */}
                                    <span className={`font-bold ${getLivePriceImpact().color}`}>
                                        {getLivePriceImpact().text}
                                    </span>
                                </div>
                                {/* ✅ 3. (เพิ่มใหม่) Minimum Received */}
                                {quoteData.minReceived && (
                                    <div className="flex justify-between items-center text-earth-stone">
                                        <span className="flex items-center gap-1">Minimum Received</span>
                                        <span className="font-bold text-earth-darkbrown">
                                            {formatDisplayValue(quoteData.minReceived)} {toToken?.symbol}
                                        </span>
                                    </div>
                                )}

                                {/* ✅ 4. (เพิ่มใหม่) Token Tax Warning (โชว์เฉพาะถ้ามี Tax เกิน 0%) */}
                                {(quoteData.sellTax > 0 || quoteData.buyTax > 0) && (
                                    <div className="flex justify-between items-center text-red-500 font-medium">
                                        <span className="flex items-center gap-1">Token Tax Warning</span>
                                        <span>
                                            Buy: {quoteData.buyTax}% | Sell: {quoteData.sellTax}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. แสดง Provider (Route via...) */}
                {quoteData && (
                    <div className="flex justify-between items-center gap-1 mt-2 px-1">
                        <span className="text-[10px] text-earth-stone flex items-center gap-1">
                            <RefreshCcw size={10} className="shrink-0" /> Route via
                        </span>
                        <span className="text-[10px] font-bold text-earth-darkbrown flex items-center gap-1 bg-earth-cream/30 px-2 py-0.5 rounded-full truncate max-w-[60%]">
                            {quoteData.provider}
                        </span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    // ✅ ปิดปุ่มถ้าเงินไม่พอ แต่ยังให้กดดูราคาได้
                    disabled={isLoading || isApproving || (isChainConnected && (!amountIn || isInsufficientBalance))}
                    className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
                        ${(isChainConnected && isInsufficientBalance)
                            ? 'bg-red-500 text-white'
                            : (needsApproval ? 'bg-blue-600 text-white' : 'bg-earth-darkbrown text-white')}
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