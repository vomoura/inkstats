"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, duration = 5000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:right-4 left-4 sm:left-auto z-[100] sm:w-72">
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={() => { setVisible(false); onClose(); }}
            className="p-1 rounded text-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-accent"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
