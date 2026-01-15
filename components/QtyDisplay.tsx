import React from 'react';

// ✅ Logic หลักอยู่ที่นี่ที่เดียว
export function formatQtyString(qty: number): string {
  const absQty = Math.abs(qty);

  if (qty === 0) return '0.00';

  // Logic ย่อหน่วย
  if (absQty >= 1_000_000_000_000)
    return (qty / 1_000_000_000_000).toFixed(2).replace(/\.00$/, '') + 'T';
  if (absQty >= 1_000_000_000)
    return (qty / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + 'B';
  if (absQty >= 1_000_000)
    return (qty / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  if (absQty >= 1_000)
    return (qty / 1_000).toFixed(2).replace(/\.00$/, '') + 'K';

  // Logic ทศนิยมละเอียด
  if (absQty < 1 && absQty > 0) {
    return qty.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  // Logic ปกติ
  return qty.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type Props = {
  qty: number;
  prefix?: string;
};

// ✅ Component เรียกใช้ฟังก์ชันข้างบน (สั้นลง เหลือแค่นี้)
const QtyDisplay = ({ qty, prefix }: Props) => {
  const absQty = Math.abs(qty);

  // 🔥 เงื่อนไขพิเศษ: ถ้า 0.0000... (น้อยกว่า 0.0001) ให้ใช้ตัวห้อย
  // คุณสามารถปรับเลข 0.0001 เป็นค่าน้อยกว่านี้ได้ตามต้องการ
  if (absQty < 0.0001 && absQty > 0) {
    // แปลงเป็น String เต็มๆ ป้องกันพวก 1e-7
    const valStr = qty.toFixed(20);
    const [, decimalPart] = valStr.split('.');

    if (decimalPart) {
      // หาตำแหน่งที่ไม่ใช่เลข 0 ตัวแรก
      const firstNonZeroIndex = decimalPart.search(/[^0]/);

      if (firstNonZeroIndex !== -1) {
        const zeroCount = firstNonZeroIndex; // จำนวนเลข 0
        const visibleDigits = decimalPart.slice(
          firstNonZeroIndex,
          firstNonZeroIndex + 4
        ); // ตัดมาโชว์ 4 ตัวหลังศูนย์

        return (
          <span>
            {prefix}0.0
            <sub className="opacity-70 text-[0.8em] font-medium mx-[1px]">
              {zeroCount}
            </sub>
            {visibleDigits}
          </span>
        );
      }
    }
  }

  // กรณีอื่นๆ (0, เลขปกติ, เลขล้าน) ให้ใช้ฟังก์ชันเดิมเลย
  return (
    <>
      {prefix}
      {formatQtyString(qty)}
    </>
  );
};

export default QtyDisplay;
