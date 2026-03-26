"use client";

import { useEffect, useRef, useState } from "react";
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
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

/** SDK 로드 완료까지 폴링 후 callback 실행 */
function waitForKakao(callback: () => void) {
  if (window.kakao?.maps) {
    window.kakao.maps.load(callback);
    return;
  }
  const timer = setInterval(() => {
    if (window.kakao?.maps) {
      clearInterval(timer);
      window.kakao.maps.load(callback);
    }
  }, 200);
  // 10초 후 포기
  setTimeout(() => clearInterval(timer), 10000);
}

export default function KakaoMap({
  lat,
  lng,
  stations,
  selectedId,
  onMarkerClick,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // 지도 초기화 (최초 1회)
  useEffect(() => {
    if (!containerRef.current) return;

    waitForKakao(() => {
      if (!containerRef.current || mapRef.current) return;
      try {
        const center = new window.kakao.maps.LatLng(lat, lng);
        mapRef.current = new window.kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
        });
        setMapLoaded(true);
      } catch {
        setMapError(true);
      }
    });

    // SDK 스크립트 로드 실패 감지 (10초)
    const failTimer = setTimeout(() => {
      if (!mapRef.current) setMapError(true);
    }, 10000);
    return () => clearTimeout(failTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 현재 위치 중심 이동
  useEffect(() => {
    if (!mapRef.current) return;
    const center = new window.kakao.maps.LatLng(lat, lng);
    mapRef.current.panTo(center);
  }, [lat, lng]);

  // 마커(오버레이) 렌더링
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // 이전 오버레이 제거
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    stations.forEach((station) => {
      const pos = new window.kakao.maps.LatLng(station.lat, station.lng);
      const isSelected = station.id === selectedId;
      const bg = getBrandBg(station.brandCode);

      const div = document.createElement("div");
      div.style.cssText = `
        background:${isSelected ? bg : "white"};
        color:${isSelected ? "white" : "#111"};
        border:2px solid ${bg};
        border-radius:999px;
        padding:4px 10px;
        font-size:12px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.2);
        cursor:pointer;
        user-select:none;
      `;
      div.textContent = station.price > 0 ? `${station.price.toLocaleString()}원` : station.name;

      if (onMarkerClick) {
        div.addEventListener("click", () => onMarkerClick(station));
      }

      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: div,
        yAnchor: 1.5,
        zIndex: isSelected ? 10 : 1,
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    });
  }, [mapLoaded, stations, selectedId, onMarkerClick]);

  // 선택 마커로 지도 이동
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const station = stations.find((s) => s.id === selectedId);
    if (!station) return;
    mapRef.current.panTo(new window.kakao.maps.LatLng(station.lat, station.lng));
  }, [selectedId, stations]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div ref={containerRef} className="w-full h-full" />

      {/* SDK 로드 실패 */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 gap-2">
          <MapPin className="text-gray-300 w-10 h-10" />
          <p className="text-xs text-gray-400 text-center px-4">
            카카오맵을 불러올 수 없습니다.<br />
            카카오 개발자 콘솔에서 도메인을 등록해 주세요.
          </p>
        </div>
      )}

      {/* 로딩 중 */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 pointer-events-none">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
