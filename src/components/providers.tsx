"use client";

import React, { createContext, useContext } from "react";
import { useHeadroom } from "@/hooks/use-headroom";
import { TooltipProvider } from "@/components/ui/tooltip";

type HeadroomContextType = ReturnType<typeof useHeadroom>;

const HeadroomContext = createContext<HeadroomContextType | null>(null);

export function useHeadroomContext() {
  const ctx = useContext(HeadroomContext);
  if (!ctx) throw new Error("useHeadroomContext must be inside HeadroomProvider");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const headroom = useHeadroom();

  return (
    <HeadroomContext.Provider value={headroom}>
      <TooltipProvider>{children}</TooltipProvider>
    </HeadroomContext.Provider>
  );
}
