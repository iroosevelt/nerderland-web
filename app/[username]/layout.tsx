import { TopBar } from "@/components/navigation/TopBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-35 md:mt-20 h-full container mx-auto max-w-5xl">
      <TopBar />
      {children}
    </div>
  );
}
