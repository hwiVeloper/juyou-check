"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Locate, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import FuelFilter from "@/components/FuelFilter";
import RadiusFilter from "@/components/RadiusFilter";
import StationCard from "@/components/StationCard";
import BottomSheet from "@/components/BottomSheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { FuelCode } from "@/lib/opinet";
import type { Station } from "@/components/KakaoMap";

// 카카오맵은 SSR 불필요
const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

const DEFAULT_LAT = 37.5665; // 서울 시청 (위치 허용 전 기본값)
const DEFAULT_LNG = 126.978;

export default function HomePage() {
  const { latitude, longitude, loading: geoLoading, refetch } = useGeolocation();
  const [stations, setStations] = useState<Station[]>([]);
  const [avgPrice, setAvgPrice] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuel, setFuel] = useState<FuelCode>("B027");
  const [radius, setRadius] = useState(3);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [showFilter, setShowFilter] = useState(false);

  const lat = latitude ?? DEFAULT_LAT;
  const lng = longitude ?? DEFAULT_LNG;

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aroundRes, avgRes] = await Promise.all([
        fetch(`/api/gas/around?lat=${lat}&lng=${lng}&radius=${radius}&prodcd=${fuel}`),
        fetch(`/api/gas/avg-all?prodcd=${fuel}`),
      ]);
      const aroundData = await aroundRes.json();
      const avgData = await avgRes.json();
      setStations(aroundData.stations ?? []);
      if (aroundData.error === "rate_limit") {
        setError("오피넷 API 일일 호출 한도를 초과했습니다. 내일 다시 시도해 주세요.");
      } else if (aroundData.error) {
        setError("주유소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
      // Opinet PRICE 필드는 string으로 반환됨
      const rawPrice = avgData.OIL?.find((o: {PRODCD: string; PRICE: string}) => o.PRODCD === fuel)?.PRICE;
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

  return (
    <div className="relative flex flex-col h-[100dvh] overflow-hidden pb-14">
      {/* 상단 헤더 */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <h1 className="text-lg font-bold text-orange-500">⛽ 주유췍</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="필터"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => { refetch(); fetchStations(); }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* 필터 드롭다운 (헤더 아래) */}
      {showFilter && (
        <div className="absolute top-14 left-0 right-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap gap-3 shadow-sm">
          <FuelFilter value={fuel} onChange={(v) => { setFuel(v); setShowFilter(false); }} />
          <RadiusFilter value={radius} onChange={(v) => { setRadius(v); setShowFilter(false); }} />
        </div>
      )}

      {/* 지도 */}
      <div className="flex-1">
        <KakaoMap
          lat={lat}
          lng={lng}
          stations={stations}
          selectedId={selectedId}
          onMarkerClick={(s) => setSelectedId(s.id)}
        />

        {/* 현위치 버튼 */}
        <button
          onClick={() => { setSelectedId(undefined); refetch(); }}
          className="absolute bottom-56 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="현위치"
        >
          <Locate className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 바텀 시트 */}
      <BottomSheet
        header={
          <div className="flex items-center justify-between gap-2 py-1">
            <FuelFilter value={fuel} onChange={setFuel} />
            <RadiusFilter value={radius} onChange={setRadius} />
          </div>
        }
      >
        {/* 결과 요약 */}
        <div className="px-4 py-2 bg-orange-50 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {loading ? "검색 중..." : `주유소 ${stations.length}개`}
          </span>
          {avgPrice && (
            <span className="text-xs text-gray-500">
              전국 평균 {avgPrice.toLocaleString()}원
            </span>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="px-4 py-6 text-center text-sm text-red-500">{error}</div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && !error && (
          <div className="divide-y divide-gray-100">
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

        {/* 주유소 목록 */}
        {!loading && !error && stations.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            반경 {radius}km 내 주유소가 없습니다.
          </div>
        )}

        {!loading && stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            avgPrice={avgPrice}
            selected={selectedId === station.id}
            onClick={() => setSelectedId(station.id === selectedId ? undefined : station.id)}
          />
        ))}
      </BottomSheet>
    </div>
  );
}
