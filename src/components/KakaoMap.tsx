"use client";

import { Map, CustomOverlayMap, useKakaoLoader } from "react-kakao-maps-sdk";
import { MapPin } from "lucide-react";

export interface Station {
  id: string;
  name: string;
  brand: string;
  brandCode: string;
  brandColor: string;
  price: number;
  distance?: number;
  address: string;
  lat: number;
  lng: number;
}

interface KakaoMapProps {
  lat: number;
  lng: number;
  stations: Station[];
  selectedId?: string;
  onMarkerClick?: (station: Station) => void;
}

const BRAND_BG: Record<string, string> = {
  SKE: "#EF4444",
  GSC: "#2563EB",
  HDO: "#60A5FA",
  SOL: "#EAB308",
  RTE: "#16A34A",
  RTX: "#16A34A",
  NHO: "#22C55E",
};

function getBrandBg(code: string) {
  return BRAND_BG[code] ?? "#6B7280";
}

export default function KakaoMap({
  lat,
  lng,
  stations,
  selectedId,
  onMarkerClick,
}: KakaoMapProps) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY!,
  });

  // 선택된 주유소로 지도 중심 이동
  const selectedStation = selectedId ? stations.find((s) => s.id === selectedId) : null;
  const center = selectedStation
    ? { lat: selectedStation.lat, lng: selectedStation.lng }
    : { lat, lng };

  if (error) {
    return (
      <div className="relative w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2">
        <MapPin className="text-gray-300 w-10 h-10" />
        <p className="text-xs text-gray-400 text-center px-4">
          카카오맵을 불러올 수 없습니다.<br />
          카카오 개발자 콘솔에서 도메인을 등록해 주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Map
      center={center}
      isPanto
      style={{ width: "100%", height: "100%" }}
      level={5}
    >
      {stations.map((station) => {
        const isSelected = station.id === selectedId;
        const bg = getBrandBg(station.brandCode);

        return (
          <CustomOverlayMap
            key={station.id}
            position={{ lat: station.lat, lng: station.lng }}
            yAnchor={1.5}
            zIndex={isSelected ? 10 : 1}
          >
            <div
              onClick={() => onMarkerClick?.(station)}
              style={{
                background: isSelected ? bg : "white",
                color: isSelected ? "white" : "#111",
                border: `2px solid ${bg}`,
                borderRadius: "999px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {station.price > 0
                ? `${station.price.toLocaleString()}원`
                : station.name}
            </div>
          </CustomOverlayMap>
        );
      })}
    </Map>
  );
}
