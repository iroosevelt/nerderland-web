"use client";

interface LoadingGridProps {
  type?: "grid" | "list";
  count?: number;
}

export function LoadingGrid({ type = "grid", count = 3 }: LoadingGridProps) {
  if (type === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white/5 h-20 rounded"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white/5 h-48 rounded"
        />
      ))}
    </div>
  );
}