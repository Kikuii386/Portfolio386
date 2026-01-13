// components/EtcMultiWalletBalanceChecker.tsx

'use client';

import React, { useState } from 'react';
import QtyDisplay from '@/components/QtyDisplay';
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
  // ถ้า decimals เป็น 0 คือแสดงเต็ม
  return (balance / Math.pow(10, decimals)).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
}

// --- TRON ---
async function scanTronBalance(
  address: string,
  tokenAddress: string,
  rpcUrl: string
): Promise<string> {
  if (!address.startsWith('T')) return '0';
  try {
    const ownerHex = tronAddressToHex(address);
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

// Helper: ดึงข้อมูล Metadata ของ Rune เพื่อหาค่า Divisibility (Decimals)
async function getRuneInfo(runeName: string): Promise<number> {
  try {
    // ลบจุด/ช่องว่างออกก่อนค้นหา Metadata
    const clean = cleanName(runeName);
    const url = `https://api.ordiscan.com/v1/rune/${clean}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ORDISCAN_API_KEY}` },
    });
    if (!res.ok) return 0; // ถ้าไม่เจอ Default 0
    const data = await res.json();

    // Ordiscan response: { decimals: 18, ... }
    return typeof data.data?.decimals === 'number' ? data.data.decimals : 0;
  } catch (e) {
    return 0;
  }
}

// 1. Native BTC
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

