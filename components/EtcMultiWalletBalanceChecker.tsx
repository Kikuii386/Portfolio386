'use client';

import React, { useState } from 'react';
import QtyDisplay, { formatQtyString } from '@/components/QtyDisplay';
import DropdownSelect from '@/components/ui/DropdownSelect';
import { useCopyToClipboard } from '@/hook/useCopyToClipboard';
import Tooltip from '@/components/ui/Tooltips';
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
} from 'lucide-react';

/* ----------------------------- ETC Network Config ----------------------------- */

type EtcNetworkKey = 'tron' | 'aptos' | 'sui' | 'btc';

interface NetworkConfig {
  name: string;
  rpc: string;
  symbol: string;
}

const NETWORKS: Record<EtcNetworkKey, NetworkConfig> = {
  tron: {
    name: 'Tron (TRX)',
    rpc: 'https://tron-mainnet.g.alchemy.com/v2/xGT7Yqz9EMwjE8yF4pSjiO3CDG9925hj',
    symbol: 'TRX',
  },
  aptos: {
    name: 'Aptos (APT)',
    rpc: 'https://fullnode.mainnet.aptoslabs.com/v1',
    symbol: 'APT',
  },
  sui: {
    name: 'Sui (SUI)',
    rpc: 'https://fullnode.mainnet.sui.io',
    symbol: 'SUI',
  },
  btc: {
    name: 'Bitcoin (BTC)',
    rpc: 'https://api.ordiscan.com',
    symbol: 'BTC',
  },
};

const ORDISCAN_API_KEY = 'b028c743-b2b3-4861-9fff-f6955a04cf58';

/* --------------------------------- Types --------------------------------- */

interface Wallet {
  id: number | string;
  label: string;
  address: string;
}

interface WalletBalanceResult {
  label: string;
  address: string;
  rawBalance: string;
  formatted: string;
  type?: 'NATIVE' | 'BRC20' | 'RUNE';
}

interface ScanResult {
  results: WalletBalanceResult[];
  tokenSymbol: string;
}

/* ------------------------- Helpers ------------------------- */
const TRON_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);
  const bytes = [0];
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const value = TRON_ALPHABET.indexOf(char);
    if (value === -1) throw new Error('Invalid Base58 character');
    for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
    bytes[0] += value;
    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  return new Uint8Array(bytes.reverse());
}

function tronAddressToHex(base58: string): string {
  try {
    const decoded = decodeBase58(base58);
    const raw = decoded.slice(0, 21);
    return Array.from(raw)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return '';
  }
}

function cleanName(name: string): string {
  return name.replace(/[•. ]/g, '').toUpperCase();
}

/* ------------------------- Validators ------------------------- */

function isCompatibleAddress(address: string, chain: EtcNetworkKey): boolean {
  if (!address) return false;
  if (chain === 'tron') return address.startsWith('T') && address.length === 34;
  if (chain === 'aptos' || chain === 'sui')
    return address.startsWith('0x') && address.length >= 60;
  if (chain === 'btc')
    return (
      /^(1|3|bc1)/.test(address) && address.length >= 26 && address.length <= 62
    );
  return false;
}

/* ------------------------- Scan Logic ------------------------- */

function formatBalance(amount: string | number, decimals: number): string {
  const balance = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(balance)) return '0';
  return (balance / Math.pow(10, decimals)).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
}

