"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Car, Wrench, ShoppingBag, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

export default function StationDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="min-h-[100dvh] pb-20 bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900 truncate">
          {loading ? "불러오는 중..." : (station?.name ?? "주유소 정보")}
        </h1>
      </header>

      {error && (
        <div className="px-4 py-12 text-center text-sm text-red-500">{error}</div>
      )}

      {loading && !error && (
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {station && (
        <div className="px-4 pt-4 space-y-3">
          {/* 카카오맵 임베드 */}
          <Card className="overflow-hidden p-0">
            <iframe
              src={`https://map.kakao.com/link/map/${encodeURIComponent(station.name)},${station.lat},${station.lng}`}
              className="w-full h-48 border-0"
              title="주유소 위치"
            />
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
          <Card className="p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className={cn("shrink-0 px-2 py-0.5 rounded text-xs text-white font-bold", station.brandColor)}>
                {station.brand}
              </span>
              <h2 className="text-base font-bold text-gray-900">{station.name}</h2>
            </div>
            {station.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{station.address}</span>
              </div>
            )}
            {station.tel && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <a href={`tel:${station.tel}`} className="text-blue-600">{station.tel}</a>
              </div>
            )}
          </Card>

          {/* 유종별 가격 */}
          {station.prices.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">유종별 가격</h3>
              <div className="space-y-2">
                {station.prices.filter((p) => p.price > 0).map((p) => (
                  <div key={p.code} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{p.name}</span>
                    <span className="text-base font-bold text-gray-900">
                      {p.price.toLocaleString()}
                      <span className="text-xs font-normal text-gray-400">원/L</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 부가 서비스 */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">부가 서비스</h3>
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
                    available ? "bg-orange-50 text-orange-700" : "bg-gray-50 text-gray-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {!available && <span className="ml-auto text-xs">미운영</span>}
                </div>
              ))}
            </div>
          </Card>

          <p className="text-xs text-center text-gray-400 pb-2">데이터 출처: 오피넷(한국석유공사)</p>
        </div>
      )}
    </div>
  );
}
