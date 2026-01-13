'use client';

import React, { useState } from 'react';
import { ethers, Contract, JsonRpcProvider } from 'ethers';
import Tooltip from '@/components/ui/Tooltips';
import QtyDisplay from '@/components/QtyDisplay'; // เช็ค path ให้ถูกต้อง
import { useCopyToClipboard } from '@/hook/useCopyToClipboard';
import DropdownSelect from '@/components/ui/DropdownSelect';
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Earth,
  X,
} from 'lucide-react'; // ปรับ path ตามจริง

/* ----------------------------- EVM network config ----------------------------- */

type NetworkKey =
  | 'eth'
  | 'bsc'
  | 'polygon'
  | 'arb'
  | 'avax'
  | 'base'
  | 'blast'
  | 'linea'
  | 'merlin'
  | 'op'
  | 'sonic'
  | 'zk'
  | 'dogechain'
  | 'abstract';

interface NetworkConfig {
  name: string;
  rpc: string;
  symbol: string;
  chainId: number;
}

const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  eth: {
    name: 'Ethereum (ETH)',
    rpc: 'https://rpc.ankr.com/eth/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'ETH',
    chainId: 1,
  },
  bsc: {
    name: 'Binance Smart Chain (BSC)',
    rpc: 'https://rpc.ankr.com/bsc/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'BSC',
    chainId: 56,
  },
  polygon: {
    name: 'Polygon (POL)',
    rpc: 'https://rpc.ankr.com/polygon/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'POLYGON',
    chainId: 137,
  },
  arb: {
    name: 'Arbitrum (ARB)',
    rpc: 'https://rpc.ankr.com/arbitrum/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'ARB',
    chainId: 42161,
  },
  avax: {
    name: 'Avalanche (AVAX)',
    rpc: 'https://rpc.ankr.com/avalanche/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'AVAX',
    chainId: 43114,
  },
  base: {
    name: 'Base',
    rpc: 'https://rpc.ankr.com/base/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'BASE',
    chainId: 8453,
  },
  blast: {
    name: 'Blast',
    rpc: 'https://rpc.ankr.com/blast/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'BLAST',
    chainId: 81457,
  },
  linea: {
    name: 'Linea',
    rpc: 'https://1rpc.io/linea',
    symbol: 'LINEA',
    chainId: 59144,
  },
  merlin: {
    name: 'Merlin',
    rpc: 'https://rpc.merlinchain.io',
    symbol: 'BTC',
    chainId: 4200,
  },
  op: {
    name: 'Optimism (OP)',
    rpc: 'https://1rpc.io/op',
    symbol: 'OP',
    chainId: 10,
  },
  sonic: {
    name: 'Sonic',
    rpc: 'https://rpc.soniclabs.com',
    symbol: 'S',
    chainId: 146,
  },
  zk: {
    name: 'zkSync (ZK)',
    rpc: 'https://rpc.ankr.com/zksync_era/7b341fb9dfbaaa72b31a587788026541506adb75461c257e9bec0aaa3b418f50',
    symbol: 'ETH',
    chainId: 324,
  },
  dogechain: {
    name: 'Dogechain',
    rpc: 'https://rpc.dogechain.dog',
    symbol: 'DC',
    chainId: 2000,
  },
  abstract: {
    name: 'Abstract',
    rpc: 'https://api.mainnet.abs.xyz',
    symbol: 'ABS',
    chainId: 2741,
  },
};

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/* --------------------------------- types --------------------------------- */

interface Wallet {
  id: number | string;
  label: string;
  address: string;
}

interface WalletBalanceResult {
  label: string;
  address: string;
  rawBalance: bigint;
  formatted: string;
}

interface ScanResult {
  results: WalletBalanceResult[];
  tokenSymbol: string;
}

/* ---------------------- endpoint mapping ---------------------- */

type EvmEndpointKey =
  | 'ETH'
  | 'BSC'
  | 'POLYGON'
  | 'ARB'
  | 'AVAX'
  | 'BASE'
  | 'BLAST'
  | 'LINEA'
  | 'MERLIN'
  | 'OP'
  | 'SONIC'
  | 'ZK'
  | 'DOGECHAIN'
  | 'ABSTRACT';

