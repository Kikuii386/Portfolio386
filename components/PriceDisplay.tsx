import React from 'react';
// 1. อย่าลืม Import QtyDisplay เข้ามา (ตรวจสอบ path ให้ถูกต้อง)
import QtyDisplay from './QtyDisplay';

const PriceDisplay = ({ price }) => {


  // 2. เพิ่ม Logic: ถ้าราคาเกิน 1,000 ให้ใช้ QtyDisplay ย่อเลข (K, M, B)
  if (price >= 10000) {
    return (
      <div className="BasePopover_base__T5yOf popover-base">
        <span className="PriceDisplay_sub__WDANn">
          {/* ส่ง price เข้าไป และใส่ prefix $ */}
          <QtyDisplay qty={price} prefix="$" />
        </span>
      </div>
    );
  }

  // --- ตั้งแต่ตรงนี้ลงไปคือ Logic เดิมสำหรับเหรียญเล็ก ---

  // 2. กรณีราคาปกติ (0.01 ถึง 9,999)
  if (price >= 0.01) {
    let formattedPrice;
    if (price >= 1) {
      // เกิน $1 ให้มีทศนิยม 2 ตำแหน่งเสมอ
      formattedPrice = price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      // ต่ำกว่า $1 ให้มีทศนิยม 4 ตำแหน่งเสมอ (เช่น 0.5432)
      formattedPrice = price.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      });
    }

    return (
      <div className="BasePopover_base__T5yOf popover-base">
        <span className="PriceDisplay_sub__WDANn">${formattedPrice}</span>
      </div>
    );
  }

  let priceStr = price.toFixed(100);

  const parts = priceStr.split('.');
  const decimals = parts[1] || "";

  const firstNonZeroIndex = decimals.search(/[^0]/);

  if (firstNonZeroIndex === -1) {
    return (
      <div className="BasePopover_base__T5yOf popover-base">
        <span className="PriceDisplay_sub__WDANn">$0.00</span>
      </div>
    );
  }

  const subNumber = firstNonZeroIndex;
  const restDigits = decimals.slice(firstNonZeroIndex);
  const visibleDigits = restDigits.slice(0, 4);

  return (
    <div className="BasePopover_base__T5yOf popover-base">
      <span className="PriceDisplay_sub__WDANn">
        $0.0<sub style={{ opacity: 0.7 }}>{subNumber}</sub>
        {visibleDigits}
      </span>
    </div>
  );
};

export default PriceDisplay;
