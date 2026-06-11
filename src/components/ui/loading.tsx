import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Carregando..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="animate-spin text-accent mb-3" size={32} />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-border rounded"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}
