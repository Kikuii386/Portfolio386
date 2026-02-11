'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useDisconnect as useEvmDisconnect } from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown, Copy, LogOut, X } from 'lucide-react';


interface UnifiedConnectButtonProps {
    variant?: 'default' | 'icon' | 'mobile';
    isChristmas?: boolean;
    onOpenModal: () => void; // ✅ รับคำสั่งเปิด Modal จาก Navbar
}

export default function UnifiedConnectButton({ variant = 'default', isChristmas = false, onOpenModal }: UnifiedConnectButtonProps) {
    // ----------------------------------------------------------------
    // 1. HOOKS & LOGIC
    // ----------------------------------------------------------------
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { disconnect: disconnectEvm } = useEvmDisconnect();

    const { publicKey: solAddress, connected: isSolConnected, disconnect: disconnectSol } = useWallet();
    const { setVisible: openSolanaModal } = useWalletModal();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);



    // ปิด Dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isConnected = isEvmConnected || isSolConnected;

    const displayName = React.useMemo(() => {
        if (isEvmConnected && evmAddress) return `${evmAddress.slice(0, 4)}...${evmAddress.slice(-4)}`;
        if (isSolConnected && solAddress) return `${solAddress.toBase58().slice(0, 4)}...${solAddress.toBase58().slice(-4)}`;
        return "Connect Wallet";
    }, [isEvmConnected, evmAddress, isSolConnected, solAddress]);

    const handleDisconnect = () => {
        if (isEvmConnected) disconnectEvm();
        if (isSolConnected) disconnectSol();
        setShowProfileDropdown(false);
    };

    // ----------------------------------------------------------------
    // 2. STYLES CONFIGURATION (แกะจาก Navbar ของคุณเป๊ะๆ)
    // ----------------------------------------------------------------

    // A. สไตล์พื้นฐานของปุ่ม
    let buttonClass = "";

    if (variant === 'default') {
        // Top Bar: ปุ่มยาวปกติ, rounded-lg, px-5 py-2
        buttonClass = "flex items-center gap-2 bg-earth-sage hover:bg-earth-sage/90 text-white font-medium px-5 py-2 rounded-lg transition-all active:scale-95 shadow-md";
    }
    else if (variant === 'icon') {
        // Side Dock: สี่เหลี่ยมจัตุรัส w-10 h-10, rounded-xl, จัดกึ่งกลาง
        buttonClass = "w-10 h-10 flex items-center justify-center bg-earth-sage hover:bg-earth-sage/90 text-white rounded-xl transition-all active:scale-95 shadow-lg";
    }
    else if (variant === 'mobile') {
        // Mobile: เต็มจอ w-full, สูง py-3, รองรับ Theme คริสต์มาส
        buttonClass = `w-full flex justify-center items-center gap-2 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 ${isChristmas ? 'bg-red-600 hover:bg-red-700' : 'bg-earth-sage hover:bg-earth-sage/90'
            }`;
    }

    // B. เปลี่ยนสีเมื่อ Connect แล้ว (ให้ดูต่างกันนิดนึง)
    if (isConnected) {
        // เปลี่ยนแค่สีพื้นหลัง เป็นสีน้ำตาลเข้ม (Dark Brown) เพื่อสื่อว่า Logged In
        buttonClass = buttonClass.replace('bg-earth-sage', 'bg-earth-darkbrown border border-earth-cream/20').replace('hover:bg-earth-sage/90', 'hover:bg-[#5c4a3b]').replace('bg-red-600', 'bg-earth-darkbrown');
    }

    // ----------------------------------------------------------------
    // 3. RENDER CONTENT
    // ----------------------------------------------------------------

    return (
        <div className={`relative ${variant === 'mobile' ? 'w-full' : ''}`} ref={dropdownRef}>

            {/* --- THE BUTTON --- */}
            <button
                onClick={(e) => {
                    // ✅ 1. เพิ่มบรรทัดนี้: สั่งให้ปุ่มคลาย Focus ทันที -> Tooltip จะหายไป
                    e.currentTarget.blur();

                    // 2. Logic เดิมทำงานต่อ
                    if (isConnected) {
                        setShowProfileDropdown(!showProfileDropdown);
                    } else {
                        onOpenModal();
                    }
                }}
                className={buttonClass}
            >
                {/* 1. Icon Logic */}
                {isConnected ? (
                    // ถ้าต่อแล้ว แสดงจุดสี หรือ User Icon
                    variant === 'icon' ? (
                        // Icon Mode: Show Chain Color Dot inside User Icon
                        <div className="relative">
                            <Wallet size={20} />
                            <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-earth-darkbrown ${isEvmConnected ? 'bg-blue-500' : 'bg-[#9945FF]'}`} />
                        </div>
                    ) : (
                        // Normal Mode: Chain Dot
                        <div className={`w-2 h-2 rounded-full ${isEvmConnected ? 'bg-blue-500' : 'bg-[#9945FF]'} shadow-[0_0_8px_rgba(255,255,255,0.5)]`} />
                    )
                ) : (
                    // ยังไม่ต่อ: Show Wallet Icon
                    <Wallet size={variant === 'icon' ? 20 : 18} />
                )}

                {/* 2. Text Logic (โชว์เฉพาะ Default และ Mobile) */}
                {variant !== 'icon' && (
                    <>
                        <span>{isConnected ? displayName : "Connect Wallet"}</span>
                        {/* ลูกศรชี้ลง (โชว์เฉพาะตอนต่อแล้ว) */}
                        {isConnected && <ChevronDown size={14} className={`opacity-70 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />}
                    </>
                )}
            </button>

            {/* 2. Profile Dropdown (ตอนต่อแล้ว) */}
            {showProfileDropdown && isConnected && (
                <div className={`absolute z-50 mt-2 w-56 bg-earth-darkbrown border border-earth-cream/20 rounded-xl shadow-xl overflow-hidden
                    ${variant === 'mobile' ? 'bottom-full mb-2 w-full' : 'top-full right-0'}
                    ${variant === 'icon' ? 'left-full ml-2 top-0 mt-0' : ''}
                `}>
                    <div className="p-4 border-b border-white/10">
                        <div className="text-xs text-earth-cream/60 mb-1">Connected with</div>
                        <div className="flex items-center gap-2 text-white font-bold">
                            <div className={`w-2 h-2 rounded-full ${isEvmConnected ? 'bg-blue-500' : 'bg-[#9945FF]'}`} />
                            {isEvmConnected ? 'Ethereum' : 'Solana'}
                        </div>
                    </div>
                    <div className="p-2">
                        <button onClick={() => { const addr = isEvmConnected ? evmAddress : solAddress?.toBase58(); if (addr) navigator.clipboard.writeText(addr); setShowProfileDropdown(false); }} className="w-full flex items-center gap-2 p-2 rounded-lg text-earth-cream hover:bg-white/10 hover:text-white transition-colors text-sm h-[40px]">
                            <Copy size={16} /> Copy Address
                        </button>
                        {isEvmConnected && (
                            <button onClick={() => { openAccountModal?.(); setShowProfileDropdown(false); }} className="w-full flex items-center gap-2 p-2 rounded-lg text-earth-cream hover:bg-white/10 hover:text-white transition-colors text-sm">
                                <Wallet size={16} /> Wallet Details
                            </button>
                        )}
                        <div className="h-px bg-white/10 my-1" />
                        <button onClick={handleDisconnect} className="w-full flex items-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm">
                            <LogOut size={16} /> Disconnect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}