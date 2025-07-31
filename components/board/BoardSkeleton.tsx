// components/board/BoardSkeleton.tsx

"use client";

export function BoardSkeleton() {
  return (
    <div className="flex flex-col bg-black lg:flex-row w-full h-full overflow-hidden col-span-2">
      {/* RIGHT: Board Profile Skeleton */}
      <div className="w-full lg:w-[320px] bg-black/50 p-3 ml-auto sm:p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 overflow-y-auto lg:order-2">
        <div className="animate-pulse">
          <div className="flex flex-col sm:flex-row w-full items-center sm:items-start justify-center sm:justify-between gap-4 mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 bg-white/10 rounded-full"></div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-white/10 rounded"></div>
              <div className="w-20 h-8 bg-white/10 rounded"></div>
            </div>
          </div>
          <div className="text-center lg:text-left space-y-3">
            <div className="h-6 bg-white/10 rounded w-3/4 mx-auto lg:mx-0"></div>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-2/3 mx-auto lg:mx-0"></div>
            <div className="flex gap-4 justify-center lg:justify-start">
              <div className="h-4 bg-white/10 rounded w-16"></div>
              <div className="h-4 bg-white/10 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* LEFT: Content Skeleton */}
      <div className="max-w-6xl p-4 sm:p-6 lg:order-1 flex-1">
        <div className="animate-pulse">
          {/* Tab skeleton */}
          <div className="flex gap-4 mb-6">
            <div className="h-8 bg-white/10 rounded w-20"></div>
            <div className="h-8 bg-white/10 rounded w-24"></div>
          </div>
          {/* Content skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded border border-white/10"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}