// --- TRON ---
async function scanTronBalance(
  address: string,
  tokenAddress: string, // ถ้าว่าง = Native
  rpcUrl: string
): Promise<string> {
  if (!address.startsWith('T')) return '0';
  try {
    const ownerHex = tronAddressToHex(address);

    // ✅ กรณีที่ 1: Native TRX
    if (!tokenAddress) {
      const endpoint = rpcUrl.endsWith('/')
        ? `${rpcUrl}wallet/getaccount`
        : `${rpcUrl}/wallet/getaccount`;

      const payload = {
        address: ownerHex,
        visible: false,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data.balance ? data.balance.toString() : '0';
    }

    // ✅ กรณีที่ 2: TRC-20
    const contractHex = tronAddressToHex(tokenAddress);
    const paramAddress = ownerHex.padStart(64, '0');
    const endpoint = rpcUrl.endsWith('/')
      ? `${rpcUrl}wallet/triggerconstantcontract`
      : `${rpcUrl}/wallet/triggerconstantcontract`;

    const payload = {
      owner_address: ownerHex,
      contract_address: contractHex,
      function_selector: 'balanceOf(address)',
      parameter: paramAddress,
      visible: false,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.constant_result && data.constant_result[0]) {
      const hexVal = data.constant_result[0];
      return BigInt('0x' + hexVal).toString();
    }
    return '0';
  } catch (e) {
    return '0';
  }
}

// --- APTOS ---
async function scanAptosBalance(
  address: string,
  tokenType: string,
  nodeUrl: string
): Promise<string> {
  try {
    const url = `${nodeUrl}/accounts/${address}/resource/0x1::coin::CoinStore<${tokenType}>`;
    const res = await fetch(url);
    if (res.status === 404) return '0';
    const data = await res.json();
    return data?.data?.coin?.value || '0';
  } catch (e) {
    return '0';
  }
}

// --- SUI ---
async function scanSuiBalance(
  address: string,
  coinType: string,
  nodeUrl: string
): Promise<string> {
  try {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getBalance',
      params: [address, coinType],
    });
    const res = await fetch(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();
    if (data.error) return '0';
    return data?.result?.totalBalance || '0';
  } catch (e) {
    return '0';
  }
}

/* ================== BITCOIN SCANNERS (ORDISCAN) ================== */

async function getRuneInfo(runeName: string): Promise<number> {
  try {
    const clean = cleanName(runeName);
    const url = `https://api.ordiscan.com/v1/rune/${clean}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ORDISCAN_API_KEY}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.data?.decimals === 'number' ? data.data.decimals : 0;
  } catch (e) {
    return 0;
  }
}

async function scanBtcNativeBalance(address: string): Promise<string> {
  try {
    const res = await fetch(`https://mempool.space/api/address/${address}`);
    if (!res.ok) return '0';
    const data = await res.json();
    const chainStats = data.chain_stats;
    const mempoolStats = data.mempool_stats;
    const totalSats =
      chainStats.funded_txo_sum -
      chainStats.spent_txo_sum +
      (mempoolStats.funded_txo_sum - mempoolStats.spent_txo_sum);
    return totalSats > 0 ? totalSats.toString() : '0';
  } catch (e) {
    return '0';
  }
}

async function scanBrc20Balance(
  address: string,
  ticker: string
): Promise<{ balance: string; decimals: number }> {
  try {
    const url = `https://api.ordiscan.com/v1/address/${address}/brc20`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ORDISCAN_API_KEY}` },
    });
    if (!res.ok) return { balance: '0', decimals: 18 };

    const responseData = await res.json();
    const tokens = Array.isArray(responseData)
      ? responseData
      : responseData.data || [];
    const target = ticker.toLowerCase();

    const foundToken = tokens.find(
      (t: any) => (t.tick || t.ticker || '').toLowerCase() === target
    );

    if (foundToken) {
      const rawBalance = (
        foundToken.overall_balance ||
        foundToken.balance ||
        foundToken.amount ||
        '0'
      ).toString();
      const decimals =
        foundToken.decimals !== undefined ? Number(foundToken.decimals) : 0;

      return {
        balance: rawBalance,
        decimals: decimals,
      };
    }
    return { balance: '0', decimals: 0 };
  } catch (e) {
    return { balance: '0', decimals: 0 };
  }
}

async function scanRunesBalance(
  address: string,
  searchName: string
): Promise<{ balance: string; name: string }> {
  try {
    const url = `https://api.ordiscan.com/v1/address/${address}/runes`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ORDISCAN_API_KEY}` },
    });

    if (!res.ok) return { balance: '0', name: '' };

    const responseData = await res.json();
    const runes = Array.isArray(responseData)
      ? responseData
      : responseData.data || [];

    const target = cleanName(searchName);

    const foundRune = runes.find(
      (r: any) => cleanName(r.name || r.rune || '') === target
    );

    if (foundRune) {
      return {
        balance: foundRune.balance || foundRune.amount || '0',
        name: foundRune.name || foundRune.rune,
      };
    }

    return { balance: '0', name: '' };
  } catch (e) {
    return { balance: '0', name: '' };
  }
}