const EVM_ENDPOINTS: EvmEndpointKey[] = [
  'ETH',
  'BSC',
  'POLYGON',
  'ARB',
  'AVAX',
  'BASE',
  'BLAST',
  'LINEA',
  'MERLIN',
  'OP',
  'SONIC',
  'ZK',
  'DOGECHAIN',
  'ABSTRACT',
];

const ENDPOINT_TO_NETWORK: Partial<Record<EvmEndpointKey, NetworkKey>> = {
  ETH: 'eth',
  BSC: 'bsc',
  POLYGON: 'polygon',
  ARB: 'arb',
  AVAX: 'avax',
  BASE: 'base',
  BLAST: 'blast',
  LINEA: 'linea',
  MERLIN: 'merlin',
  OP: 'op',
  SONIC: 'sonic',
  ZK: 'zk',
  DOGECHAIN: 'dogechain',
  ABSTRACT: 'abstract',
};

function getEndpointLabel(endpoint: EvmEndpointKey): string {
  const netKey = ENDPOINT_TO_NETWORK[endpoint];
  if (netKey) return NETWORKS[netKey].name;
  return endpoint;
}

/* ------------------------------ scan helper ------------------------------ */
async function scanEvmTokenBalances(
  wallets: Wallet[],
  tokenAddress: string,
  network: NetworkConfig
): Promise<ScanResult> {
  const provider = new JsonRpcProvider(network.rpc);
  const token = new Contract(tokenAddress, ERC20_ABI, provider);

  let decimals = 18;
  let symbol = 'TOKEN';

  try {
    decimals = await token.decimals();
  } catch {
    decimals = 18;
  }
  try {
    symbol = await token.symbol();
  } catch {
    symbol = 'TOKEN';
  }

  const concurrency = 8;
  const chunks: Wallet[][] = [];
  for (let i = 0; i < wallets.length; i += concurrency)
    chunks.push(wallets.slice(i, i + concurrency));

  const resultsAcc: WalletBalanceResult[] = [];

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (w) => {
        try {
          const balance = (await token.balanceOf(w.address)) as bigint;
          if (balance > 0n) {
            resultsAcc.push({
              label: w.label,
              address: w.address,
              rawBalance: balance,
              formatted: ethers.formatUnits(balance, decimals),
            });
          }
        } catch (err) {
          console.error(`Error ${w.label}`, err);
        }
      })
    );
  }

  resultsAcc.sort((a, b) => (a.rawBalance < b.rawBalance ? 1 : -1));
  return { results: resultsAcc, tokenSymbol: symbol };
}

/* --------------------------- Component -------------------------- */

