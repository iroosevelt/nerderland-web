// src/components/shared/feed-card.tsx

import BoardCard from "../BoardCard";
import FolderCard from "../FolderCard";
import MasonryGrid from "../MasonryGrid";

export function Feed() {
  return (
    <main className="w-full max-w-5xl bg-black border border-white/10 transition rounded-none mt-15">
      {/* New Stuff */}
      <section className="flex flex-col p-4">
        <header>
          <div className="font-display">
            <h2 className="text-2xl">New Stuff</h2>
            <p className="text-[#FF31E2]">3,245 New Stuff!</p>
          </div>
        </header>
        <MasonryGrid />
      </section>

      {/* Top Boards */}
      <header className="p-4">
        <div className="font-display">
          <h2 className="text-2xl">Nerdrums · Top Boards</h2>
        </div>
      </header>
      <section className="pb-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <BoardCard key={`board-${index}`} />
          ))}
        </div>
      </section>

      {/* Top Secret Folders */}
      <header className="p-4">
        <div className="font-display">
          <h2 className="text-2xl">Folders · Top Secret</h2>
        </div>
      </header>
      <section className="pb-8 px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(9)].map((_, index) => (
            <FolderCard key={`folder-${index}`} />
          ))}
        </div>
      </section>

      {/* Lore Stories */}
      <header className="p-4">
        <div className="font-display">
          <h2 className="text-2xl">Stories · Lore</h2>
        </div>
      </header>
      <section className="pb-8 flex flex-col px-4">
        <MasonryGrid />
      </section>

      {/* Ads */}
      <header className="p-4">
        <div className="font-display">
          <h2 className="text-2xl">Adverts</h2>
        </div>
      </header>
      <section className="pb-8 flex flex-col px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["/img/ad1.jpg", "/img/ad1.jpg"].map((src, index) => (
            <div
              key={`ad-${index}`}
              className="bg-white/10 w-full h-[400px] bg-contain p-8"
              style={{
                backgroundImage: `url('${src}')`,
                backgroundRepeat: "no-repeat",
              }}
            ></div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-center text-center px-20 py-10 text-xs opacity-50 space-x-2">
        <p>Built by Humans, floating in space</p>
        <p>·</p>
        <p>Nerderland Social Arena, 2025</p>
        <span>🛸</span>
      </footer>
    </main>
  );
}
