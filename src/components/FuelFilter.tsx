"use client";

import { cn } from "@/lib/utils";
import type { FuelCode } from "@/lib/opinet";

const FUELS: { code: FuelCode; label: string }[] = [
  { code: "B027", label: "휘발유" },
  { code: "D047", label: "경유" },
  { code: "C004", label: "LPG" },
  { code: "B034", label: "고급휘발유" },
];

interface FuelFilterProps {
  value: FuelCode;
  onChange: (value: FuelCode) => void;
}

export default function FuelFilter({ value, onChange }: FuelFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
      {FUELS.map((fuel) => (
        <button
          key={fuel.code}
          onClick={() => onChange(fuel.code)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            value === fuel.code
              ? "bg-orange-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
        >
          {fuel.label}
        </button>
      ))}
    </div>
  );
}
