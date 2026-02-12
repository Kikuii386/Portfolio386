'use client';

import React, { useState, useRef, useEffect } from 'react';

import { useAccount, useDisconnect as useEvmDisconnect } from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown } from 'lucide-react'; // เอา icon ที่ไม่ได้ใช้ออก
import ProfileDropdown from './ProfileDropdown';
import Tooltip from './ui/Tooltips'; // ✅ Import Tooltip

interface UnifiedConnectButtonProps {
    variant?: 'default' | 'icon' | 'mobile';
    isChristmas?: boolean;
    onOpenModal: () => void;
}

export default function UnifiedConnectButton({ variant = 'default', isChristmas = false, onOpenModal }: UnifiedConnectButtonProps) {
    // ----------------------------------------------------------------
    // 1. HOOKS & LOGIC
    // ----------------------------------------------------------------
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { openAccountModal } = useAccountModal();
    const { disconnect: disconnectEvm } = useEvmDisconnect();

    const { publicKey: solAddress, connected: isSolConnected, disconnect: disconnectSol } = useWallet();

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null); // ประกาศ Ref ตรงนี้

    const isConnected = isEvmConnected || isSolConnected;

    // Click Outside Logic
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
    // 2. STYLES CONFIGURATION
    // ----------------------------------------------------------------
    let buttonClass = "";

    if (variant === 'default') {
        buttonClass = "flex items-center gap-2 bg-earth-sage hover:bg-earth-sage/90 text-white font-medium justify-center py-2 h-[40px] w-[178.77px] rounded-lg transition-all active:scale-95 shadow-md";
    }
    else if (variant === 'icon') {
        buttonClass = "w-10 h-10 flex items-center justify-center bg-earth-sage hover:bg-earth-sage/90 text-white rounded-xl transition-all active:scale-95 shadow-lg";
    }
    else if (variant === 'mobile') {
        buttonClass = `w-full flex justify-center items-center gap-2 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 ${isChristmas ? 'bg-red-600 hover:bg-red-700' : 'bg-earth-sage hover:bg-earth-sage/90 h-[48px]'}`;
    }

    if (isConnected) {
        buttonClass = buttonClass.replace('bg-earth-sage', 'bg-earth-darkbrown border border-earth-cream/20').replace('hover:bg-earth-sage/90', 'hover:bg-[#5c4a3b]').replace('bg-red-600', 'bg-earth-darkbrown');
    }

    // ----------------------------------------------------------------
    // 3. PREPARE BUTTON CONTENT
    // ----------------------------------------------------------------
    // สร้างตัวแปรเก็บ JSX ของปุ่มไว้ เพื่อนำไป wrap ด้วย Tooltip ได้ง่าย
    const buttonContent = (
        <button
            ref={buttonRef}
            onClick={(e) => {
                // ✅ สั่งให้ปุ่มคลาย Focus ทันที -> Tooltip จะหายไปเมื่อคลิก
                e.currentTarget.blur();

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
                variant === 'icon' ? (
                    <div className="relative">
                        <Wallet size={20} />
                        <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-earth-darkbrown ${isEvmConnected ? 'bg-blue-500' : 'bg-[#9945FF]'}`} />
                    </div>
                ) : (
                    <div className={`w-2 h-2 rounded-full ${isEvmConnected ? 'bg-blue-500' : 'bg-[#9945FF]'} shadow-[0_0_8px_rgba(255,255,255,0.5)]`} />
                )
            ) : (
                <Wallet size={variant === 'icon' ? 20 : 18} />
            )}

            {/* 2. Text Logic */}
            {variant !== 'icon' && (
                <>
                    <span>{isConnected ? displayName : "Connect Wallet"}</span>
                    {isConnected && <ChevronDown size={14} className={`opacity-70 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />}
                </>
            )}
        </button>
    );

    // ----------------------------------------------------------------
    // 4. RENDER FINAL
    // ----------------------------------------------------------------
    return (
        <div className={`relative ${variant === 'mobile' ? 'w-full' : ''}`} ref={dropdownRef}>

            {/* ✅ ถ้าเป็น variant="icon" ให้ครอบ Tooltip ลงไปที่ปุ่ม */}
            {variant === 'icon' ? (
                <Tooltip content={isConnected ? "Account" : "Connect Wallet"} side="right">
                    {buttonContent}
                </Tooltip>
            ) : (
                // ถ้าไม่ใช่ icon ก็แสดงปุ่มปกติ
                buttonContent
            )}

            {/* ✅ ProfileDropdown อยู่นอก Tooltip แต่อยู่ใน div relative เดียวกัน */}
            <ProfileDropdown
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                triggerRef={buttonRef}
                variant={variant}
                isEvmConnected={isEvmConnected}
                evmAddress={evmAddress}
                solAddress={solAddress?.toBase58()}
                onDisconnect={handleDisconnect}
                openAccountModal={openAccountModal}
            />
        </div>
    );
}