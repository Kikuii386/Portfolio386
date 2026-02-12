'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, LogOut, Wallet } from 'lucide-react';

interface ProfileDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>; // รับ Ref ปุ่มแม่ เพื่อกัน Click Outside
    variant?: 'default' | 'icon' | 'mobile'; // รับ Variant เพื่อจัดทิศทาง

    // Data Props
    isEvmConnected: boolean;
    evmAddress?: string;
    solAddress?: string;
    onDisconnect: () => void;
    openAccountModal?: () => void;
}

export default function ProfileDropdown({
    isOpen,
    onClose,
    triggerRef,
    variant = 'default',
    isEvmConnected,
    evmAddress,
    solAddress,
    onDisconnect,
    openAccountModal,
}: ProfileDropdownProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Click Outside Logic
    useEffect(() => {
        function handleClickOutside(e: MouseEvent | TouchEvent) {
            const target = e.target as Node;
            // ถ้าคลิกข้างนอกเมนู AND ไม่ได้คลิกที่ปุ่มแม่ (Trigger) -> ให้ปิด
            if (
                menuRef.current &&
                !menuRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target)
            ) {
                onClose();
            }
        }

        if (isOpen) {
            window.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    const handleCopy = () => {
        const addr = isEvmConnected ? evmAddress : solAddress;
        if (addr) {
            navigator.clipboard.writeText(addr);
            onClose();
        }
    };

    // กำหนด Class ตำแหน่งตาม Variant
    let positionClass = "";
    if (variant === 'mobile') {
        // Mobile: เด้งขึ้นด้านบน (Bottom Up)
        positionClass = "bottom-full left-0 mb-2 w-full origin-bottom";
    } else if (variant === 'icon') {
        // Icon (Side Dock): เด้งออกขวา (หรือซ้ายแล้วแต่ดีไซน์)
        positionClass = "left-full top-0 ml-2 mt-0 origin-top-left";
    } else {
        // Default (Top Bar): เด้งลงล่าง ชิดขวา
        positionClass = "top-full right-0 mt-2 origin-top-right";
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: variant === 'mobile' ? 10 : -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: variant === 'mobile' ? 10 : -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`absolute z-50 w-60 bg-earth-darkbrown border border-earth-cream/20 rounded-xl shadow-xl overflow-hidden backdrop-blur-md ${positionClass}`}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="text-xs text-earth-cream/60 mb-1">Connected with</div>
                        <div className="flex items-center gap-2 text-white font-bold">
                            <div
                                className={`w-2 h-2 rounded-full ${isEvmConnected ? 'bg-blue-500' : 'bg-[#9945FF]'
                                    }`}
                            />
                            {isEvmConnected ? 'Ethereum (EVM)' : 'Solana'}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center gap-2 p-2 rounded-lg text-earth-cream hover:bg-white/10 hover:text-white transition-colors text-sm h-[40px]"
                        >
                            <Copy size={16} /> Copy Address
                        </button>

                        {isEvmConnected && (
                            <button
                                onClick={() => {
                                    openAccountModal?.();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-lg text-earth-cream hover:bg-white/10 hover:text-white transition-colors text-sm"
                            >
                                <Wallet size={16} /> Wallet Details
                            </button>
                        )}

                        <div className="h-px bg-white/10 my-1" />

                        <button
                            onClick={() => {
                                onDisconnect();
                                onClose();
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm"
                        >
                            <LogOut size={16} /> Disconnect
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}