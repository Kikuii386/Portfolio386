// components/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Wallet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function LoginFormContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  // 1. Logic Login Email (จำลอง)
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.info('Email/Password login is coming soon!', {
        description: 'Please use Google login for now.',
      });
    }, 1500);
  };

  // 2. Logic Google Login (Custom Button)
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const loadingId = toast.loading('Verifying with server...');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        toast.dismiss(loadingId);
        toast.success('Welcome back!');
        router.push('/dashboard');
        router.refresh();
      } catch (err: any) {
        toast.dismiss(loadingId);
        toast.error(err.message);
      }
    },
    onError: () => toast.error('Google Login Failed'),
  });

  // 3. Logic Wallet Connect (จำลอง)
  const handleWalletConnect = () => {
    setWalletLoading(true);
    setTimeout(() => {
      setWalletLoading(false);
      toast.info('Wallet connect feature coming soon!');
    }, 1500);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* ✅ 3. ใส่ปุ่ม ThemeToggle ตรงนี้ (ลอยขวาบน) */}
      <div className="absolute top-0 right-0 z-10 md:-right-12 md:top-2">
        <ThemeToggle />
      </div>
      {/* Header */}
      <div className="md:hidden flex items-center gap-2 mb-6 justify-center">
        <div className="w-10 h-10 bg-earth-cream/20 rounded-xl flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-xl font-bold text-earth-darkbrown">
          Earth Crypto
        </span>
      </div>

      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold text-earth-darkbrown font-serif">
          Welcome back
        </h2>
        <p className="text-earth-stone">
          Sign in securely to access your portfolio.
        </p>
      </div>

      {/* Container หลัก */}
      <div className="space-y-6">
        {/* ✅ ส่วนที่ 1: Social / Wallet Buttons (ย้ายขึ้นมาบนสุด) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => googleLogin()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-earth-cream/80 rounded-xl hover:bg-earth-cream/30 hover:border-earth-sage/50 text-earth-darkbrown font-medium text-sm transition-all duration-200 active:scale-95 bg-white/50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Wallet Button */}
          <button
            type="button"
            disabled={walletLoading}
            onClick={handleWalletConnect}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-earth-cream/80 rounded-xl hover:bg-earth-cream/30 hover:border-earth-sage/50 text-earth-darkbrown font-medium text-sm transition-all duration-200 group active:scale-95 bg-white/50"
          >
            {walletLoading ? (
              <Loader2 size={18} className="animate-spin text-earth-sage" />
            ) : (
              <Wallet
                size={18}
                className="text-earth-sage group-hover:text-earth-darkbrown transition-colors"
              />
            )}
            <span>Wallet</span>
          </button>
        </div>

        {/* ✅ ส่วนที่ 2: Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-earth-cream/80"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-earth-stone font-medium tracking-wider">
              Or with email
            </span>
          </div>
        </div>

        {/* ✅ ส่วนที่ 3: Form Inputs (ย้ายลงมาล่างสุด) */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-earth-brown uppercase tracking-wide ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone group-focus-within:text-earth-sage transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-earth-cream/20 border border-earth-cream/80 rounded-xl text-earth-darkbrown placeholder-earth-stone/70 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-earth-brown uppercase tracking-wide ml-1 flex justify-between">
                <span>Password</span>
                <Link
                  href="#"
                  className="text-earth-sage hover:text-earth-darkbrown transition-colors cursor-pointer normal-case font-medium"
                >
                  Forgot?
                </Link>
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone group-focus-within:text-earth-sage transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-earth-cream/20 border border-earth-cream/80 rounded-xl text-earth-darkbrown placeholder-earth-stone/70 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-earth-darkbrown text-earth-cream font-bold rounded-xl hover:bg-earth-brown hover:shadow-lg hover:shadow-earth-brown/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-earth-stone">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-bold text-earth-darkbrown hover:text-earth-sage transition-colors underline decoration-earth-sage/30 underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginForm() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <LoginFormContent />
    </GoogleOAuthProvider>
  );
}
