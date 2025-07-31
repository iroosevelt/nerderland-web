"use client";

import { BoardGrid } from "./BoardGrid";
import { MasonryGrid } from "./MasonryGrid";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { ConnectDialog } from "./wallet/ConnectDialog";
import AdvertCard from "./cards/AdvertCard";

export function Feed() {
  const router = useRouter();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [storyCount, setStoryCount] = useState<number>(0);
  const [adverts, setAdverts] = useState<Array<{
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    link_url: string | null;
    formatted_created_at: string;
    user: {
      id: number;
      username: string | null;
      avatar_url: string | null;
    } | null;
  }>>([]);
  const [advertsLoading, setAdvertsLoading] = useState(false);


  const closeDialog = useCallback(() => {
    setShowConnectDialog(false);
  }, []);

  const handleConnected = useCallback(() => {
    setShowConnectDialog(false);
    router.push("/upload");
  }, [router]);

  // Fetch adverts
  const fetchAdverts = async () => {
    try {
      setAdvertsLoading(true);
      const response = await fetch("/api/adverts?limit=4");
      if (response.ok) {
        const data = await response.json();
        setAdverts(data.adverts || []);
      }
    } catch (error) {
      console.error("Error fetching adverts:", error);
      setAdverts([]);
    } finally {
      setAdvertsLoading(false);
    }
  };

  // Fetch total story count and adverts
  useEffect(() => {
    const fetchStoryCount = async () => {
      try {
        const response = await fetch("/api/stories");
        if (response.ok) {
          const data = await response.json();
          setStoryCount(data.total || data.stories?.length || 0);
        }
      } catch {
        setStoryCount(0);
      }
    };

    fetchStoryCount();
    fetchAdverts();
  }, []);

  return (
    <>
      <main className="w-full md:max-w-5xl bg-black border-0 md:border md:border-white/10 transition rounded-none mt-36 md:mt-20 relative">
        <section className="flex flex-col p-4 sm:p-6">
          <header className="mb-4">
            <div className="font-display">
              <h2 className="text-xl sm:text-2xl">New Stuff</h2>
              <p className="text-[#FF31E2] text-sm sm:text-base">
                {storyCount.toLocaleString()} New Stuff!
              </p>
            </div>
          </header>
          <MasonryGrid />
        </section>

        <section className="pb-6 sm:pb-8">
          <header className="p-4 sm:p-6 pb-4">
            <div className="font-display">
              <h2 className="text-xl sm:text-2xl">Nerdrums · Top Boards</h2>
            </div>
          </header>
          <div className="px-4 sm:px-6">
            <BoardGrid limit={6} />
          </div>
        </section>

        <section className="pb-6 sm:pb-8">
          <header className="p-4 sm:p-6 pb-4">
            <div className="font-display">
              <h2 className="text-xl sm:text-2xl">Stories · Lore</h2>
            </div>
          </header>
          <div className="px-4 sm:px-6">
            <MasonryGrid />
          </div>
        </section>

        {/* Only show adverts section if there are adverts */}
        {(adverts.length > 0 || advertsLoading) && (
          <section className="pb-6 sm:pb-8">
            <header className="p-4 sm:p-6 pb-4">
              <div className="font-display">
                <h2 className="text-xl sm:text-2xl">Sponsored</h2>
                <p className="text-[#FF31E2] text-sm sm:text-base">
                  Community Adverts
                </p>
              </div>
            </header>
            <div className="px-4 sm:px-6">
              {advertsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, index) => (
                    <div
                      key={`advert-skeleton-${index}`}
                      className="bg-white/5 border border-white/10 rounded-lg h-64 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adverts.map((advert) => (
                    <AdvertCard
                      key={advert.id}
                      id={advert.id}
                      title={advert.title}
                      content={advert.content}
                      image_url={advert.image_url}
                      link_url={advert.link_url}
                      user={advert.user}
                      formatted_created_at={advert.formatted_created_at}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="flex flex-col sm:flex-row items-center justify-center text-center px-4 sm:px-20 py-6 sm:py-10 text-xs opacity-50 space-y-2 sm:space-y-0 sm:space-x-2">
          <p>Built by Humans, floating in space</p>
          <p className="hidden sm:block">·</p>
          <p>Nerderland Social Arena, 2025</p>
          <span>🛸</span>
        </footer>
      </main>

      <ConnectDialog
        open={showConnectDialog}
        onClose={closeDialog}
        onConnected={handleConnected}
      />
    </>
  );
}