async function getTronDecimals(
  tokenAddress: string,
  rpcUrl: string
): Promise<number> {
  try {
    const contractHex = tronAddressToHex(tokenAddress);
    if (!contractHex) return 6;

    const endpoint = rpcUrl.endsWith('/')
      ? `${rpcUrl}wallet/triggerconstantcontract`
      : `${rpcUrl}/wallet/triggerconstantcontract`;

    const payload = {
      owner_address: contractHex,
      contract_address: contractHex,
      function_selector: 'decimals()',
      parameter: '',
      visible: false,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.constant_result && data.constant_result[0]) {
      return parseInt(data.constant_result[0], 16);
    }
    return 6;
  } catch (e) {
    return 6;
  }
}

async function getTronSymbol(
  tokenAddress: string,
  rpcUrl: string
): Promise<string> {
  try {
    const contractHex = tronAddressToHex(tokenAddress);
    if (!contractHex) return '';

    const endpoint = rpcUrl.endsWith('/')
      ? `${rpcUrl}wallet/triggerconstantcontract`
      : `${rpcUrl}/wallet/triggerconstantcontract`;
    const payload = {
      owner_address: contractHex,
      contract_address: contractHex,
      function_selector: 'symbol()',
      parameter: '',
      visible: false,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.constant_result && data.constant_result[0]) {
      const hex = data.constant_result[0];
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          str += String.fromCharCode(charCode);
        }
      }
      return str.trim();
    }
    return '';
  } catch (e) {
    return '';
  }
}

