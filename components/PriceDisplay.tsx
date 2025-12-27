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

  if (price >= 0.01) {
    const match = price.toString().match(/^(\d+\.\d{0,5})/);
    const displayPrice = match ? match[1] : price.toFixed(4);

    return (
      <div className="BasePopover_base__T5yOf popover-base">
        <span className="PriceDisplay_sub__WDANn">${displayPrice}</span>
      </div>
    );
  }

  let priceStr = price.toString();
  if (priceStr.includes('e') || !priceStr.includes('.')) {
    priceStr = price.toFixed(40);
  }
  const [, decimals] = priceStr.split('.');

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
