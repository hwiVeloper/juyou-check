"use client";

import { MapPin, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Station } from "./KakaoMap";

interface StationCardProps {
  station: Station;
  rank?: number;
  avgPrice?: number;
  selected?: boolean;
  onClick?: () => void;
}

function formatDistance(m?: number) {
  if (!m) return "";
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`;
}

function getPriceDiff(price: number, avg?: number) {
  if (!avg || price <= 0) return null;
  const diff = price - avg;
  if (Math.abs(diff) < 10) return { label: "평균", color: "text-gray-500" };
  return diff < 0
    ? { label: `평균보다 ${Math.round(Math.abs(diff))}원 저렴`, color: "text-emerald-600" }
    : { label: `평균보다 ${Math.round(Math.abs(diff))}원 비쌈`, color: "text-red-500" };
}

export default function StationCard({
  station,
  rank,
  avgPrice,
  selected,
  onClick,
}: StationCardProps) {
  const priceDiff = getPriceDiff(station.price, avgPrice);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
        "border-b border-gray-100 last:border-0",
        selected ? "bg-orange-50" : "hover:bg-gray-50 active:bg-gray-100"
      )}
    >
      {/* 순위 */}
      {rank !== undefined && (
        <span
          className={cn(
            "text-lg font-bold w-6 shrink-0",
            rank === 1 ? "text-orange-500" : rank <= 3 ? "text-amber-500" : "text-gray-400"
          )}
        >
          {rank}
        </span>
      )}

      {/* 브랜드 뱃지 */}
      <div
        className={cn(
          "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-white text-[10px] font-bold",
          station.brandColor
        )}
      >
        {station.brand.slice(0, 2)}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{station.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 truncate">{station.address}</p>
        </div>
        {priceDiff && (
          <p className={cn("text-xs mt-0.5", priceDiff.color)}>{priceDiff.label}</p>
        )}
      </div>

      {/* 가격 + 거리 */}
      <div className="text-right shrink-0">
        <p className="text-base font-bold text-gray-900">
          {station.price > 0 ? station.price.toLocaleString() : "-"}
          <span className="text-xs font-normal text-gray-500">원</span>
        </p>
        {station.distance !== undefined && (
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <Navigation className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{formatDistance(station.distance)}</span>
          </div>
        )}
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 mt-1 border-gray-200 text-gray-500"
        >
          {station.brand}
        </Badge>
      </div>
    </button>
  );
}
