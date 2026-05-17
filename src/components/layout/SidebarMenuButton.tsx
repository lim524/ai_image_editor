"use client";

interface SidebarMenuButtonProps {
  onClick: () => void;
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** 햄버거 메뉴 버튼 (사이드바 열기/닫기) */
export function SidebarMenuButton({
  onClick,
  open = false,
  className = "",
  style,
}: SidebarMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "\uC0AC\uC774\uB4DC\uBC14 \uB2EB\uAE30" : "\uC0AC\uC774\uB4DC\uBC14 \uC5F4\uAE30"}
      aria-expanded={open}
      style={style}
      className={`w-11 h-11 flex items-center justify-center bg-black border border-neutral-800 hover:border-neutral-500 hover:bg-neutral-950 transition-colors shrink-0 ${className}`}
    >
      <span className="flex flex-col gap-[5px] w-5">
        <span
          className={`block h-[2px] w-full rounded-full bg-white transition-all origin-center ${
            open ? "translate-y-[7px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-full rounded-full bg-white transition-all ${
            open ? "opacity-0 scale-x-0" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-full rounded-full bg-white transition-all origin-center ${
            open ? "-translate-y-[7px] -rotate-45" : ""
          }`}
        />
      </span>
    </button>
  );
}
