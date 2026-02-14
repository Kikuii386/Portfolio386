'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// กำหนด Type ของ Token ที่จะรับเข้ามา
export interface Token {
    symbol: string;
    name: string;
    logo: string;
    address: string;
    decimals: number;
    chainId?: number;
    balance?: string; // รองรับการส่ง Balance มาโชว์ในอนาคต
}

interface TokenSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokens: Token[];
    onSelect: (token: Token) => void;
    selectedToken?: Token | null; // รับตัวที่เลือกอยู่ปัจจุบันมาโชว์ติ๊กถูก
}

export default function TokenSelectorModal({
    isOpen,
    onClose,
    tokens,
    onSelect,
    selectedToken
}: TokenSelectorModalProps) {
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto Focus ช่องค้นหาเมื่อเปิด Modal
    useEffect(() => {
        if (isOpen) {
            setSearch(''); // ล้างคำค้นหาเก่า
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Logic การกรองเหรียญ (Memoized เพื่อประสิทธิภาพ)
    const filteredTokens = useMemo(() => {
        if (!search.trim()) return tokens;

        const lowerSearch = search.toLowerCase();
        return tokens.filter((t) =>
            t.symbol.toLowerCase().includes(lowerSearch) ||
            t.name.toLowerCase().includes(lowerSearch) ||
            t.address.toLowerCase() === lowerSearch
        );
    }, [tokens, search]);

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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
                            <h3 className="font-bold text-lg text-earth-darkbrown">Select Token</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full text-earth-stone transition-colors"
                            >
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

                        {/* Token List */}
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {/* Common Tokens / Results */}
                            {filteredTokens.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredTokens.slice(0, 100).map((token) => {
                                        const isSelected = selectedToken?.address === token.address;
                                        return (
                                            <button
                                                key={`${token.address}-${token.chainId}`}
                                                onClick={() => {
                                                    onSelect(token);
                                                    onClose();
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${isSelected
                                                    ? 'bg-earth-sage/10 cursor-default'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                                disabled={isSelected}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img
                                                            src={token.logo || '/smile.png'}
                                                            alt={token.symbol}
                                                            className="w-10 h-10 rounded-full border border-gray-100 object-cover bg-white shadow-sm"
                                                            onError={(e) => e.currentTarget.src = '/smile.png'}
                                                        />
                                                        {/* Chain Badge (Optional) */}
                                                        {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-200 rounded-full border border-white" /> */}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-earth-darkbrown group-hover:text-earth-olive transition-colors">
                                                            {token.symbol}
                                                        </div>
                                                        <div className="text-gray-400 text-xs font-medium">
                                                            {token.name}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side: Balance or Checkmark */}
                                                <div className="text-right">
                                                    {isSelected && (
                                                        <Check size={20} className="text-earth-sage" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Empty State
                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                                        <Search size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-earth-stone font-medium">No tokens found</p>
                                    <p className="text-xs text-gray-400 mt-1">Try pasting contract address</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}