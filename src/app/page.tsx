"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Locate, RefreshCw, Heart, Clock, LayoutList } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useFavorites } from "@/hooks/useFavorites";
import { useVisitHistory } from "@/hooks/useVisitHistory";
import FuelFilter from "@/components/FuelFilter";
import RadiusFilter from "@/components/RadiusFilter";
import SortToggle, { type SortOrder } from "@/components/SortToggle";
import BrandFilter from "@/components/BrandFilter";
import ThemeToggle from "@/components/ThemeToggle";
import StationCard from "@/components/StationCard";
import BottomSheet from "@/components/BottomSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FuelCode } from "@/lib/opinet";
import type { Station } from "@/components/KakaoMap";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

type TabType = "all" | "favorites" | "history";

export default function HomePage() {
  const {
    latitude,
    longitude,
    loading: geoLoading,
    refetch,
  } = useGeolocation();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const { history, addVisit } = useVisitHistory();

  const [stations, setStations] = useState<Station[]>([]);
  const [avgPrice, setAvgPrice] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuel, setFuel] = useState<FuelCode>("B027");
  const [radius, setRadius] = useState(3);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<SortOrder>("distance");
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lat = latitude ?? DEFAULT_LAT;
  const lng = longitude ?? DEFAULT_LNG;

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedBrands(new Set()); // 새 검색 시 브랜드 필터 초기화
    try {
      const [aroundRes, avgRes] = await Promise.all([
        fetch(
          `/api/gas/around?lat=${lat}&lng=${lng}&radius=${radius}&prodcd=${fuel}`
        ),
        fetch(`/api/gas/avg-all?prodcd=${fuel}`),
      ]);
      const aroundData = await aroundRes.json();
      const avgData = await avgRes.json();
      setStations(aroundData.stations ?? []);
      if (aroundData.error === "rate_limit") {
        setError(
          "오피넷 API 일일 호출 한도를 초과했습니다. 내일 다시 시도해 주세요."
        );
      } else if (aroundData.error) {
        setError(
          "주유소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
      }
      const rawPrice = avgData.OIL?.find(
        (o: { PRODCD: string; PRICE: string }) => o.PRODCD === fuel
      )?.PRICE;
      setAvgPrice(rawPrice ? Number(rawPrice) : undefined);
    } catch {
      setError("주유소 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius, fuel]);

  useEffect(() => {
    if (!geoLoading) fetchStations();
  }, [geoLoading, fetchStations]);

  // 브랜드 목록 (현재 검색 결과 기준)
  const availableBrands = [...new Set(stations.map((s) => s.brand))].sort();

  // 필터 + 정렬 파이프라인
  let displayedStations = [...stations];

  // 브랜드 필터
  if (selectedBrands.size > 0) {
    displayedStations = displayedStations.filter((s) =>
      selectedBrands.has(s.brand)
    );
  }

  // 정렬 (명시적으로 두 경우 모두 처리)
  if (sortOrder === "price") {
    displayedStations = [...displayedStations].sort(
      (a, b) => (a.price || Infinity) - (b.price || Infinity)
    );
  } else {
    // 거리순: distance 오름차순 (API가 정렬해서 주지만 필터 후 재정렬 보장)
    displayedStations = [...displayedStations].sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
    );
  }

  // 탭 필터
  if (activeTab === "favorites") {
    displayedStations = displayedStations.filter((s) => isFavorite(s.id));
  }

  const handleShare = async (station: Station) => {
    const text = `${station.name} - ${station.price.toLocaleString()}원/L\n${station.address}`;
    const url = `${window.location.origin}/station/${station.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, text, url });
      } catch {
        /* 취소 */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopiedId(station.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        /* 실패 */
      }
    }
  };

  const handleCardClick = (station: Station) => {
    setSelectedId(station.id === selectedId ? undefined : station.id);
    addVisit({
      id: station.id,
      name: station.name,
      brand: station.brand,
      brandColor: station.brandColor,
      address: station.address,
      price: station.price,
      fuelCode: fuel,
    });
  };

  // 방문기록 탭: localStorage 기록 전체 (현재 검색 반경 무관)
  const historyStations: (Station & { visitedAt: number })[] = history.map(
    (r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      brandCode: "",
      brandColor: r.brandColor,
      price: r.price,
      address: r.address,
      lat: 0,
      lng: 0,
      visitedAt: r.visitedAt,
    })
  );

  const tabItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
    {
      key: "all",
      label: "전체",
      icon: <LayoutList className="w-3.5 h-3.5" />,
    },
    {
      key: "favorites",
      label: "즐겨찾기",
      icon: <Heart className="w-3.5 h-3.5" />,
    },
    {
      key: "history",
      label: "방문기록",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
  ];

  return (
    // relative: 클립보드 토스트 위치 기준
    <div className="relative flex flex-col h-[100dvh] overflow-hidden pb-14">
      {/* ── 헤더 (flex flow, not absolute) ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-10">
        <h1 className="text-lg font-bold text-orange-500">⛽ 주유췤</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => {
              refetch();
              fetchStations();
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* ── 지도 (flex-1, min-h로 최소 크기 보장) ── */}
      <div className="relative flex-1 min-h-[180px]">
        {/* KakaoMap이 absolute로 꽉 채움 */}
        <div className="absolute inset-0">
          <KakaoMap
            lat={lat}
            lng={lng}
            stations={stations}
            selectedId={selectedId}
            onMarkerClick={(s) => setSelectedId(s.id)}
          />
        </div>

        {/* 현위치 버튼 */}
        <button
          onClick={() => {
            setSelectedId(undefined);
            refetch();
          }}
          className="absolute bottom-4 right-4 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="현위치"
        >
          <Locate className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* 클립보드 복사 토스트 */}
      {copiedId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          클립보드에 복사됨
        </div>
      )}

      {/* ── 바텀 시트 (flex flow — 시트가 커질수록 지도가 줄어듦) ── */}
      <BottomSheet
        header={
          <div>
            {/* Row 1: 연료/반경 필터 + 정렬 */}
            <div className="flex items-center justify-between gap-2 py-1">
              <FuelFilter value={fuel} onChange={setFuel} />
              <RadiusFilter value={radius} onChange={setRadius} />
              <SortToggle value={sortOrder} onChange={setSortOrder} />
            </div>

            {/* Row 2: 브랜드 필터 */}
            <BrandFilter
              brands={availableBrands}
              selected={selectedBrands}
              onChange={setSelectedBrands}
            />

            {/* Row 3: 탭 */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 mt-1">
              {tabItems.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                    activeTab === key
                      ? "text-orange-500 border-b-2 border-orange-500"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  {icon}
                  {label}
                  {key === "favorites" && favorites.size > 0 && (
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-500 px-1 rounded-full">
                      {favorites.size}
                    </span>
                  )}
                  {key === "history" && history.length > 0 && (
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1 rounded-full">
                      {history.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {/* 결과 요약 */}
        {activeTab !== "history" && (
          <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/20 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {loading
                ? "검색 중..."
                : `주유소 ${displayedStations.length}개`}
            </span>
            {avgPrice && (
              <span className="text-xs text-gray-500">
                전국 평균 {avgPrice.toLocaleString()}원
              </span>
            )}
          </div>
        )}

        {/* 에러 */}
        {error && activeTab !== "history" && (
          <div className="px-4 py-6 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && !error && activeTab !== "history" && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        )}

        {/* 방문기록 탭 */}
        {activeTab === "history" && (
          <>
            {historyStations.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                방문한 주유소가 없습니다.
              </div>
            ) : (
              historyStations.map((station) => (
                <StationCard
                  key={`${station.id}-${station.visitedAt}`}
                  station={station}
                  selected={selectedId === station.id}
                  onClick={() =>
                    setSelectedId(
                      station.id === selectedId ? undefined : station.id
                    )
                  }
                  isFavorite={isFavorite(station.id)}
                  onFavoriteToggle={() => toggleFavorite(station.id)}
                  onShare={() => handleShare(station)}
                  visitedAt={station.visitedAt}
                />
              ))
            )}
          </>
        )}

        {/* 전체 / 즐겨찾기 탭 */}
        {activeTab !== "history" && !loading && !error && (
          <>
            {displayedStations.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                {activeTab === "favorites"
                  ? "즐겨찾기한 주유소가 없습니다."
                  : `반경 ${radius}km 내 주유소가 없습니다.`}
              </div>
            ) : (
              displayedStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  avgPrice={avgPrice}
                  selected={selectedId === station.id}
                  onClick={() => handleCardClick(station)}
                  isFavorite={isFavorite(station.id)}
                  onFavoriteToggle={() => toggleFavorite(station.id)}
                  onShare={() => handleShare(station)}
                />
              ))
            )}
          </>
        )}
      </BottomSheet>
    </div>
  );
}
