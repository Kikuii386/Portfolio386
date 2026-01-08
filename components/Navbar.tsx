'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Tooltip from './ui/Tooltips';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import MenuToggle from './ui/MenuToggle';
// ✅ Import ไอคอนให้ครบทุกเมนู
import {
  LayoutDashboard,
  PieChart,
  CandlestickChart,
  Bell,
  ArrowLeftRight,
  WalletCards, // ใช้สำหรับ Balance
  Settings,
  Wallet, // ใช้สำหรับปุ่ม Connect
  Menu,
  X,
} from 'lucide-react';

// ✅ รายการเมนูครบ 7 อย่าง (เพิ่ม Balance กลับมาแล้ว)
const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolio', href: '/portfolio', icon: PieChart },
  { name: 'Markets', href: '/markets', icon: CandlestickChart },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Holdings', href: '/holdings', icon: WalletCards },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  if (pathname === '/') {
    return null;
  }
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isChristmas } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      // เลื่อนลงมาเกิน 50px ให้เปลี่ยนโหมด
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* =========================================================
          1. TOP BAR (DESKTOP ONLY)
          จะแสดงตอนอยู่บนสุด / เมื่อเลื่อนลงจะจางหายไป (Fade Out)
          ========================================================= */}
      <div
        className={`
          hidden md:flex fixed top-0 left-0 w-full z-40 px-8 py-4 
          justify-between items-center
          bg-gradient-to-br from-earth-darkbrown to-earth-brown shadow-md
          transition-all duration-300 ease-in-out
          ${
            scrolled
              ? 'opacity-0 pointer-events-none -translate-y-2' // ถ้าเลื่อนลง: จางหาย + ลอยขึ้นนิดนึง
              : 'opacity-100 pointer-events-auto translate-y-0' // ถ้าอยู่บน: ชัดเจน อยู่ที่เดิม
          }
        `}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 relative transition-transform duration-500 hover:scale-150 hover:-rotate-180">
            <img
              src="/logo.png"
              alt="Logo"
              className="object-contain w-full h-full"
            />
          </div>
          <span className="font-bold text-earth-cream text-2xl tracking-tight">
            Earth Crypto
          </span>
        </Link>

        {/* Horizontal Menu */}
        <nav className="flex items-center gap-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                // ✅ กู้คืน Class เดิมที่มี Animation เส้นวิ่ง (after:...)
                className={`
                  relative px-2 py-1 text-base font-medium transition-colors duration-200
                  hover:text-earth-tan
                  after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5
                  after:rounded-full after:bg-earth-sage
                  ${
                    isActive
                      ? 'after:w-full text-white'
                      : 'after:w-0 text-white/90 hover:after:w-full'
                  }
                  after:transition-all after:duration-300
                `}
                style={{ overflow: 'hidden' }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className="flex items-center gap-2 bg-earth-sage hover:bg-earth-sage/90 text-white font-medium px-5 py-2 rounded-lg transition-all active:scale-95 shadow-md">
            <Wallet size={18} />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
      <div className="h-16 hidden md:block" />
      {/* =========================================================
          2. SIDE DOCK (DESKTOP ONLY)
          จะซ่อนอยู่ตอนแรก / เมื่อเลื่อนลงจะค่อยๆ ปรากฏขึ้นมา (Fade In)
          ========================================================= */}

      {/* Wrapper ใสๆ เพื่อจัดกึ่งกลาง กันไม่ให้ CSS ตีกัน */}
      <div className="hidden md:flex fixed top-0 left-4 h-full flex-col justify-center z-50 pointer-events-none">
        {/* ตัว Dock จริงๆ */}
        <div
          className={`
            w-16 py-6 gap-6 flex flex-col items-center pointer-events-auto
            bg-gradient-to-br from-earth-darkbrown to-earth-brown shadow-xl 
            border border-earth-cream/10 rounded-2xl
            transition-all duration-300 ease-in-out
            ${
              scrolled
                ? 'opacity-100 translate-x-0' // โชว์: อยู่ที่เดิม
                : 'opacity-0 -translate-x-2' // ซ่อน: จางหาย + หลบไปซ้าย
            }
          `}
        >
          <Link
            href="/"
            className="relative w-8 h-8 transition-transform duration-500 hover:scale-150 hover:rotate-180 mb-2"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="object-contain w-full h-full"
            />
          </Link>

          <nav className="flex flex-col gap-4 w-full items-center">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.name} content={item.name} side="right">
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                    relative group/item p-2 rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? 'bg-earth-sage/20 text-earth-sage'
                        : 'text-earth-cream/70 hover:text-earth-darkbrown hover:bg-earth-cream/50 '
                    }
                  `}
                  >
                    <item.icon size={24} />
                  </Link>
                </Tooltip>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-4 items-center w-full ">
            <Tooltip content="Switch Theme" side="right">
              <ThemeToggle />
            </Tooltip>
            <Tooltip content="Connect Wallet" side="right">
              <button className="w-10 h-10 flex items-center justify-center bg-earth-sage hover:bg-earth-sage/90 text-white rounded-xl transition-all active:scale-95 shadow-lg">
                <Wallet size={20} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE NAVBAR (Sticky Top)
          ========================================================= */}
      <div className="md:hidden fixed left-0 top-0 w-full z-[100] bg-gradient-to-br from-earth-darkbrown to-earth-brown shadow-md border-b border-earth-cream/10 h-16 px-4 flex justify-between items-center">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src={isChristmas ? '/logo-xmas.png' : '/logo.png'}
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold text-earth-cream">
            Earth Crypto
          </span>
        </Link>

        {/* Custom Hamburger Button */}
        <div className="flex gap-4 ">
          {/* ✅ ใช้ Component กลาง แทน SVG ที่เขียนสด */}
          {/* ใส่ p-1 เพื่อให้ขนาดปุ่มเท่าเดิมกับตอนเขียนสด */}
          <MenuToggle
            isOpen={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-earth-cream hover:text-white p-1 bg-gradient-to-br from-earth-darkbrown to-earth-brown rounded-lg"
          />
        </div>
      </div>
      <div className="h-12 md:hidden" />
      {/* =========================================================
          MOBILE DRAWER (Left Side & Under Navbar)
          ========================================================= */}

      {/* Backdrop (พื้นหลังดำจางๆ) */}
      <div
        className={`
          md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300
          top-16 
          ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer Container */}
      <div
        className={`
          md:hidden fixed z-[100] w-[280px] 
          top-16 bottom-0 
          left-0
          bg-gradient-to-br from-earth-darkbrown to-earth-brown shadow-xl border-r border-white/10
          transform transition-transform duration-300 ease-out flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        `}
      >
        {/* Header ของ Drawer (ไม่ต้องมีปุ่มปิดแล้ว เพราะปุ่มข้างบนทำหน้าที่ปิดได้) */}
        <div className="p-4 border-b border-white/10">
          <span className="text-sm font-bold text-earth-stone uppercase tracking-wider">
            Menu
          </span>
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                    ${
                      pathname === item.href
                        ? `${
                            isChristmas
                              ? 'bg-red-600 text-white'
                              : 'bg-earth-stone/80 text-darkbrown'
                          } shadow-lg font-bold`
                        : 'text-earth-cream/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Footer (Connect & Theme) */}
        <div className="p-6 border-t border-white/10 space-y-4 bg-black/10">
          <div className="flex items-center justify-between px-1">
            <span className="text-earth-cream/80 font-medium">
              Switch Theme
            </span>
            <ThemeToggle />
          </div>

          <button
            className={`
              w-full flex justify-center items-center gap-2 text-white font-bold py-3 rounded-xl 
              transition-all shadow-lg active:scale-95
              ${
                isChristmas
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-earth-sage hover:bg-earth-sage/90'
              }
            `}
          >
            <Wallet size={20} />
            Connect Wallet
          </button>
        </div>
      </div>
    </>
  );
}
