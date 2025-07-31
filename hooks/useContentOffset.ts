"use client";

import { useState, useEffect } from "react";

export const useContentOffset = () => {
  const [contentOffset, setContentOffset] = useState(0);

  useEffect(() => {
    const updateContentOffset = () => {
      const navbar = document.querySelector("nav");

      if (navbar) {
        setContentOffset(navbar.offsetHeight);
      }
    };

    // Initial measurement
    updateContentOffset();

    // Update on resize
    window.addEventListener("resize", updateContentOffset);

    // Update on scroll (for dynamic height changes)
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(updateContentOffset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", updateContentOffset);
      window.removeEventListener("scroll", handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return contentOffset;
};
