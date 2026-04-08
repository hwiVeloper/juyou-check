"use client";

import Link from "next/link";
import { MapPin, Navigation, Heart, Share2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { event as gtagEvent } from "@/lib/gtag";
import type { Station } from "./KakaoMap";

interface StationCardProps {
  station: Station;
  rank?: number;
  avgPrice?: number;
  selected?: boolean;
  onClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onShare?: () => void;
  /** 방문기록 탭에서 방문 시각 표시용 */
  visitedAt?: number;
}

function formatDistance(m?: number) {
  if (!m) return "";
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`;
}

function formatVisitedAt(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getPriceDiff(price: number, avg?: number) {
  if (!avg || price <= 0) return null;
  const diff = price - avg;
  if (Math.abs(diff) < 10) return { label: "평균", color: "text-gray-500" };
  return diff < 0
    ? {
        label: `평균보다 ${Math.round(Math.abs(diff))}원 저렴`,
        color: "text-emerald-600",
      }
    : {
        label: `평균보다 ${Math.round(Math.abs(diff))}원 비쌈`,
        color: "text-red-500",
      };
}

export default function StationCard({
  station,
  rank,
  avgPrice,
  selected,
  onClick,
  isFavorite = false,
  onFavoriteToggle,
  onShare,
  visitedAt,
}: StationCardProps) {
  const priceDiff = getPriceDiff(station.price, avgPrice);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={cn(
        "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer",
        "border-b border-gray-100 dark:border-gray-800 last:border-0",
        selected
          ? "bg-orange-50 dark:bg-orange-950/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800"
      )}
    >
      {/* 순위 */}
      {rank !== undefined && (
        <span
          className={cn(
            "text-lg font-bold w-6 shrink-0",
            rank === 1
              ? "text-orange-500"
              : rank <= 3
                ? "text-amber-500"
                : "text-gray-400"
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
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
          {station.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {station.address}
          </p>
        </div>
        {priceDiff && (
          <p className={cn("text-xs mt-0.5", priceDiff.color)}>
            {priceDiff.label}
          </p>
        )}
      </div>

      {/* 가격 + 액션 버튼 */}
      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
        <p className="text-base font-bold text-gray-900 dark:text-gray-100">
          {station.price > 0 ? station.price.toLocaleString() : "-"}
          <span className="text-xs font-normal text-gray-500">원</span>
        </p>

        {visitedAt !== undefined ? (
          <span className="text-xs text-gray-400">
            {formatVisitedAt(visitedAt)}
          </span>
        ) : station.distance !== undefined ? (
          <div className="flex items-center justify-end gap-0.5">
            <Navigation className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatDistance(station.distance)}
            </span>
          </div>
        ) : null}

        {/* 액션 아이콘 버튼 행 */}
        <div className="flex items-center gap-0.5 mt-0.5">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
          >
            {station.brand}
          </Badge>

          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="공유"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}

          {onFavoriteToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                )}
              />
            </button>
          )}

          {/* 상세보기 (Info 아이콘) */}
          <Link
            href={`/station/${station.id}`}
            onClick={(e) => {
              e.stopPropagation();
              gtagEvent("view_station", {
                station_id: station.id,
                station_name: station.name,
              });
            }}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="상세보기"
          >
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
