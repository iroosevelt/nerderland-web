import { DropModal } from "@/components/drop/DropModal";

export default function DropPage({ params }: { params: { slug: string } }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-black border border-white/10 transition rounded-none mt-20">
      <main className="container max-w-5xl mx-auto flex justify-center">
        <DropModal slug={params.slug} />
      </main>
    </div>
  );
}
