import type { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-muted mb-4">{icon}</div>}
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-muted text-sm max-w-md mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
