"use client";

import { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Car, Wrench, ShoppingBag, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Station } from "@/components/KakaoMap";

// 카카오맵 SDK (SSR 비활성화)
const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

// 유종 코드 → 한글명 매핑 (API PRODNM 미제공 시 fallback)
const FUEL_NAME: Record<string, string> = {
  B027: "휘발유",
  D047: "경유",
  C004: "LPG",
  B034: "고급휘발유",
  K015: "등유",
};

interface ServiceInfo {
  carWash: boolean;
  maintenance: boolean;
  convenience: boolean;
  kiosk: boolean;
}

interface PriceInfo {
  code: string;
  name: string;
  price: number;
}

interface StationDetail {
  id: string;
  name: string;
  brand: string;
  brandCode: string;
  brandColor: string;
  address: string;
  tel: string;
  lat: number;
  lng: number;
  services: ServiceInfo;
  prices: PriceInfo[];
}

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/gas/station/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStation(d.station);
      })
      .catch(() => setError("정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const kakaoNavUrl = station
    ? `https://map.kakao.com/link/to/${encodeURIComponent(station.name)},${station.lat},${station.lng}`
    : "#";

  const handleBack = () => {
    // 공유된 링크로 직접 방문한 경우 홈으로, 아니면 뒤로
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // KakaoMap에 전달할 Station 형태
  const mapStation: Station | null = station
    ? {
        id: station.id,
        name: station.name,
        brand: station.brand,
        brandCode: station.brandCode,
        brandColor: station.brandColor,
        price: station.prices.find((p) => p.price > 0)?.price ?? 0,
        address: station.address,
        lat: station.lat,
        lng: station.lng,
      }
    : null;

  return (
    <div className="min-h-[100dvh] pb-32 bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
          {loading ? "불러오는 중..." : (station?.name ?? "주유소 정보")}
        </h1>
      </header>

      {error && (
        <div className="px-4 py-12 text-center text-sm text-red-500">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {station && mapStation && (
        <div className="px-4 pt-4 space-y-3">
          {/* 카카오맵 SDK 지도 */}
          <Card className="overflow-hidden p-0">
            <div className="w-full h-48">
              <KakaoMap
                lat={station.lat}
                lng={station.lng}
                stations={[mapStation]}
                selectedId={station.id}
              />
            </div>
            <div className="p-3">
              <a
                href={kakaoNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm font-semibold text-gray-900 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                카카오맵으로 길찾기
              </a>
            </div>
          </Card>

          {/* 기본 정보 */}
          <Card className="p-4 space-y-2 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "shrink-0 px-2 py-0.5 rounded text-xs text-white font-bold",
                  station.brandColor
                )}
              >
                {station.brand}
              </span>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {station.name}
              </h2>
            </div>
            {station.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{station.address}</span>
              </div>
            )}
            {station.tel && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <a href={`tel:${station.tel}`} className="text-blue-600 dark:text-blue-400">
                  {station.tel}
                </a>
              </div>
            )}
          </Card>

          {/* 유종별 가격 */}
          {station.prices.length > 0 && (
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                유종별 가격
              </h3>
              <div className="space-y-2">
                {station.prices
                  .filter((p) => p.price > 0)
                  .map((p) => (
                    <div
                      key={p.code}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {/* 유종명: 코드 매핑 우선, 없으면 API name 사용 */}
                        {FUEL_NAME[p.code] ?? p.name}
                      </span>
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {p.price.toLocaleString()}
                        <span className="text-xs font-normal text-gray-400">
                          원/L
                        </span>
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* 부가 서비스 */}
          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              부가 서비스
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "세차", icon: Car, available: station.services.carWash },
                { label: "경정비", icon: Wrench, available: station.services.maintenance },
                { label: "편의점", icon: ShoppingBag, available: station.services.convenience },
                { label: "키오스크", icon: Zap, available: station.services.kiosk },
              ].map(({ label, icon: Icon, available }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                    available
                      ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {!available && (
                    <span className="ml-auto text-xs">미운영</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <p className="text-xs text-center text-gray-400 pb-2">
            데이터 출처: 오피넷(한국석유공사)
          </p>
        </div>
      )}
    </div>
  );
}
