'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';


type ThemeContextType = {
  isChristmas: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isChristmas, setIsChristmas] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // บอกว่าโหลดเสร็จแล้ว
    
    const savedTheme = localStorage.getItem('theme-preference');
    
    if (savedTheme) {
      setIsChristmas(savedTheme === 'christmas');
    } else {
      setIsChristmas(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // จัดการ Class ที่ Body
    if (isChristmas) {
      document.body.classList.add('theme-christmas');
    } else {
      document.body.classList.remove('theme-christmas');
    }
    localStorage.setItem('theme-preference', isChristmas ? 'christmas' : 'default');
  }, [isChristmas, mounted]);

  const toggleTheme = () => {
    console.log('Theme Toggle Clicked! Current state:', isChristmas);
    setIsChristmas((prev) => !prev);
  };

  // ✅ แก้ไข: ลบ if (!mounted) ออก
  // เราต้องส่ง Provider ออกไปเสมอ เพื่อให้ลูกหลาน (Navbar) เรียกใช้ Context ได้
  return (
    <ThemeContext.Provider value={{ isChristmas, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
  
};