'use client';

import React, { useMemo } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';


// --- EVM Imports ---
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// --- Solana Imports ---
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// 1. Config EVM (Wagmi + RainbowKit)
const config = getDefaultConfig({
    appName: 'My Crypto Dashboard',
    projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // ไปขอฟรีที่ cloud.walletconnect.com (ถ้าไม่มีใช้ string มั่วๆ ไปก่อนได้ตอน dev)
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    // 2. Config Solana
    const network = 'mainnet-beta'; // หรือ 'devnet'
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        // Layer 1: EVM Provider
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>

                    {/* Layer 2: Solana Provider */}
                    <ConnectionProvider endpoint={endpoint}>
                        <WalletProvider wallets={wallets} autoConnect>
                            <WalletModalProvider>

                                {children}

                            </WalletModalProvider>
                        </WalletProvider>
                    </ConnectionProvider>

                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}