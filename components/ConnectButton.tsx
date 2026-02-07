'use client';

import React from 'react';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, ChevronDown, LogOut, Copy } from 'lucide-react';
import DropdownSelect from './ui/DropdownSelect'; // ✅ ใช้ DropdownSelect ตัวใหม่

export default function WalletConnectButton() {
    return (
        <div className="flex items-center gap-3">
            {/* 1. ปุ่ม EVM (RainbowKit) - โค้ดเดิม */}
            <RainbowConnectButton.Custom>
                {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                        <div
                            {...(!ready && {
                                'aria-hidden': true,
                                style: {
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                },
                            })}
                        >
                            {(() => {
                                if (!connected) {
                                    return (
                                        <button
                                            onClick={openConnectModal}
                                            className="flex items-center gap-2 bg-earth-sage hover:bg-earth-sage/90 text-white font-medium px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md text-sm"
                                        >
                                            <Wallet size={18} />
                                            <span>EVM</span>
                                        </button>
                                    );
                                }

                                if (chain.unsupported) {
                                    return (
                                        <button
                                            onClick={openChainModal}
                                            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md text-sm"
                                        >
                                            Wrong network
                                        </button>
                                    );
                                }

                                return (
                                    <div className="flex items-center gap-2">
                                        {/* Chain Badge */}
                                        <button
                                            onClick={openChainModal}
                                            className="hidden md:flex items-center gap-1 bg-earth-cream/20 hover:bg-earth-cream/40 border border-earth-cream/30 text-earth-darkbrown px-2 py-2.5 rounded-xl transition-all text-xs font-bold"
                                        >
                                            {chain.hasIcon && (
                                                <div
                                                    style={{
                                                        background: chain.iconBackground,
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 999,
                                                        overflow: 'hidden',
                                                        marginRight: 4,
                                                    }}
                                                >
                                                    {chain.iconUrl && (
                                                        <img
                                                            alt={chain.name ?? 'Chain icon'}
                                                            src={chain.iconUrl}
                                                            style={{ width: 16, height: 16 }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {chain.name}
                                        </button>

                                        {/* Account Button */}
                                        <button
                                            onClick={openAccountModal}
                                            className="flex items-center gap-2 bg-earth-darkbrown hover:bg-[#5c4a3b] text-white font-medium px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md text-sm"
                                        >
                                            {account.displayName}
                                            <ChevronDown size={14} className="opacity-70" />
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                }}
            </RainbowConnectButton.Custom>

            {/* 2. ปุ่ม Solana - ใช้แบบ DropdownSelect */}
            <SolanaConnectButton />
        </div>
    );
}

// แยก Component Solana
function SolanaConnectButton() {
    const { setVisible } = useWalletModal();
    const { publicKey, disconnect, connected } = useWallet();

    const shortAddress = React.useMemo(() => {
        if (!publicKey) return '';
        const base58 = publicKey.toBase58();
        return `${base58.slice(0, 4)}..${base58.slice(-4)}`;
    }, [publicKey]);

    // Handler สำหรับ Dropdown
    const handleAction = (value: string) => {
        if (value === 'Copy Address') {
            if (publicKey) {
                navigator.clipboard.writeText(publicKey.toBase58());
                // (Optional) ใส่ Toast แจ้งเตือนตรงนี้ได้
            }
        } else if (value === 'Disconnect') {
            disconnect();
        }
    };

    if (!connected) {
        return (
            <button
                onClick={() => setVisible(true)}
                className="flex items-center gap-2 bg-earth-sage hover:bg-earth-sage/90 text-white font-medium px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md text-sm"
            >
                <Wallet size={18} />
                <span>SOL</span>
            </button>
        );
    }

    // ✅ ใช้ DropdownSelect เพื่อให้เมนูลอยทับทุกอย่าง (Z-Index 9999)
    return (
        <div className="w-[140px]">
            <DropdownSelect
                selected={shortAddress}
                options={[
                    { items: ['Copy Address', 'Disconnect'] }
                ]}
                onSelect={handleAction}
                buttonClass="bg-[#9945FF] hover:bg-[#863ce0] text-white border-none shadow-md"
                getLabel={(val) => val} // ป้องกันการแปลงเป็นตัวใหญ่
            />
        </div>
    );
}