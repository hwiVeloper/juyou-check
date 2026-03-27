"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StationCard from "@/components/StationCard";
import type { FuelCode } from "@/lib/opinet";
import type { Station } from "@/components/KakaoMap";

const FUELS: { code: FuelCode; label: string }[] = [
  { code: "B027", label: "휘발유" },
  { code: "D047", label: "경유" },
  { code: "C004", label: "LPG" },
  { code: "B034", label: "고급휘발유" },
];

interface AreaItem {
  AREA_CD: string;
  AREA_NM: string;
}

interface RankedStation extends Station {
  rank: number;
}

export default function Top10Page() {
  const [fuel, setFuel] = useState<FuelCode>("B027");
  const [sidoArea, setSidoArea] = useState("__all__");
  const [sigunArea, setSigunArea] = useState("__all__");
  const [sidoList, setSidoList] = useState<AreaItem[]>([]);
  const [sigunList, setSigunList] = useState<AreaItem[]>([]);
  const [stations, setStations] = useState<RankedStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gas/codes/sido")
      .then((r) => r.json())
      .then((d) => setSidoList(d.OIL ?? []));
  }, []);

  useEffect(() => {
    setSigunArea("__all__");
    setSigunList([]);
    if (sidoArea === "__all__") return;
    fetch(`/api/gas/codes/sigun?sidocd=${sidoArea}`)
      .then((r) => r.json())
      .then((d) => setSigunList(d.OIL ?? []));
  }, [sidoArea]);

  useEffect(() => {
    setLoading(true);
    const sido = sidoArea === "__all__" ? "" : sidoArea;
    const sigun = sigunArea === "__all__" ? "" : sigunArea;
    const area = sigun || sido;

    fetch(`/api/gas/top10?prodcd=${fuel}&area=${area}&cnt=10`)
      .then((r) => r.json())
      .then((d) => setStations(d.stations ?? []))
      .finally(() => setLoading(false));
  }, [fuel, sidoArea, sigunArea]);

  const selectedSidoNm =
    sidoArea === "__all__"
      ? "전국"
      : (sidoList.find((s) => s.AREA_CD === sidoArea)?.AREA_NM ?? "전국");
  const selectedSigunNm =
    sigunArea === "__all__"
      ? undefined
      : sigunList.find((s) => s.AREA_CD === sigunArea)?.AREA_NM;

  return (
    <div className="min-h-[100dvh] pb-20 bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-orange-500" />
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">
            최저가 TOP 10
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {[selectedSidoNm, selectedSigunNm].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>

      {/* 필터 */}
      <div className="px-4 pt-4 flex gap-2 flex-wrap">
        {/* 유종 */}
        <Select value={fuel} onValueChange={(v) => setFuel(v as FuelCode)}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUELS.map((f) => (
              <SelectItem key={f.code} value={f.code}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 시도 */}
        <Select
          value={sidoArea}
          onValueChange={(v) => {
            setSidoArea(v);
            setSigunArea("__all__");
          }}
        >
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="전국" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="__all__">전국</SelectItem>
            {sidoList.map((s) => (
              <SelectItem key={s.AREA_CD} value={s.AREA_CD}>
                {s.AREA_NM}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 시군구 — 시도 선택 후 표시 */}
        {sidoArea !== "__all__" && sigunList.length > 0 && (
          <Select value={sigunArea} onValueChange={setSigunArea}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="__all__">전체</SelectItem>
              {sigunList.map((s) => (
                <SelectItem key={s.AREA_CD} value={s.AREA_CD}>
                  {s.AREA_NM}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 목록 */}
      <div className="mt-4 bg-white dark:bg-gray-900 mx-0 rounded-none shadow-sm border-t border-b border-gray-100 dark:border-gray-800">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : stations.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            데이터가 없습니다.
          </p>
        ) : (
          stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              rank={station.rank}
            />
          ))
        )}
      </div>

      <p className="text-xs text-center text-gray-400 py-4">
        데이터 출처: 오피넷(한국석유공사)
      </p>
    </div>
  );
}
