import React from 'react';

type Props = {
  isOpen: boolean;
  onClick: () => void;
  className?: string; // รับ class เพิ่มเติมเพื่อเปลี่ยนสีได้
};

const MenuToggle = ({ isOpen, onClick, className = 'text-earth-darkbrown' }: Props) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      // ใส่ class พื้นฐาน และรับ class ที่ส่งเข้ามาเพิ่ม
      className={` transition-colors hover:opacity-80 active:scale-95 ${className}`}
    >
      <svg
        width="24" // ปรับขนาดมาตรฐาน
        height="24"
        viewBox="0 0 16 16"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* เส้นบน */}
        <rect
          x="1"
          y="7"
          width="14"
          height="2"
          rx="1"
          style={{
            transformOrigin: 'center center',
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)', // ปรับ animation ให้นุ่มขึ้น
            transform: isOpen ? 'rotate(45deg)' : 'translateY(-3.5px)',
          }}
        />
        {/* เส้นล่าง */}
        <rect
          x="1"
          y="7"
          width="14"
          height="2"
          rx="1"
          style={{
            transformOrigin: 'center center',
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(-45deg)' : 'translateY(3.5px)',
          }}
        />
      </svg>
    </button>
  );
};

export default MenuToggle;