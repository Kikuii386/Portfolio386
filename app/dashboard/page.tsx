

import DashboardSection from '@/components/DashboardSection'; // ✅ Import Dashboard
import { getDashboardData } from "@/lib/getDashboardData"; // ดึงเหรียญ
import { getSheetKPIs } from "@/lib/getSheetKPIs";         // ดึงกราฟ (เพิ่มมาใหม่)

export const dynamic = 'force-dynamic';
export default async function DashboardPage() {
  // ⚡️ สั่งดึงข้อมูล 2 อย่างพร้อมกัน (Server-Side)
  // ข้อมูลจะวิ่งมาจาก Redis ทันที (เร็วมาก)
  const [tokens, history] = await Promise.all([
    getDashboardData(),
    getSheetKPIs()
  ]);
  return (
    <section className="py-12" id="dashboard">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">
              Dashboard
            </h2>
            <p className="text-earth-brown mt-4 text-base md:text-lg">
              Overview of your crypto portfolio performance
            </p>
          </div>
        </div>
        <DashboardSection initialTokens={tokens} initialHistory={history} />
      </div>
    </section>
  );
}
