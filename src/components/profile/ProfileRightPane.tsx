// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProfileRightPane({ slug: _slug }: { slug: string }) {
  return (
    <div className="h-full w-full flex flex-col justify-between bg-black/40 p-4 text-white text-sm overflow-y-auto">
      {/* Top Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold">Trouper</p>
            <p className="text-white/60">Avatar Level: New Goth</p>
            <p className="text-white/60">Subscribers: 14</p>
          </div>
          <button className="px-3 py-1 bg-white/10 rounded hover:bg-white/20 text-xs">
            Share Profile
          </button>
        </div>
      </div>

      {/* My Stuff */}
      <div className="mt-6 space-y-2">
        <h3 className="text-white/80 font-semibold">My Stuff</h3>
        <div className="border border-white/10 rounded p-4 text-white/50 italic">
          You have nothing!
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <button className="w-full bg-white/10 hover:bg-white/20 rounded px-3 py-2 font-semibold">
          Create
        </button>
      </div>
    </div>
  );
}
