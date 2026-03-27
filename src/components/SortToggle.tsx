"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOrder = "distance" | "price";

interface SortToggleProps {
  value: SortOrder;
  onChange: (v: SortOrder) => void;
}

export default function SortToggle({ value, onChange }: SortToggleProps) {
  return (
    <button
      onClick={() => onChange(value === "distance" ? "price" : "distance")}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0",
        "border border-gray-200 dark:border-gray-700",
        "text-gray-600 dark:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <ArrowUpDown className="w-3.5 h-3.5" />
      {value === "distance" ? "거리순" : "가격순"}
    </button>
  );
}
