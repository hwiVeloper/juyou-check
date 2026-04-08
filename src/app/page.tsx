"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Locate, RefreshCw, Heart, Clock, LayoutList, MapPinPlus, Search, Trash2 } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useFavorites } from "@/hooks/useFavorites";
import { useVisitHistory } from "@/hooks/useVisitHistory";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import FuelFilter from "@/components/FuelFilter";
import RadiusFilter from "@/components/RadiusFilter";
import SortToggle, { type SortOrder } from "@/components/SortToggle";
import BrandFilter from "@/components/BrandFilter";
import ThemeToggle from "@/components/ThemeToggle";
import StationCard from "@/components/StationCard";
import BottomSheet from "@/components/BottomSheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { event as gtagEvent } from "@/lib/gtag";
import { useAd } from "@/contexts/AdContext";
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
  const { locations, add: addLocation, remove: removeLocation } = useSavedLocations();
  const { adVisible } = useAd();

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

  // 현재 검색 기준 위치
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  // 지도 드래그 후 아직 확정되지 않은 위치
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number } | null>(null);

  // 저장된 위치 Dialog 상태
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationName, setLocationName] = useState("");

  // 지오로케이션 완료 시 searchCenter 동기화
  useEffect(() => {
    if (!geoLoading && latitude != null && longitude != null) {
      setSearchCenter({ lat: latitude, lng: longitude });
    }
  }, [geoLoading, latitude, longitude]);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    gtagEvent("search_station", {
      fuel_type: fuel,
      radius: String(radius),
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
    });
    setError(null);
    setSelectedBrands(new Set()); // 새 검색 시 브랜드 필터 초기화
    try {
      const [aroundRes, avgRes] = await Promise.all([
        fetch(
          `/api/gas/around?lat=${searchCenter.lat}&lng=${searchCenter.lng}&radius=${radius}&prodcd=${fuel}`
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
  }, [searchCenter.lat, searchCenter.lng, radius, fuel]);

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

  const handleSaveCurrentLocation = () => {
    const name = locationName.trim();
    if (!name) return;
    addLocation(name, searchCenter.lat, searchCenter.lng);
    setLocationName("");
    setLocationDialogOpen(false);
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
    <div className={cn("relative flex flex-col h-[100dvh] overflow-hidden", adVisible ? "pb-28" : "pb-14")}>
      {/* ── 헤더 (flex flow, not absolute) ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-10">
        <h1 className="text-lg font-bold text-orange-500">⛽ 주유췤</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* 저장된 위치 관리 버튼 */}
          <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="위치 저장"
              >
                <MapPinPlus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>저장된 위치</DialogTitle>
              </DialogHeader>

              {/* 현재 위치 저장 */}
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">현재 검색 위치를 저장</p>
                <div className="flex gap-2">
                  <div className="flex gap-1.5">
                    {["집", "직장"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setLocationName(preset)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border transition-colors",
                          locationName === preset
                            ? "bg-orange-500 text-white border-orange-500"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="이름 직접 입력"
                    className="flex-1 h-8 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveCurrentLocation()}
                  />
                </div>
                <button
                  onClick={handleSaveCurrentLocation}
                  disabled={!locationName.trim()}
                  className="w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-orange-600 transition-colors"
                >
                  현재 위치 저장
                </button>
              </div>

              {/* 저장된 위치 목록 */}
              {locations.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">저장된 위치</p>
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">📍 {loc.name}</span>
                      <button
                        onClick={() => removeLocation(loc.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

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
            lat={searchCenter.lat}
            lng={searchCenter.lng}
            stations={stations}
            selectedId={selectedId}
            onMarkerClick={(s) => setSelectedId(s.id)}
            onDragEnd={(newLat, newLng) => setPendingCenter({ lat: newLat, lng: newLng })}
          />
        </div>

        {/* 지도 이동 후 "이 지역에서 검색" 버튼 */}
        {pendingCenter && (
          <button
            onClick={() => {
              setSearchCenter(pendingCenter);
              setPendingCenter(null);
            }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-gray-800 shadow-md rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Search className="w-3.5 h-3.5" /> 이 지역에서 검색
          </button>
        )}

        {/* 현위치 버튼 */}
        <button
          onClick={() => {
            setSelectedId(undefined);
            setPendingCenter(null);
            refetch();
            if (latitude != null && longitude != null) {
              setSearchCenter({ lat: latitude, lng: longitude });
            }
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
            {/* Row 0: 저장된 위치 칩 (있을 때만) */}
            {locations.length > 0 && (
              <div className="flex items-center gap-2 pt-1 pb-0.5 overflow-x-auto scrollbar-hide">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSearchCenter({ lat: loc.lat, lng: loc.lng });
                      setPendingCenter(null);
                    }}
                    className="shrink-0 flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
                  >
                    📍 {loc.name}
                  </button>
                ))}
              </div>
            )}

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
