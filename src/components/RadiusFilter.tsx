"use client";

import { cn } from "@/lib/utils";

const RADII = [1, 3, 5];

interface RadiusFilterProps {
  value: number;
  onChange: (value: number) => void;
}

export default function RadiusFilter({ value, onChange }: RadiusFilterProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">반경</span>
      <div className="flex gap-1">
        {RADII.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              value === r
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {r}km
          </button>
        ))}
      </div>
    </div>
  );
}