export default function EvmMultiWalletBalanceChecker() {
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<EvmEndpointKey>('ETH');
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WalletBalanceResult[]>([]);
  const [tokenSymbol, setTokenSymbol] = useState<string>('TOKEN');
  const [hasScanned, setHasScanned] = useState(false);
  const { copiedText, copy } = useCopyToClipboard();

  const handleScan = async () => {
    setError(null);
    setResults([]);
    setLoading(true);
    setHasScanned(false);

    try {
      if (!tokenAddress) throw new Error('Please enter token contract address');
      if (!ethers.isAddress(tokenAddress))
        throw new Error('Invalid EVM token address');

      const res = await fetch(`/api/wallets?type=evm`);
      if (!res.ok) throw new Error('Failed to load wallets');
      const data = (await res.json()) as { wallets: Wallet[] };
      if (!data.wallets?.length) throw new Error('No EVM wallets found');

      const networkKey = ENDPOINT_TO_NETWORK[selectedEndpoint];
      if (!networkKey) throw new Error('RPC not configured for this network.');

      const scanResult = await scanEvmTokenBalances(
        data.wallets,
        tokenAddress,
        NETWORKS[networkKey]
      );
      setTokenSymbol(scanResult.tokenSymbol);
      setResults(scanResult.results);
      setHasScanned(true);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTokenAddress('');
    setResults([]);
    setHasScanned(false);
    setTokenSymbol('');
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Endpoint Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
            Select Network
          </label>
          <div className="relative group z-10">
            <DropdownSelect
              // 1. แปลง options ให้เป็น format ของ DropdownSelect
              options={[
                {
                  label: 'EVM Networks',
                  items: EVM_ENDPOINTS,
                },
              ]}
              // 2. ค่าที่เลือกปัจจุบัน
              selected={selectedEndpoint}
              // 3. เมื่อเลือกให้ set state (Type casting จำเป็นนิดหน่อย)
              onSelect={(val) => setSelectedEndpoint(val as EvmEndpointKey)}
              // 4. ฟังก์ชันแสดงชื่อสวยๆ (Label)
              getLabel={(key) => getEndpointLabel(key as EvmEndpointKey)}
              // 5. ปรับสไตล์ปุ่มให้เหมือน Input (สูง 50px, สี earth-cream/20)
              buttonClass=" h-[50px] w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown font-medium justify-between px-4 hover:bg-earth-cream/30 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage"
            />
          </div>
        </div>

        {/* Token Address Input */}
        <div className="md:col-span-8 space-y-1.5">
          <label className="h-[50px] text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
            Token Address
          </label>
          <div className="relative w-full group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone/80 group-focus-within:text-earth-sage transition-colors">
              <Terminal size={18} />
            </div>
            <input
              type="text"
              placeholder="e.g. 0xdAC17... (USDT)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="pl-10 pr-10 py-3.5 w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown placeholder-earth-stone/80 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all font-mono text-sm hover:bg-earth-cream/30"
            />
            {tokenAddress && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                <Tooltip content="Clear" side="bottom">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-full bg-earth-brown/50 text-white hover:bg-red-400 transition-all duration-200 shadow-sm hover:scale-110 flex items-center justify-center"
                  >
                    <X size={12} strokeWidth={4} />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-earth-stone/70 px-1">
        * Tip: Select a network and enter the ERC-20 Token Contract Address.
      </div>
      {/* Action Button */}
      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full py-3.5 bg-earth-sage text-white font-semibold rounded-xl hover:bg-earth-olive hover:shadow-lg hover:shadow-earth-sage/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Search size={20} />
        )}
        <span>{loading ? 'Scanning...' : 'Scan Balances'}</span>
      </button>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50/50 text-red-600 text-sm rounded-xl border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {!loading && !error && results.length > 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/80 overflow-hidden shadow-sm">
          {/* Header Summary (ใช้ร่วมกันทั้ง Mobile/Desktop) */}
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span className="text-sm sm:text-base">
                Found in {results.length} wallets
              </span>
            </div>

            {/* Total Balance Badge */}
            {(() => {
              const total = results.reduce(
                (sum, r) => sum + Number(r.formatted.replace(/,/g, '')),
                0
              );
              return (
                <Tooltip
                  content={`Total: ${total.toLocaleString()}`}
                  side="bottom"
                >
                  <button
                    onClick={() => copy(total.toString(), 'Total Balance')}
                    className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-earth-brown bg-white px-3 py-1.5 rounded-md border border-earth-cream shadow-sm active:scale-95 transition-transform"
                  >
                    <span>{tokenSymbol.toUpperCase()}</span>
                    <span className="text-earth-cream/80">|</span>
                    <span className="text-earth-sage font-bold font-mono">
                      <QtyDisplay qty={total} />
                    </span>
                  </button>
                </Tooltip>
              );
            })()}
          </div>

          {/* ========================================== */}
          {/* PART 1: DESKTOP VIEW (Table)              */}
          {/* แสดงเมื่อหน้าจอขนาด md ขึ้นไป (768px+)    */}
          {/* ========================================== */}
          <div className="hidden md:block max-h-[400px] overflow-auto custom-scrollbar  ">
            <table className="w-full text-left text-sm ">
              <thead className="bg-white sticky top-0 z-10 text-earth-stone text-xs font-bold uppercase tracking-wider  border-b border-earth-cream/50 shadow-sm">
                <tr>
                  <th className="px-5 py-3 w-[40%] text-left ">Wallet Name</th>
                  <th className="px-5 py-3 w-[35%] text-left ">Address</th>
                  <th className="px-5 py-3 w-[25%] text-right  ">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white ">
                {results.map((r) => (
                  <tr
                    key={r.address}
                    className="hover:bg-earth-cream/40 transition-colors group duration-300"
                  >
                    <td className="px-5 py-3 font-medium text-earth-darkbrown">
                      {r.label}
                    </td>
                    <td className="px-5 py-3">
                      <Tooltip content="Copy address" side="right">
                        <div
                          className="inline-flex items-center gap-2 group/addr cursor-pointer"
                          onClick={() => copy(r.address, 'Address')}
                        >
                          <span className="font-mono text-xs text-earth-stone/70 group-hover/addr:text-earth-sage transition-colors">
                            {r.address.slice(0, 6)}...{r.address.slice(-4)}
                          </span>
                          <div className="p-1 rounded-md text-earth-stone/50 group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all">
                            {copiedText === r.address ? (
                              <Check size={14} className="text-earth-sage" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    </td>
                    <td
                      className="px-5 py-3 text-right font-bold text-earth-sage font-mono cursor-pointer active:scale-95 active:text-earth-moss transition-all duration-300"
                      onClick={() => {
                        // ส่งค่า toString() ไปปกติ ส่วนเรื่องการแสดงผลแก้ที่ hook แล้ว
                        copy(r.formatted.toString(), 'Quantity');
                      }}
                    >
                      <Tooltip content="Copy balance" side="top">
                        {/* ต้องมี span หรือ div หุ้มข้างในเพื่อให้ Tooltip จับตำแหน่งได้ถูก */}
                        <span>
                          {Number(r.formatted).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </span>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================== */}
          {/* PART 2: MOBILE VIEW (Card List)           */}
          {/* แสดงเมื่อหน้าจอเล็กกว่า md                */}
          {/* ========================================== */}
          <div className="md:hidden p-4 space-y-3 bg-earth-cream/10 max-h-[500px] overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.address}
                className="bg-white p-4 rounded-xl border border-earth-cream/60 shadow-sm flex flex-col gap-3 transition-colors"
              >
                {/* Row 1: Label & Balance */}
                <div className="flex justify-between items-start">
                  <div className="font-bold text-earth-darkbrown text-sm  max-w-[70%]">
                    {r.label}
                  </div>
                  <div className="text-right max-w-[30%]">
                    <span
                      className="block text-earth-sage font-bold font-mono text-lg leading-none active:scale-95 active:text-earth-moss transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(r.formatted, 'Quantity');
                      }}
                    >
                      <QtyDisplay qty={Number(r.formatted)} />
                    </span>
                  </div>
                </div>

                {/* Row 2: Address Box (Copyable) */}
                <div
                  onClick={() => copy(r.address, 'Address')}
                  className="flex items-center justify-between bg-earth-cream/50 border border-earth-cream/40 rounded-lg px-3 py-2 cursor-pointer "
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-earth-stone/70" />
                    <span className="font-mono text-xs text-earth-stone/90">
                      {r.address.slice(0, 10)}...{r.address.slice(-6)}
                    </span>
                  </div>

                  <div className="text-earth-stone/70">
                    {copiedText === r.address ? (
                      <Check
                        size={14}
                        className="text-earth-sage animate-in zoom-in"
                      />
                    ) : (
                      <Copy size={14} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && hasScanned && results.length === 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/50 overflow-hidden shadow-sm">
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span>Found in {results.length} wallets</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-earth-cream/50 p-2 text-center shadow-sm animate-in fade-in zoom-in-95 duration-300 opacity-80">
            <div className="bg-earth-cream/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-earth-stone">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-earth-darkbrown font-bold text-lg">
              Not Found
            </h3>
            <p className="text-earth-stone text-sm mt-1 pb-1">
              No wallets found holding this token.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !hasScanned && (
        <div className="text-center py-2 md:py-10 opacity-80">
          <div className="bg-earth-cream/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-earth-stone">
            <Earth size={30} />
          </div>
          <p className="text-sm text-earth-stone">
            Ready to scan. Select a network and enter the token identifier.
          </p>
        </div>
      )}
    </div>
  );
}
