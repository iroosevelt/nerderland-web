"use client";
import { useModalStore } from "./useModalStore";
import { motion, AnimatePresence } from "framer-motion";
import { NerdModalFrame } from "./NerdModalFrame";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NerdModal() {
  const { isOpen, content, close } = useModalStore();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        router.back();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, router]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed overflow-auto inset-0 z-50 bg-[#141415]/60 flex items-center justify-center p-4 md:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.2 }}
          >
            <NerdModalFrame>{content}</NerdModalFrame>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
