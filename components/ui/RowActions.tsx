import React from 'react';

const GOOGLE_SHEET_ID = '154YVMJYcJ8_5q_hNknll3XwVwIGvNst4G13ACYpywdY';

const CHAIN_MAP: Record<string, string> = {
  ETH: 'ethereum',
  BNB: 'bsc',
  BSC: 'bsc',
  SOL: 'solana',
  ARB: 'arbitrum',
  OP: 'optimism',
  BASE: 'base',
  MATIC: 'polygon',
  POL: 'polygon',
  AVAX: 'avalanche',
  FTM: 'fantom',
  // เพิ่ม chain อื่นๆ ได้ที่นี่
};

export const getGraphLink = (token: any): string => {
  if (!token || !token.chain || !token.contract) return '#';

  // แปลงชื่อ Chain
  const chainSlug =
    CHAIN_MAP[token.chain.toUpperCase()] || token.chain.toLowerCase();

  return `https://dexscreener.com/${chainSlug}/${token.contract}`;
};

/**
 * สร้าง Link ไปยัง Google Sheet
 */
export const getGoogleSheetLink = (): string => {
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;
};
