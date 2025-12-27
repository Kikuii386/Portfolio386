// lib/auth.ts

export async function isEmailAllowed(email: string): Promise<boolean> {
  // URL ของ Cloudflare Tunnel ที่ชี้ไปหา API เครื่องคุณ (เช่น https://my-tunnel.trycloudflare.com)
  // ต้องรวม path ไปถึง handler ด้วย เช่น /api/check-auth
  const tunnelUrl = process.env.BACKEND_API_URL; 
  
  if (!tunnelUrl) {
    console.error("❌ Missing BACKEND_API_URL in .env");
    return false;
  }

  try {
    console.log(`📡 Checking permission for: ${email}`);
    
    // ยิง Request ไปหา Local Server ผ่าน Tunnel
    const res = await fetch(tunnelUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store' // สำคัญ: ห้ามจำค่าเดิม
    });

    if (!res.ok) {
      console.error(`Tunnel API Error: ${res.status}`);
      return false;
    }

    const data = await res.json();
    // คาดหวังผลลัพธ์: { "isAllowed": true } จาก Local Code ของคุณ
    return !!data.isAllowed;

  } catch (error) {
    console.error("❌ Tunnel Connection Failed:", error);
    return false;
  }
}