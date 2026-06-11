import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h3 className={`text-sm font-semibold text-muted uppercase tracking-wide ${className}`}>
      {children}
    </h3>
  );
}

export function CardValue({ children, className = "" }: CardProps) {
  return (
    <p className={`text-2xl font-bold mt-1 ${className}`}>
      {children}
    </p>
  );
}
