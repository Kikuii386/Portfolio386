// app/page.tsx
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 🟢 LEFT SIDE: FORM (พื้นที่ล็อกอิน) */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white relative">
        {/* Logo มุมซ้ายบน (แสดงเฉพาะใน Desktop เพราะใน Mobile เราใส่ใน Card แล้ว) */}
        <div className="hidden md:flex justify-start">
          <a
            href="#"
            className="flex items-center gap-2 font-medium text-earth-darkbrown"
          >
            <div className="bg-earth-darkbrown text-earth-cream flex size-8 items-center justify-center rounded-lg">
              {/* ใส่ Logo เล็กๆ หรือ Icon */}
              <span className="font-bold text-lg">E</span>
            </div>
            <span className="text-lg font-bold">Earth Crypto</span>
          </a>
        </div>

        {/* พื้นที่วาง LoginForm ให้อยู่ตรงกลาง */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* 🟤 RIGHT SIDE: VISUALS (พื้นที่กราฟิก เต็มจอฝั่งขวา) */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-earth-darkbrown to-earth-brown text-earth-cream overflow-hidden">
        {/* Background Patterns (ลายจุด + Blobs) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F5F2EB_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-earth-sage/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-earth-tan/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Content ฝั่งขวา (เหมือนหน้าปกสวยๆ) */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Top: Quote หรือ Logo ใหญ่ */}
          <div className="mt-10">
            <div className="w-16 h-16 bg-earth-cream/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-earth-cream/20">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-4xl font-serif font-bold leading-tight">
              Track your wealth, <br />
              <span className="text-earth-sage">naturally.</span>
            </h1>
          </div>

          {/* Bottom: Footer text */}
          <blockquote className="space-y-2">
            <p className="text-lg font-light text-earth-cream/90 italic">
              &ldquo;Manage your crypto portfolio across EVM, Solana, and
              Bitcoin in one calm interface.&rdquo;
            </p>
            <footer className="text-sm text-earth-cream/60 pt-4">
              © 2025 Earth Crypto Inc.
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
