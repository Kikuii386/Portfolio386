import React from 'react';

const GOOGLE_SHEET_ID = '1FaW6yYtGRjDzLvD0igoM6KPaYqw9gl9dBBl_y_nUIgc';

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

/**
 * สร้าง Link ไปยัง Google Sheet
 */
export const getGoogleSheetLink = (specificLink?: string): string => {
  // 1. ถ้ามีลิงก์เฉพาะเจาะจงส่งมา (และไม่ใช่ข้อความว่าง) ให้ใช้ลิงก์นั้น
  if (specificLink && specificLink.trim() !== '') {
    return specificLink;
  }

  // 2. ถ้าไม่มี ให้ใช้ลิงก์ Default เดิม (Main Sheet)
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;
};