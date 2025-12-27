import React from "react";

type Props = {
  qty: number;
  prefix?: string;
};

const QtyDisplay = ({ qty, prefix }: Props) => {
  // สร้างตัวแปรเก็บค่าสัมบูรณ์ (เอาไว้เช็คเงื่อนไข โดยไม่สนเครื่องหมายลบ)
  const absQty = Math.abs(qty);

  if (absQty >= 1_000_000_000) return <>{prefix}{(qty / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B</>;
  if (absQty >= 1_000_000) return <>{prefix}{(qty / 1_000_000).toFixed(2).replace(/\.00$/, '')}M</>;
  if (absQty >= 1_000) return <>{prefix}{(qty / 1_000).toFixed(2).replace(/\.00$/, '')}K</>;

  // กรณีค่าน้อยกว่า 1,000
  return <>{prefix}{qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</>;
};

export default QtyDisplay;