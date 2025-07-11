import { NerdCard } from "@/components/nerd-card";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6">
      <NerdCard
        name="Roosevelt"
        bio="Builder of strange and brilliant things in the shadows."
        avatarUrl="https://i.pravatar.cc/150?u=nerder"
      />
    </main>
  );
}
