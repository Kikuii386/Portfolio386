"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Markets", href: "/markets" },
  { name: "Alerts", href: "/alerts" },
  { name: "Transactions", href: "/transactions" },
  { name: "Settings", href: "/settings" },
  { name: "Balance", href: "/balance" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav>
      <header className="bg-[#5E4B3C] text-white sticky top-0 z-40 shadow-md font-['Inter']">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Brand */}
            <div className="flex items-center space-x-2">
              {/* <svg ...> ... </svg> */}
              <span className="text-xl font-bold">Earth Crypto</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                  relative px-2 py-1 text-sm font-medium transition-colors duration-200
                  hover:text-[#BEA78C]
                  after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5
                  after:rounded-full after:bg-[#A4AC86]
                  ${pathname === item.href
                    ? "after:w-full text-white"
                    : "after:w-0 text-white/90 hover:after:w-full"}
                  after:transition-all after:duration-300
                `}
                  style={{ overflow: "hidden" }}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Connect Wallet Button */}
            <div className="hidden md:block">
              <button className="bg-[#A4AC86] hover:bg-[#A4AC86]/90 text-white font-medium px-5 py-2 rounded-md transition-colors duration-200">
                Connect Wallet
              </button>
            </div>

            {/* Hamburger (Mobile) */}
            <div className="md:hidden">
              <button
                className="p-2 rounded hover:bg-[#4A4A48]/20"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-64 h-full bg-[#5E4B3C] border-l border-[#4A4A48]/20 text-white p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                {/* <svg ...> ... </svg> */}
                <span className="text-xl font-bold">Earth Crypto</span>
              </div>
              <button
                className="p-2 rounded hover:bg-[#4A4A48]/20"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                      relative px-2 py-2 text-base font-medium rounded transition-colors duration-200
                      hover:text-[#BEA78C]
                      after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5
                      after:rounded-full after:bg-[#A4AC86]
                      ${pathname === item.href
                        ? "after:w-full text-white"
                        : "after:w-0 text-white/90 hover:after:w-full"}
                      after:transition-all after:duration-300
                    `}
                  style={{ overflow: "hidden" }}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-[#4A4A48]/20">
                <button
                  className="w-full bg-[#A4AC86] hover:bg-[#A4AC86]/90 text-white font-medium py-3 rounded-md transition-colors duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
          {/* คลิกพื้นหลังเพื่อปิด */}
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </nav>
  );
}