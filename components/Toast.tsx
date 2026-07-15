"use client";
import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number; // ms, 0 = no auto-dismiss
}

export default function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const styles = {
    success: {
      overlay: "bg-emerald-50 border-emerald-200",
      icon: "text-emerald-500",
      title: "text-emerald-800",
      msg: "text-emerald-700",
      btn: "bg-emerald-500 hover:bg-emerald-600",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-5" />
        </svg>
      ),
      label: "Success",
    },
    error: {
      overlay: "bg-red-50 border-red-200",
      icon: "text-red-500",
      title: "text-red-800",
      msg: "text-red-700",
      btn: "bg-red-500 hover:bg-red-600",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
      ),
      label: "Error",
    },
    info: {
      overlay: "bg-blue-50 border-blue-200",
      icon: "text-blue-500",
      title: "text-blue-800",
      msg: "text-blue-700",
      btn: "bg-blue-500 hover:bg-blue-600",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4m0-4h.01" />
        </svg>
      ),
      label: "Info",
    },
  };

  const s = styles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className={`w-full max-w-sm rounded-2xl border shadow-xl p-8 flex flex-col items-center gap-4 text-center animate-fade-in ${s.overlay}`}>
        <span className={s.icon}>{s.svg}</span>
        <div>
          <p className={`text-base font-bold mb-1 ${s.title}`}>{s.label}</p>
          <p className={`text-sm ${s.msg}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`mt-1 px-6 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${s.btn}`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