// --- Main Dispatcher ---
async function scanEtcTokenBalances(
  wallets: Wallet[],
  tokenIdentifier: string,
  networkKey: EtcNetworkKey
): Promise<ScanResult> {
  const resultsAcc: WalletBalanceResult[] = [];
  const network = NETWORKS[networkKey];

  // ✅ 1. เตรียมตัวแปรสำหรับ Native/Token Logic
  let targetToken = tokenIdentifier.trim();
  let isNative = !targetToken; // ถ้าว่างถือว่า Native

  let detectedSymbol = 'TOKEN';
  let decimals = 0;

  // ✅ 2. ตั้งค่า Default สำหรับแต่ละ Chain (Native)
  if (networkKey === 'tron') {
    decimals = 6;
    if (isNative) detectedSymbol = 'TRX';
  } else if (networkKey === 'aptos') {
    decimals = 8;
    if (isNative) {
      targetToken = '0x1::aptos_coin::AptosCoin'; // ID ของ Native APT
      detectedSymbol = 'APT';
    }
  } else if (networkKey === 'sui') {
    decimals = 9;
    if (isNative) {
      targetToken = '0x2::sui::SUI'; // ID ของ Native SUI
      detectedSymbol = 'SUI';
    }
  } else if (networkKey === 'btc') {
    decimals = 8;
    if (isNative) detectedSymbol = 'BTC';
  }

  // ถ้า User กรอก Token มา ให้ไปหา Symbol จริงๆ (ยกเว้น Aptos/Sui ที่ใช้ Struct ID เลย)
  if (!isNative) {
    // 1. ค่าเริ่มต้น: เอาสิ่งที่กรอกมาเป็นชื่อไปก่อน
    detectedSymbol = targetToken.toUpperCase();

    // 2. 🟢 Tron: วิ่งไปถามชื่อจริงจาก Contract
    if (networkKey === 'tron') {
      const [sym, trcDecimals] = await Promise.all([
        getTronSymbol(targetToken, network.rpc),
        getTronDecimals(targetToken, network.rpc),
      ]);
      if (sym) detectedSymbol = sym; // ถ้าเจอชื่อจริง ให้ทับเลย
      if (trcDecimals > 0) decimals = trcDecimals;
    }

    // 3. 🟠 Bitcoin: หา Decimals ของ Runes (ส่วนชื่อใช้ที่กรอกมาถูกแล้ว)
    if (networkKey === 'btc') {
      const metaDecimals = await getRuneInfo(targetToken);
      decimals = metaDecimals;
    }

    // 4. 🔵 Aptos / Sui: ตัดชื่อออกจาก Struct ID ยาวๆ
    // เช่น "0x...::coin::USDT" -> ตัดเอาแค่ "USDT"
    if (
      (networkKey === 'aptos' || networkKey === 'sui') &&
      targetToken.includes('::')
    ) {
      const parts = targetToken.split('::');
      detectedSymbol = parts[parts.length - 1].toUpperCase();
    }
  }

  // ... ส่วน Concurrency แยกตาม Chain (แก้ให้ส่ง targetToken เข้าไป)
  if (
    (networkKey === 'sui' || networkKey === 'aptos') &&
    targetToken.includes('::')
  ) {
    const parts = targetToken.split('::');
    detectedSymbol = parts[parts.length - 1].toUpperCase();
  }

  const concurrency = 5;
  const chunks: Wallet[][] = [];
  for (let i = 0; i < wallets.length; i += concurrency)
    chunks.push(wallets.slice(i, i + concurrency));

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (w) => {
        if (!isCompatibleAddress(w.address, networkKey)) return;

        let raw = '0';
        let currentDecimals = decimals;
        let type: 'NATIVE' | 'BRC20' | 'RUNE' | undefined = undefined;

        try {
          if (networkKey === 'tron') {
            raw = await scanTronBalance(
              w.address,
              // ถ้า Native (isNative=true), targetToken จะว่างเปล่าอยู่แล้ว ซึ่งถูกต้อง
              // ถ้า Token, targetToken จะมีค่า
              isNative ? '' : targetToken,
              network.rpc
            );
          } else if (networkKey === 'aptos') {
            raw = await scanAptosBalance(
              w.address,
              targetToken, // ใช้ ID ที่เตรียมไว้ (Native หรือ Custom)
              network.rpc
            );
          } else if (networkKey === 'sui') {
            raw = await scanSuiBalance(
              w.address,
              targetToken, // ใช้ ID ที่เตรียมไว้
              network.rpc
            );
          } else if (networkKey === 'btc') {
            if (isNative) {
              raw = await scanBtcNativeBalance(w.address);
              currentDecimals = 8;
              type = 'NATIVE';
            } else {
              const [runeRes, brcRes] = await Promise.all([
                scanRunesBalance(w.address, targetToken),
                scanBrc20Balance(w.address, targetToken),
              ]);

              const runeVal = parseFloat(runeRes.balance.replace(/,/g, ''));
              const brcVal = parseFloat(brcRes.balance.replace(/,/g, ''));

              if (runeVal > 0) {
                raw = runeRes.balance;
                currentDecimals = decimals;
                type = 'RUNE';
                detectedSymbol = runeRes.name;
              } else if (brcVal > 0) {
                raw = brcRes.balance;
                currentDecimals = brcRes.decimals;
                type = 'BRC20';
              }
            }
          }

          const numericRaw = parseFloat(raw.toString().replace(/,/g, ''));

          if (raw && raw !== '0' && numericRaw > 0) {
            resultsAcc.push({
              label: w.label,
              address: w.address,
              rawBalance: raw,
              formatted: formatBalance(numericRaw, currentDecimals),
              type: type,
            });
          }
        } catch (err) {}
      })
    );
  }

  if (isNative && networkKey !== 'tron') {
    // Tron มี logic symbol แยกด้านบนแล้ว
  }

  resultsAcc.sort(
    (a, b) =>
      parseFloat(b.formatted.replace(/,/g, '')) -
      parseFloat(a.formatted.replace(/,/g, ''))
  );
  return { results: resultsAcc, tokenSymbol: detectedSymbol };
}

/* --------------------------- Component -------------------------- */

