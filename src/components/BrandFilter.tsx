"use client";

import { cn } from "@/lib/utils";

interface BrandFilterProps {
  brands: string[];
  selected: Set<string>;
  onChange: (brands: Set<string>) => void;
}

export default function BrandFilter({
  brands,
  selected,
  onChange,
}: BrandFilterProps) {
  if (brands.length === 0) return null;

  const toggle = (brand: string) => {
    const next = new Set(selected);
    if (next.has(brand)) {
      next.delete(brand);
    } else {
      next.add(brand);
    }
    onChange(next);
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 pb-1.5">
      <button
        onClick={() => onChange(new Set())}
        className={cn(
          "shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
          selected.size === 0
            ? "bg-orange-500 text-white border-orange-500"
            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        전체
      </button>
      {brands.map((brand) => (
        <button
          key={brand}
          onClick={() => toggle(brand)}
          className={cn(
            "shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
            selected.has(brand)
              ? "bg-orange-500 text-white border-orange-500"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {brand}
        </button>
      ))}
    </div>
  );
}
