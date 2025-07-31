"use client";

import * as React from "react";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "dark" : "dark");
  };

  return (
    <Button
      className="rounded-full w-8 h-8"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      )}
    </Button>
  );
}
