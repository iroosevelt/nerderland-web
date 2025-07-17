// app/(main)/page.tsx
import { Feed } from "@/components/Feed";

export default function Home() {
  return (
    <main className="min-h-screen flex justify-center p-6">
      <Feed />
    </main>
  );
}
