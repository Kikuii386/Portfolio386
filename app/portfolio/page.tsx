"use client";
import { useEffect, useState } from "react";

interface TokenData {
  token: string;
  amount: number;
  price: number;
  value: number;
}

export default function PortfolioPage() {
  const [data, setData] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dexscreener");
        const result = await res.json();
        setData(result.tokens);
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Portfolio</h1>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 mt-6">
          {Array.isArray(data) &&
            data.map((token, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md px-6 py-4 border-b-4 border-amber-500"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xl font-semibold text-gray-800">{token.token}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Amount</div>
                    <div className="text-gray-900 font-medium">{token.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Price</div>
                    <div className="text-gray-900 font-medium">${token.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Value</div>
                    <div className="text-emerald-600 font-bold">${token.value.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
