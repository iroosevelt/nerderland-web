import { UploadModal } from "@/components/upload/UploadModal";

export default function UploadPage({}: { params: { slug: string } }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-black border border-white/10 transition rounded-none mt-20">
      <main className="container max-w-5xl mx-auto flex justify-center">
        <UploadModal />
      </main>
    </div>
  );
}
