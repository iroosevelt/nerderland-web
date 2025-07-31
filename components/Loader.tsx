import React from "react";

export default function Loader() {
  return (
    <div className="flex w-full h-full items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-yellow)]"></div>
    </div>
  );
}
