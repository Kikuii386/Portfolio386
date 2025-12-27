'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      // 1. เพิ่ม richColors เพื่อให้เวลา success/error มีสีสันชัดเจน
      richColors
      // 2. ปรับตำแหน่ง default เป็นขวาล่าง (หรือเปลี่ยนเป็น top-right ได้)
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast !backdrop-blur-md group-[.toaster]:!bg-earth-cream group-[.toaster]:!text-sm group-[.toaster]:!text-earth-brown group-[.toaster]:!border-earth-sage/30 group-[.toaster]:!shadow-lg group-[.toaster]:!rounded-xl !font-sans",

          description: "group-[.toast]:!text-earth-tan ",

          actionButton:
            "group-[.toast]:!bg-earth-sage group-[.toast]:!text-white hover:group-[.toast]:!bg-earth-olive transition-colors font-bold",
          
          cancelButton:
            "group-[.toast]:!bg-earth-creammy group-[.toast]:!text-earth-stone group-[.toast]:!border-earth-stone/20 hover:group-[.toast]:!bg-earth-stone/20 transition-colors",

          /* --- บังคับเปลี่ยนสีด้วย ! (Important) --- */

          // Error: ใช้อิฐ/ดินเผา (Clay)
          error: 
            "group-[.toaster]:!bg-earth-clay/10 group-[.toaster]:!text-earth-clay group-[.toaster]:!border-earth-clay/30",

          // Success: ใช้เขียวอ่อน (Mist) + เขียวมะกอก (Olive)
          success: 
            "group-[.toaster]:!bg-earth-mist/80 group-[.toaster]:!text-earth-olive group-[.toaster]:!border-earth-sageleaf",

          // Warning: ใช้เหลืองนวล (Haze) + น้ำตาล (Brown Medium)
          warning: 
            "group-[.toaster]:!bg-earth-haze group-[.toaster]:!text-earth-brownmedium group-[.toaster]:!border-earth-flax",

          // Info: ใช้ครีมสว่าง (Creamlight) + เทาเข้ม (Primary)
          info: 
            "group-[.toaster]:!bg-earth-creamlight group-[.toaster]:!text-earth-primary group-[.toaster]:!border-earth-stone/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
