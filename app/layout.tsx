import "./globals.css";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earth Crypto",
  description: "Your portfolio tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-earth-cream text-earth-stone font-sans">
        <Navbar />
        <main className="flex-1">
          <div className="w-full px-0">{children}</div>
        </main>
      </body>
    </html>
  );
}
