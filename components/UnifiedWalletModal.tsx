'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useConnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, ChevronRight, Wallet } from 'lucide-react';

interface UnifiedWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// 🛠️ 1. ฟังก์ชันช่วยหารูป Logo ของฝั่ง EVM
const getEvmLogo = (connectorId: string, connectorName: string): string | null => {
    const id = connectorId.toLowerCase();
    const name = connectorName.toLowerCase();

    // ✅ MetaMask
    if (id.includes('metamask') || name.includes('metamask')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg';
    }
    // ✅ WalletConnect
    if (id.includes('walletconnect') || name.includes('walletconnect')) {
        return 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg';
    }
    // ✅ Coinbase
    if (id.includes('coinbase') || name.includes('coinbase')) {
        return 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4';
    }
    // ✅ Rabby Wallet (ใช้ GitHub Avatar ของ RabbyHub)
    if (id.includes('rabby') || name.includes('rabby')) {
        return 'https://images.seeklogo.com/logo-png/48/1/rabby-logo-png_seeklogo-483982.png';
    }
    // ✅ Safe Wallet (ใช้ GitHub Avatar ของ Safe Global)
    if (id.includes('safe') || name.includes('safe')) {
        return 'https://user-images.githubusercontent.com/3975770/212338977-5968eae5-bb1b-4e71-8f82-af5282564c66.png';
    }
    // ✅ Trust Wallet
    if (id.includes('trust') || name.includes('trust')) {
        return 'https://avatars.githubusercontent.com/u/32179842?s=200&v=4';
    }
    // ✅ Zerion
    if (id.includes('zerion') || name.includes('zerion')) {
        return 'https://cdn.brandfetch.io/id6BQtj_VW/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1761186878514';
    }
    // ✅ Rainbow
    if (id.includes('rainbow') || name.includes('rainbow')) {
        return 'https://avatars.githubusercontent.com/u/48327834?s=200&v=4';
    }

    // ถ้าไม่เข้าเงื่อนไขเลย ให้คืนค่า null (จะไปใช้ default icon แทน)
    return null;
};

export default function UnifiedWalletModal({ isOpen, onClose }: UnifiedWalletModalProps) {
    const [activeTab, setActiveTab] = useState<'evm' | 'sol'>('evm');
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // EVM Hooks
    const { connectors, connect } = useConnect();

    // Solana Hooks
    const { wallets, select } = useWallet();

    useEffect(() => {
        setMounted(true);
        if (isOpen) setIsAnimating(true);
        else setTimeout(() => setIsAnimating(false), 200);
    }, [isOpen]);

    // 🛠️ 2. กรอง Connector ของ EVM ไม่ให้ซ้ำ และเรียงลำดับสวยๆ
    const uniqueConnectors = React.useMemo(() => {
        const unique = new Map();
        connectors.forEach((c) => {
            // กรองพวก Recent หรือ Injected ซ้ำๆ ออก
            if (!unique.has(c.name) && c.id !== 'injected') {
                unique.set(c.name, c);
            } else if (c.id === 'injected' && !unique.has('Browser Wallet')) {
                // เปลี่ยนชื่อ Injected เป็น Browser Wallet ให้เข้าใจง่าย
                unique.set('Browser Wallet', { ...c, name: 'Browser Wallet' });
            }
        });
        return Array.from(unique.values());
    }, [connectors]);

    if (!mounted || (!isOpen && !isAnimating)) return null;

    const modalContent = (
        <div className={`fixed inset-0 z-[140] flex items-center justify-center px-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onMouseEnter={stopPropagation}
            onMouseLeave={stopPropagation}
            onMouseOver={stopPropagation}
            onMouseMove={stopPropagation}
            onClick={stopPropagation} // กันไว้เผื่อๆ
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className={`
                relative w-full max-w-sm bg-earth-darkbrown border border-earth-cream/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]
                transform transition-all duration-300
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}>
                <div className="flex items-center justify-between p-5 pb-2">
                    <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* TABS */}
                <div className="px-5 pb-4 pt-2">
                    <div className="flex p-1 bg-black/20 rounded-xl">
                        <button onClick={() => setActiveTab('evm')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'evm' ? 'bg-earth-sage text-white shadow-md' : 'text-white/50 hover:text-white'}`}>Ethereum (EVM)</button>
                        <button onClick={() => setActiveTab('sol')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'sol' ? 'bg-[#9945FF] text-white shadow-md' : 'text-white/50 hover:text-white'}`}>Solana</button>
                    </div>
                </div>

                {/* LIST */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">

                    {/* --- EVM LIST --- */}
                    {activeTab === 'evm' && (
                        <div className="flex flex-col gap-1 animate-in slide-in-from-left-4 duration-200">
                            {uniqueConnectors.map((connector: any) => {
                                // หารูป Logo
                                const logoUrl = getEvmLogo(connector.id, connector.name) || connector.icon;

                                return (
                                    <button
                                        key={connector.uid || connector.id}
                                        onClick={() => { connect({ connector }); onClose(); }}
                                        className="group flex items-center justify-between p-3 mx-2 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1 shadow-sm">
                                                {/* ถ้ามีรูป ให้โชว์รูป ถ้าไม่มีให้โชว์ไอคอน Wallet สีดำ */}
                                                {logoUrl ? (
                                                    <img src={logoUrl} alt={connector.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Wallet className="text-black w-6 h-6" />
                                                )}
                                            </div>
                                            <span className="text-white font-bold text-base">
                                                {connector.name || 'Unknown Wallet'}
                                            </span>
                                        </div>
                                        <ChevronRight size={18} className="text-white/30 group-hover:text-white transition-all" />
                                    </button>
                                );
                            })}

                            {/* Fallback ถ้าไม่เจอ Connector เลย */}
                            {uniqueConnectors.length === 0 && (
                                <div className="text-center text-white/40 py-10 text-sm">
                                    No EVM wallets detected. <br /> Please install MetaMask.
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- SOLANA LIST --- */}
                    {activeTab === 'sol' && (
                        <div className="flex flex-col gap-1 animate-in slide-in-from-right-4 duration-200">
                            {wallets.map((wallet) => (
                                <button
                                    key={wallet.adapter.name}
                                    onClick={() => { select(wallet.adapter.name); onClose(); }}
                                    className="group flex items-center justify-between p-3 mx-2 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-black/20 overflow-hidden p-1 shadow-sm">
                                            <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-white font-bold text-base">{wallet.adapter.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {wallet.readyState === 'Installed' && <span className="text-[10px] bg-earth-sage/20 text-earth-sage px-2 py-0.5 rounded">DETECTED</span>}
                                        <ChevronRight size={18} className="text-white/30 group-hover:text-white transition-all" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 text-center border-t border-white/10 text-xs text-white/30">By connecting, you agree to our Terms of Service</div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}