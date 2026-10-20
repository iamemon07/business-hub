"use client";

import { Printer } from "lucide-react";

export function PrintButton({ className = "btn-outline", label = "Print / Save PDF" }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
