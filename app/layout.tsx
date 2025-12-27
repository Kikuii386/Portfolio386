import './globals.css';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import Snowfall from '@/components/Snowfall'; // ✅ Import
import ChristmasLights from '@/components/ChristmasLights';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.earthcrypto.space'),
  title: 'EarthCrypto | Portfolio Tracker', // ชื่อเว็บที่จะโชว์
  description:
    'Track your crypto portfolio across multiple chains with real-time prices.', // คำโปรยสั้นๆ

  // การตั้งค่าสำหรับการแชร์ (Open Graph)
  openGraph: {
    title: 'EarthCrypto - Your Crypto Dashboard',
    description: 'Real-time portfolio tracking on standard UI.',
    url: 'https://www.earthcrypto.space',
    siteName: 'EarthCrypto',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-cover.png', // ไม่ต้องใส่ https เดี๋ยว metadataBase เติมให้
        width: 1200,
        height: 630,
        alt: 'EarthCrypto Dashboard',
      },
    ],
  },

  // การตั้งค่าสำหรับ Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'EarthCrypto | Portfolio Tracker',
    description: 'Track your crypto portfolio simply and effectively.',
    images: ['/og-cover.png'], // ชี้ไปไฟล์เดียวกัน
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
          <ThemeProvider>
            <Snowfall />
            <ChristmasLights />
            <Navbar />
            <main className="flex-1 ">
              <div className="w-full px-0">{children}</div>
            </main>
            <Toaster />
          </ThemeProvider>

      </body>
    </html>
  );
}
