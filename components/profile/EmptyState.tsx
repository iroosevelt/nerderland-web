"use client";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-8 sm:py-12 text-gray-400">
      <p className="mb-4">{title}</p>
      {description && <p className="text-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[var(--color-yellow)] text-black hover:bg-[var(--color-yellow)] text-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