// 2. BRC-20 Scanner
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

    // ✅ แก้จุดนี้: เช็คทั้ง 'tick' (Ordiscan) และ 'ticker' (Hiro)
    const foundToken = tokens.find(
      (t: any) => (t.tick || t.ticker || '').toLowerCase() === target
    );

    if (foundToken) {
      // แปลงยอดเงินเป็น String
      const rawBalance = (
        foundToken.overall_balance ||
        foundToken.balance ||
        foundToken.amount ||
        '0'
      ).toString();
      // ถ้า API มี decimals ให้ใช้ ถ้าไม่มีใช้ 18
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

// 3. RUNES Scanner
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
    // Support structure { data: [...] } as per your JSON
    const runes = Array.isArray(responseData)
      ? responseData
      : responseData.data || [];

    const target = cleanName(searchName);

    // Find rune by name
    const foundRune = runes.find(
      (r: any) => cleanName(r.name || r.rune || '') === target
    );

    if (foundRune) {
      // Return RAW balance here. Decimals will be handled by main dispatcher using Metadata.
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
// Helper: ดึงค่า Decimals ของเหรียญ TRC20
async function getTronDecimals(
  tokenAddress: string,
  rpcUrl: string
): Promise<number> {
  try {
    const contractHex = tronAddressToHex(tokenAddress);
    if (!contractHex) return 6; // Default fallback

    const endpoint = rpcUrl.endsWith('/')
      ? `${rpcUrl}wallet/triggerconstantcontract`
      : `${rpcUrl}/wallet/triggerconstantcontract`;

    const payload = {
      owner_address: contractHex, // ใช้ตัว Contract เป็นคนเรียก (View Function)
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
// 2. ดึง Symbol (ชื่อย่อเหรียญ) ✅
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
      // แปลง Hex เป็น String (กรองเฉพาะตัวอักษรที่อ่านออก)
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          // Printable ASCII
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

  let detectedSymbol = tokenIdentifier
    ? tokenIdentifier.toUpperCase()
    : 'TOKEN';

  let decimals = 6;
  if (networkKey === 'tron') decimals = 6;
  if (networkKey === 'aptos' || networkKey === 'sui') decimals = 8;
  if (networkKey === 'btc') decimals = 8;

  if (networkKey === 'tron' && tokenIdentifier) {
    // เรียก 2 ฟังก์ชันพร้อมกัน
    const [sym, trcDecimals] = await Promise.all([
      getTronSymbol(tokenIdentifier, network.rpc),
      getTronDecimals(tokenIdentifier, network.rpc),
    ]);

    // ถ้าได้ชื่อมา ให้อัปเดต detectedSymbol
    if (sym) detectedSymbol = sym;

    // ถ้าได้ทศนิยมมา ให้อัปเดต decimals
    if (trcDecimals > 0) decimals = trcDecimals;
  }
  // --- PRE-FETCH METADATA FOR BTC TOKENS ---
  // ถ้าเป็น BTC และมีการระบุชื่อเหรียญ ให้ไปดึงข้อมูลเหรียญมาก่อนเพื่อหา Divisibility
  if (networkKey === 'btc' && tokenIdentifier) {
    const metaDecimals = await getRuneInfo(tokenIdentifier);
    // ถ้าได้ค่ามามากกว่า 0 ให้ใช้ค่านี้เป็น Default สำหรับ Runes
    // (BRC-20 จะมี logic decimals ในตัวมันเองอีกที)
    decimals = metaDecimals;
  }

  const concurrency = 5;
  const chunks: Wallet[][] = [];
  for (let i = 0; i < wallets.length; i += concurrency)
    chunks.push(wallets.slice(i, i + concurrency));

  if (
    (networkKey === 'sui' || networkKey === 'aptos') &&
    tokenIdentifier.includes('::')
  ) {
    const parts = tokenIdentifier.split('::');
    detectedSymbol = parts[parts.length - 1].toUpperCase();
  }

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
              tokenIdentifier,
              network.rpc
            );
          } else if (networkKey === 'aptos') {
            raw = await scanAptosBalance(
              w.address,
              tokenIdentifier,
              network.rpc
            );
          } else if (networkKey === 'sui') {
            raw = await scanSuiBalance(w.address, tokenIdentifier, network.rpc);
          } else if (networkKey === 'btc') {
            if (!tokenIdentifier) {
              raw = await scanBtcNativeBalance(w.address);
              currentDecimals = 8;
              type = 'NATIVE';
            } else {
              // Check both Runes and BRC-20
              const [runeRes, brcRes] = await Promise.all([
                scanRunesBalance(w.address, tokenIdentifier),
                scanBrc20Balance(w.address, tokenIdentifier),
              ]);

              const runeVal = parseFloat(runeRes.balance.replace(/,/g, ''));
              const brcVal = parseFloat(brcRes.balance.replace(/,/g, ''));

              if (runeVal > 0) {
                raw = runeRes.balance;
                // ใช้ decimals ที่ดึงมาจาก getRuneInfo ด้านบน (Pre-fetch)
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

  if (networkKey === 'btc' && !tokenIdentifier) detectedSymbol = 'BTC';

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
        // USDT บน Tron
        return 'e.g. TR7NH... (USDT Contract)';
      case 'aptos':
        // Aptos Coin Struct มาตรฐาน
        return 'e.g. 0x1::aptos_coin::AptosCoin';
      case 'sui':
        // SUI Coin Struct มาตรฐาน
        return 'e.g. 0x2::sui::SUI';
      case 'btc':
        // เหรียญยอดฮิตของ BRC-20/Runes
        return 'e.g. ORDI, SATS or leave empty for BTC';
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
      if (selectedChain !== 'btc' && !tokenInput)
        throw new Error('Please enter token identifier');

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
    setTokenInput(''); // ล้างช่องกรอก
    setResults([]); // ล้างผลลัพธ์
    setHasScanned(false); // รีเซ็ตสถานะเป็น Ready
    setDisplaySymbol(''); // ล้างชื่อเหรียญ
    setError(null); // ล้าง Error
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Chain Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
            Select Network
          </label>
          <div className="relative group z-10">
            <DropdownSelect
              // 1. แปลงรายการ NETWORKS ให้เป็น Group Format
              options={[
                {
                  label: 'Networks',
                  items: Object.keys(NETWORKS),
                },
              ]}
              // 2. ค่าที่เลือกปัจจุบัน
              selected={selectedChain}
              // 3. เมื่อเลือกให้ทำอะไร (Set State + Reset ค่าต่างๆ)
              onSelect={(val) => {
                setSelectedChain(val as EtcNetworkKey);
                setResults([]);
                setTokenInput('');
                setHasScanned(false);
              }}
              // 4. ฟังก์ชันแสดงชื่อสวยๆ (ดึงจาก config.name เช่น "Bitcoin (BTC)")
              getLabel={(key) => NETWORKS[key as EtcNetworkKey]?.name || key}
              // 5. ปรับสไตล์ปุ่มให้เหมือน Input (สูง 50px, สี earth-cream)
              buttonClass=" h-[50px] w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown font-medium justify-between px-4 hover:bg-earth-cream/30 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage"
            />
          </div>
        </div>

        {/* Token Input */}
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
            {tokenInput && (
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

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <div className="bg-white rounded-xl border border-earth-cream/80 overflow-hidden shadow-sm">
          <div className="bg-earth-cream/50 px-5 py-3 border-b border-earth-cream/40 flex justify-between items-center">
            <div className="flex items-center gap-2 text-earth-brown font-bold">
              <CheckCircle2 size={18} className="text-earth-sage" />
              <span>Found in {results.length} wallets</span>
            </div>
            <div>
              {/* คำนวณยอดรวมเตรียมไว้ก่อน */}
              {(() => {
                const total = results.reduce(
                  (sum, r) => sum + Number(r.formatted.replace(/,/g, '')),
                  0
                );

                return (
                  <Tooltip
                    content={`Total Balance: ${total.toLocaleString()}`}
                    side="bottom"
                  >
                    <span
                      className="flex items-center gap-2 text-sm font-semibold font-roboto text-earth-brown bg-white px-3 py-1.5 rounded-md border border-earth-cream shadow-sm "
                      onClick={() => copy(total.toString(), 'Total Balance')}
                    >
                      {/* ชื่อเหรียญ */}

                      <span>
                        {displaySymbol || 'TOKEN'.toLocaleUpperCase()}
                      </span>

                      {/* ขีดคั่น (Optional: ใส่เพื่อให้ดูแยกส่วนชัดเจน) */}
                      <span className="hidden sm:block text-earth-cream/80">
                        |
                      </span>

                      {/* ยอดรวม (ใช้ QtyDisplay ย่อเลข K, M, B ได้เลย) */}

                      <span className="hidden sm:block text-earth-sage font-bold font-mono hover:text-earth-darkbrown cursor-pointer transition-all duration-300">
                        <QtyDisplay qty={total} />
                      </span>
                    </span>
                  </Tooltip>
                );
              })()}
            </div>
          </div>

          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 border-b border-earth-cream/30 text-earth-stone text-xs font-bold uppercase tracking-wider">
                <tr>
                  {/* 1. Wallet Name: มือถือเอาไป 65%, จอใหญ่เอา 40% */}
                  <th className="px-5 py-3 w-[65%] sm:w-[40%] text-left truncate">
                    Wallet Name
                  </th>

                  {/* 2. Address: มือถือซ่อน, จอใหญ่เอา 35% */}
                  <th className="px-5 py-3 w-[35%] hidden sm:table-cell text-left">
                    Address
                  </th>

                  {/* 3. Balance: มือถือเอา 35%, จอใหญ่เอา 25% */}
                  <th className="px-5 py-3 w-[35%] sm:w-[25%] text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-cream/30">
                {results.map((r) => (
                  <tr
                    key={r.address}
                    className="hover:bg-earth-cream/10 transition-colors group"
                  >
                    <td className="px-5 py-3 font-medium text-earth-darkbrown">
                      <div className="flex items-center gap-2">
                        {/* ชื่อ Wallet */}
                        <span>{r.label}</span>

                        {/* ✅ ปุ่ม Copy: แสดงเฉพาะมือถือ (sm:hidden) และซ่อนใน Desktop */}
                        <button
                          onClick={() => copy(r.address, 'Address')}
                          className="sm:hidden p-1 rounded-md text-earth-stone/50 group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all duration-200"
                        >
                          {copiedText === r.address ? (
                            <Check
                              size={14}
                              className="text-earth-sage animate-in zoom-in"
                            />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3 hidden sm:table-cell">
                      {/* 1. ตั้งชื่อ group ว่า 'addr' เพื่อไม่ให้ตีกับ group ของ tr */}

                      <Tooltip content="Copy address" side="right">
                        <div
                          className="inline-flex items-center gap-2 group/addr cursor-pointer align-middle"
                          onClick={() => copy(r.address, 'Address')}
                        >
                          {/* 2. เปลี่ยน group-hover เป็น group-hover/addr */}
                          <span className="font-mono text-xs text-earth-stone/70 group-hover/addr:text-earth-sage group-hover/addr:opacity-100 transition-all duration-200">
                            {r.address.slice(0, 6)}...{r.address.slice(-4)}
                          </span>

                          {/* 3. เปลี่ยน group-hover เป็น group-hover/addr */}
                          <div className="p-1 rounded-md text-earth-stone/50 group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all duration-200">
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
                      </Tooltip>
                    </td>

                    <td className="px-5 py-3 text-right font-bold text-earth-sage font-mono">
                      {/* 📱 Mobile View: ใช้ QtyDisplay (ย่อ 1.2M, 10K) */}
                      <span className="sm:hidden">
                        <QtyDisplay
                          qty={Number(r.formatted.replace(/,/g, ''))}
                        />
                      </span>

                      {/* 💻 Desktop View: แสดงตัวเลขเต็มพร้อมทศนิยม 4 ตำแหน่ง */}
                      <span className="hidden sm:inline">
                        {Number(r.formatted.replace(/,/g, '')).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          }
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
