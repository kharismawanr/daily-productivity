import React, { useRef } from "react";
import { Calendar } from "lucide-react";

interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  value,
  onChange,
  className = "",
  id,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
    }
  };

  return (
    <div
      className={`datetime-input-wrap relative mt-1 w-full cursor-pointer ${className}`}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        className="datetime-input w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-3 pr-10 text-sm text-zinc-100 outline-none focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-500/30"
      />
      <Calendar
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300"
        aria-hidden
      />
    </div>
  );
};