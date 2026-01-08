// app/Holdings/page.tsx

import CryptoBalanceChecker from 'components/CryptoBalanceChecker';

export const dynamic = 'force-dynamic';

export default function MyPage() {
  return (
    <section className="py-12 " id="balance-checker">
      <div className=" container mx-auto px-4 ">
        <div className="text-center">
          <h2 className=" text-3xl  font-bold mb-8 text-earth-primary relative section-heading after:w-full">
            Wallet Balance Checker
          </h2>
          <p className="text-center text-earth-stone mt-4  text-base md:text-lg">
            A safe, multi-chain explorer for your DEX wallets.
          </p>
        </div>
        {/* ส่วนเช็ค Balance วางไว้ด้านบน หรือ Sidebar */}
        <div className="mb-20 my-8">
          <CryptoBalanceChecker />
        </div>
      </div>
    </section>
  );
}
