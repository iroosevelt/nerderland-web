// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProfileLeftPane({ slug: _slug }: { slug: string }) {
  return (
    <div className="h-full w-full flex flex-col gap-4 bg-black/60 p-4 text-white overflow-y-auto text-sm">
      <div className="space-y-1">
        <h3 className="font-bold text-white/80">Subscriptions</h3>
        <ul className="list-disc list-inside text-white/60">
          <li>Following 3 nerds</li>
          <li>Subscribed by 12</li>
        </ul>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-white/80">Nerdrums</h3>
        <ul className="list-disc list-inside text-white/60">
          <li>🧪 Big Ideas Lab</li>
          <li>🚀 Dev Dungeon</li>
        </ul>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-white/80">Saved Items</h3>
        <ul className="list-disc list-inside text-white/60">
          <li>No saved content yet</li>
        </ul>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-white/80">Profile Info</h3>
        <p className="text-white/70">
          Level: <span className="text-green-400">New Goth</span>
        </p>
        <p>Name: Trouper</p>
        <p>Address: 0xA3...45B2</p>
        <p>Reset code: ********</p>
        <button className="mt-2 px-3 py-1 bg-white/10 rounded hover:bg-white/20 text-xs">
          Save
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-white/80">Nerdy Points</h3>
        <p className="text-xl text-green-500 font-mono">128</p>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-white/80">Nerdity Levels</h3>
        <ul className="list-inside space-y-1">
          {[
            "Little wea",
            "Laper",
            "New Goth",
            "Thriller",
            "Algo Hacker",
            "Prophet",
            "Observer",
            "Founder",
          ].map((level) => (
            <li
              key={level}
              className="flex items-center justify-between text-white/60"
            >
              <span>{level}</span>
              <button className="text-white/40 hover:text-white/80">?</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
