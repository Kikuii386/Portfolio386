'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Check, Loader2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Tooltip from './ui/Tooltips';
// --- Types ต้องมี Chain Config ด้วย ---
export interface Token {
    symbol: string;
    name: string;
    logo: string;
    address: string;
    decimals: number;
    chainId?: number;
    balance?: string;
}

export interface ChainConfig {
    id: string;
    name: string;
    type?: string | 'EVM' | 'SOLANA';
    chainId?: number;
    logo: string;
    tokenListUrl?: string;
}

interface TokenSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokens: Token[];
    onSelect: (token: Token) => void;
    selectedToken?: Token | null;
    isLoading?: boolean;
    // ✅ Props ใหม่สำหรับระบบจัดการ Chain
    chains: ChainConfig[];
    activeChain: ChainConfig;
    onChainSelect: (chain: ChainConfig) => void;
}

export default function TokenSelectorModal({
    isOpen,
    onClose,
    tokens,
    onSelect,
    selectedToken,
    isLoading = false,
    chains,
    activeChain,
    onChainSelect
}: TokenSelectorModalProps) {
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [copiedText, setCopiedText] = useState<string>('');
    const [visibleCount, setVisibleCount] = useState(50);

    useEffect(() => {
        setVisibleCount(50);
    }, [search, activeChain.id])

    // Auto Focus
    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // กรองเหรียญ
    const filteredTokens = useMemo(() => {
        if (!search.trim()) return tokens;
        const lowerSearch = search.toLowerCase();
        return tokens.filter((t) =>
            t.symbol.toLowerCase().includes(lowerSearch) ||
            t.name.toLowerCase().includes(lowerSearch) ||
            t.address.toLowerCase() === lowerSearch
        );
    }, [tokens, search]);

    // ✅ ฟังก์ชันสำหรับ Copy Contract Address
    const handleCopy = (e: React.MouseEvent, address: string, symbol: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(address);
        setCopiedText(address);
        toast.success(`Copied ${symbol} contract address!`);

        // คืนค่ากลับเป็นไอคอน Copy หลังผ่านไป 2 วินาที
        setTimeout(() => setCopiedText(''), 2000);
    };
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // ถ้าเลื่อนมาเหลืออีก 100px จะถึงก้น ให้โชว์เหรียญเพิ่ม
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            setVisibleCount((prev) => prev + 50);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-earth-darkbrown">Select a Token</h3>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-earth-stone transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 pb-2 bg-white">
                            <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-xl border-2 border-transparent focus-within:border-earth-sage/50 transition-all">
                                <Search size={20} className="text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search name or paste address"
                                    className="bg-transparent w-full outline-none text-earth-darkbrown font-medium placeholder:text-gray-400"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 🌟 NETWORK SELECTOR (คล้าย PancakeSwap) 🌟 */}
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                            <div className="text-xs font-semibold text-earth-stone mb-2">Networks</div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {chains.map((chain) => {
                                    const isActive = chain.id === activeChain.id;
                                    return (
                                        <button
                                            key={chain.id}
                                            onClick={() => onChainSelect(chain)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0
                                                ${isActive
                                                    ? 'bg-earth-sage/20 border-earth-olive text-earth-darkbrown shadow-sm font-bold'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 font-medium'
                                                }`}
                                        >
                                            <img src={chain.logo} alt={chain.name} className="w-5 h-5 rounded-full" />
                                            <span className="text-sm">{chain.name}</span>
                                            {isActive && <Check size={14} className="text-earth-olive ml-1" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Token List */}
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent min-h-[250px]" onScroll={handleScroll}>
                            {/* ... (โค้ดแสดง Loading / List / Empty เหมือนเดิมเป๊ะๆ) ... */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 opacity-60">
                                    <Loader2 size={32} className="text-earth-olive animate-spin mb-2" />
                                    <p className="text-sm text-earth-stone">Fetching {activeChain.name} tokens...</p>
                                </div>
                            ) : filteredTokens.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredTokens.slice(0, visibleCount).map((token) => {
                                        const isSelected = selectedToken?.address === token.address;
                                        return (
                                            // ✅ 1. เปลี่ยนเป็น div แล้วใส่ role="button"
                                            <div
                                                key={`${token.address}-${token.chainId}`}
                                                onClick={() => {
                                                    // ถ้ายกเลิก/คลิกซ้ำตัวเดิม จะได้ไม่เกิดอะไรขึ้น
                                                    if (!isSelected) {
                                                        onSelect(token);
                                                        onClose();
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${isSelected ? 'bg-earth-sage/10 cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 min-w-[40px] shrink-0">
                                                        <img
                                                            src={token.logo || '/smile.png'}
                                                            className="w-full h-full rounded-full object-contain bg-white border border-gray-100 shadow-sm"
                                                            onError={(e) => e.currentTarget.src = '/smile.png'}
                                                            loading="lazy"
                                                        />
                                                        <img
                                                            src={activeChain.logo}
                                                            className="absolute bottom-0 right-0 w-[16px] h-[16px] rounded-full ring-1 ring-white bg-white object-contain"
                                                        />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-earth-darkbrown group-hover:text-earth-olive transition-colors">
                                                            {token.symbol}
                                                        </div>
                                                        {/* ✅ 2. เอา Tooltip ครอบส่วน Contract ทั้งก้อนแบบ SwipeableRow */}
                                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mt-0.5">
                                                            <span className="truncate max-w-[100px] sm:max-w-[140px]" title={token.name}>
                                                                {token.name}
                                                            </span>
                                                            <span className="text-gray-300 shrink-0">•</span>

                                                            <Tooltip content="Copy address" side="right">
                                                                <div
                                                                    className="inline-flex items-center gap-1 cursor-pointer group/addr align-middle"
                                                                    onClick={(e) => handleCopy(e, token.address, token.symbol)}
                                                                >
                                                                    <span className="font-mono text-[10px] text-earth-stone opacity-70 group-hover/addr:text-earth-sage group-hover/addr:opacity-100 transition-all duration-200">
                                                                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                                                    </span>
                                                                    <div className="p-0.5 rounded-md text-earth-stone group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all duration-200">
                                                                        {copiedText === token.address ? (
                                                                            <Check size={12} className="text-earth-sage animate-in zoom-in duration-200" />
                                                                        ) : (
                                                                            <Copy size={12} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isSelected && <Check size={20} className="text-earth-sage" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                    <div className="bg-gray-100 p-4 rounded-full mb-3"><Search size={32} className="text-gray-400" /></div>
                                    <p className="text-earth-stone font-medium">No tokens found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}