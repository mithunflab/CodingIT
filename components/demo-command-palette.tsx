"use client"

import { useState } from "react";
import { CommandPalette } from "@/components/ui/command-palette"; // Ensure this path and export are correct

export function DemoCommandPaletteShadcn() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        Open Command Palette
      </button>
      
      {isOpen && <CommandPalette />}
    </>
  );
}

export default DemoCommandPaletteShadcn;