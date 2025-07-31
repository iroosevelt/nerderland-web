// app/(main)/page.tsx
import { Feed } from "@/components/Feed";

export default function Home() {
  return (
    <main className="min-h-screen md:flex md:justify-center md:p-6">
      <Feed />
    </main>
  );
}
