import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export function ErrorMessage({ title = "Erro", message }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/5 p-4">
      <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} />
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted mt-0.5">{message}</p>
      </div>
    </div>
  );
}
