"use client";

import { useState, useEffect } from "react";

export const useNavbarHeight = () => {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    // Initial measurement
    updateNavbarHeight();

    // Update on resize
    window.addEventListener('resize', updateNavbarHeight);
    
    // Update on scroll (for dynamic height changes)
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(updateNavbarHeight);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return navbarHeight;
};