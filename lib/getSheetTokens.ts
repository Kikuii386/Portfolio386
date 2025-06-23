export type TokenRow = {
  name: string;
  chain: string;
  contract: string;
  highEntry: number;
  highQty: number;
  highInv: number;
  lowEntry: number;
  lowQty: number;
  lowInv: number;
  totalEntry: number;
  totalQty: number;
  totalInv: number;
};

export async function getSheetTokens(): Promise<TokenRow[]> {
  const url =
    "https://script.google.com/macros/s/AKfycbxerwb9OEnsVTbLzDimVMplXeNNQT7BK3oBul3DULboJxaBMyZOy_xho9vRQl_nQFvg/exec";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch data from Google Sheet");
  const data = await res.json();
  return data as TokenRow[];
}