export default function EtcMultiWalletBalanceChecker() {
  const [selectedChain, setSelectedChain] = useState<EtcNetworkKey>('btc');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WalletBalanceResult[]>([]);
  const { copiedText, copy } = useCopyToClipboard();
  const [displaySymbol, setDisplaySymbol] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);

  const getInputPlaceholder = () => {
    switch (selectedChain) {
      case 'tron':
        return 'e.g. TR7NH... (USDT) or empty for TRX';
      case 'aptos':
        return 'e.g. 0x1::... (Coin) or empty for APT';
      case 'sui':
        return 'e.g. 0x2::... (Coin) or empty for SUI';
      case 'btc':
        return 'e.g. ORDI, SATS or empty for BTC';
      default:
        return 'Token Identifier';
    }
  };

  const handleScan = async () => {
    setError(null);
    setResults([]);
    setLoading(true);
    setHasScanned(false);

    try {
      // ✅ อนุญาตให้ช่องว่างผ่านได้ (ถือว่าเป็น Native Scan)
      // if (selectedChain !== 'btc' && !tokenInput) throw ... (ลบทิ้ง)

      const res = await fetch(`/api/wallets?type=etc`);
      if (!res.ok) throw new Error('Failed to load wallets');

      const data = (await res.json()) as { wallets: Wallet[] };
      let allWallets = data.wallets || [];

      if (allWallets.length === 0)
        throw new Error('No wallets found in ETC group');

      const scanResult = await scanEtcTokenBalances(
        allWallets,
        tokenInput.trim(),
        selectedChain
      );
      setResults(scanResult.results);
      setDisplaySymbol(scanResult.tokenSymbol);
      setHasScanned(true);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTokenInput('');
    setResults([]);
    setHasScanned(false);
    setDisplaySymbol('');
    setError(null);
  };

  const handleOpenExplorer = (address: string) => {
    let url = '';
    switch (selectedChain) {
      case 'tron':
        url = `https://tronscan.org/#/address/${address}`;
        break;
      case 'aptos':
        url = `https://explorer.aptoslabs.com/account/${address}`;
        break;
      case 'sui':
        url = `https://suiscan.xyz/mainnet/account/${address}`;
        break;
      case 'btc':
        url = `https://mempool.space/address/${address}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
            Select Network
          </label>
          <div className="relative group z-10">
            <DropdownSelect
              options={[
                {
                  label: 'Networks',
                  items: Object.keys(NETWORKS),
                },
              ]}
              selected={selectedChain}
              onSelect={(val) => {
                setSelectedChain(val as EtcNetworkKey);
                setResults([]);
                setTokenInput('');
                setHasScanned(false);
              }}
              getLabel={(key) => NETWORKS[key as EtcNetworkKey]?.name || key}
              buttonClass=" h-[50px] w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown font-medium justify-between px-4 hover:bg-earth-cream/30 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage"
            />
          </div>
        </div>

        <div className="md:col-span-8 space-y-1.5">
          <label className="h-[50px] text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
            Token Address / Symbol
          </label>
          <div className="relative w-full group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone/80 group-focus-within:text-earth-sage transition-colors">
              <Terminal size={18} />
            </div>
            <input
              type="text"
              placeholder={getInputPlaceholder()}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="pl-10 pr-10 py-3.5 w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown placeholder-earth-stone/80 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all font-mono text-sm hover:bg-earth-cream/30"
            />
            {/* ✅ ปุ่ม Clear Logic แบบ EVM */}
            {(tokenInput || hasScanned) && (
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
        {selectedChain === 'btc'
          ? '* Tip: Enter Token Name for Bitcoin (e.g. ORDI), or Contract Address for others.'
          : '* System automatically detects compatible wallets for selected chain.'}
      </div>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full  h-[50px] py-3.5 bg-earth-sage text-white font-semibold rounded-xl hover:bg-earth-olive hover:shadow-lg hover:shadow-earth-sage/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Search size={20} />
        )}
        <span>{loading ? 'Scanning...' : 'Scan Balances'}</span>
      </button>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50/50 text-red-600 text-sm rounded-xl border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/80 overflow-hidden shadow-sm">
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span>Found in {results.length} wallets</span>
            </div>
            <div>
              {/* ✅ Header Total Balance + Tooltip แบบ EVM */}
              {(() => {
                const total = results.reduce(
                  (sum, r) => sum + Number(r.formatted.replace(/,/g, '')),
                  0
                );

                return (
                  <Tooltip
                    content={`Total: ${formatQtyString(total)}`}
                    side="bottom"
                  >
                    <button
                      onClick={() => copy(total.toString(), 'Total Balance')}
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-earth-brown bg-white px-3 py-1.5 rounded-md border border-earth-cream shadow-sm active:scale-95 transition-transform"
                    >
                      <span className="hidden sm:inline">
                        {displaySymbol || 'TOKEN'.toLocaleUpperCase()}
                      </span>
                      <span className="hidden sm:block text-earth-cream/80">
                        |
                      </span>
                      <span className="hidden sm:block text-earth-sage font-bold font-mono">
                        <QtyDisplay qty={total} />
                      </span>
                    </button>
                  </Tooltip>
                );
              })()}
            </div>
          </div>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden md:block max-h-[400px] overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 border-b border-earth-cream/50 shadow-sm text-earth-stone text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 w-[40%] text-left">Wallet Name</th>
                  <th className="px-5 py-3 w-[35%] text-left">Address</th>
                  <th className="px-5 py-3 w-[25%] text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white">
                {results.map((r) => (
                  <tr
                    key={r.address}
                    className="hover:bg-earth-cream/40 transition-colors group duration-300"
                  >
                    {/* ✅ Clickable Wallet Name -> ตาม Chain */}
                    <td className="px-5 py-4">
                      <Tooltip content="Open Explorer" side="top">
                        <div
                          className="inline-flex items-center cursor-pointer group/label"
                          onClick={() => handleOpenExplorer(r.address)}
                        >
                          <span className="font-medium text-earth-darkbrown group-hover/label:text-earth-sage group-hover/label:underline transition-all duration-300">
                            {r.label}
                          </span>
                        </div>
                      </Tooltip>
                    </td>

                    <td className="px-5 py-4">
                      <Tooltip content="Copy address" side="top">
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

                    {/* ✅ Balance Column with QtyDisplay */}
                    <td
                      className="flex justify-end px-5 py-4 text-right font-bold text-earth-sage font-mono cursor-pointer active:scale-95 active:text-earth-moss transition-all duration-300"
                      onClick={() => {
                        copy(r.formatted.toString(), 'Quantity');
                      }}
                    >
                      <Tooltip
                        content={Number(
                          r.formatted.replace(/,/g, '')
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 8,
                        })}
                        side="top"
                      >
                        <span>
                          <QtyDisplay
                            qty={Number(r.formatted.replace(/,/g, ''))}
                          />
                        </span>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE LIST ================= */}
          <div className="md:hidden p-4 space-y-3 bg-earth-cream/10 max-h-[500px] overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.address}
                className="bg-white p-4 rounded-xl border border-earth-cream/60 shadow-sm flex flex-col gap-3 transition-colors"
              >
                <div className="flex justify-between items-start">
                  {/* ✅ Clickable Label */}
                  <div
                    className="font-semibold text-earth-darkbrown/70 text-sm max-w-[70%] active:text-earth-darkbrown active:scale-95 transition-all duration-300"
                    onClick={() => handleOpenExplorer(r.address)}
                  >
                    {r.label}
                  </div>
                  <div className="text-right max-w-[30%]">
                    {/* ✅ QtyDisplay */}
                    <span
                      className="p-1 block text-earth-sage font-bold font-mono text-sm leading-none active:scale-95 active:text-earth-moss transition-all duration-300"
                      onClick={() => {
                        copy(r.formatted.toString(), 'Quantity');
                      }}
                    >
                      <QtyDisplay qty={Number(r.formatted.replace(/,/g, ''))} />
                    </span>
                    <span className="text-[10px] text-earth-stone font-bold uppercase truncate">
                      {displaySymbol}
                    </span>
                  </div>
                </div>

                {/* Row 2: Address Box (Copyable) */}
                <div
                  onClick={() => copy(r.address, 'Address')}
                  className="flex items-center justify-between bg-earth-cream/50 border border-earth-cream/40 rounded-lg px-3 py-2 cursor-pointer active:bg-earth-cream/40"
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
