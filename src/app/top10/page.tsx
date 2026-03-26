"use client";

import { useState, useEffect } from "react";
import { Trophy, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface SidoItem {
  SIDONM: string;
  SIDOCD: string;
}

interface SigunItem {
  SIGUNM: string;
  SIGUNCD: string;
}

interface SigunPrice {
  SIGUNM: string;
  SIGUNCD: string;
  PRICE: number | string;
}

interface RankedStation extends Station {
  rank: number;
}

interface RankedSigun {
  rank: number;
  name: string;
  price: number;
}

export default function Top10Page() {
  const [fuel, setFuel] = useState<FuelCode>("B027");
  const [sido, setSido] = useState("01");
  const [sigun, setSigun] = useState("");
  const [sidoList, setSidoList] = useState<SidoItem[]>([]);
  const [sigunList, setSigunList] = useState<SigunItem[]>([]);
  const [stations, setStations] = useState<RankedStation[]>([]);
  const [sigunRanking, setSigunRanking] = useState<RankedSigun[]>([]);
  const [loading, setLoading] = useState(true);

  // 시도 코드 목록 로드
  useEffect(() => {
    fetch("/api/gas/codes/sido")
      .then((r) => r.json())
      .then((d) => setSidoList(d.OIL ?? []));
  }, []);

  // 시도 변경 시 시군구 목록 로드
  useEffect(() => {
    setSigun("");
    setSigunList([]);
    if (!sido || sido === "01") return;
    fetch(`/api/gas/codes/sigun?sidocd=${sido}`)
      .then((r) => r.json())
      .then((d) => setSigunList(d.OIL ?? []));
  }, [sido]);

  // 데이터 패치: 시군구 미선택 → TOP10, 선택 → 시군구별 평균가 순위
  useEffect(() => {
    setLoading(true);

    if (sigun) {
      // 시군구별 평균가 순위
      fetch(`/api/gas/avg-sigun?prodcd=${fuel}&sidocd=${sido}`)
        .then((r) => r.json())
        .then((d) => {
          const ranked: RankedSigun[] = (d.OIL ?? [] as SigunPrice[])
            .map((item: SigunPrice) => ({
              name: item.SIGUNM,
              price: Number(item.PRICE) || 0,
            }))
            .filter((item: { name: string; price: number }) => item.price > 0)
            .sort((a: { name: string; price: number }, b: { name: string; price: number }) => a.price - b.price)
            .map((item: { name: string; price: number }, i: number) => ({ ...item, rank: i + 1 }));
          setSigunRanking(ranked);
          setStations([]);
        })
        .finally(() => setLoading(false));
    } else {
      // TOP10 개별 주유소
      fetch(`/api/gas/top10?prodcd=${fuel}&sido=${sido}`)
        .then((r) => r.json())
        .then((d) => {
          setStations(d.stations ?? []);
          setSigunRanking([]);
        })
        .finally(() => setLoading(false));
    }
  }, [fuel, sido, sigun]);

  const showSigunMode = !!sigun;

  return (
    <div className="min-h-[100dvh] pb-20 bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-orange-500" />
        <h1 className="text-base font-bold text-gray-900">최저가 TOP 10</h1>
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
              <SelectItem key={f.code} value={f.code}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 시도 */}
        <Select value={sido} onValueChange={(v) => { setSido(v); setSigun(""); }}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="01">전국</SelectItem>
            {sidoList.map((s) => (
              <SelectItem key={s.SIDOCD} value={s.SIDOCD}>{s.SIDONM}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 시군구 — 시도 선택 후 표시 */}
        {sido !== "01" && sigunList.length > 0 && (
          <Select value={sigun} onValueChange={setSigun}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="시군구 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {sigunList.map((s) => (
                <SelectItem key={s.SIGUNCD} value={s.SIGUNCD}>{s.SIGUNM}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 모드 설명 */}
      {showSigunMode && (
        <div className="mx-4 mt-3 px-3 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-600">
            시군구별 평균가 순위입니다. 개별 주유소 TOP10은 시군구를 &apos;전체&apos;로 선택하세요.
          </p>
        </div>
      )}

      <div className="mt-4 bg-white mx-0 rounded-none shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-6 h-6 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : showSigunMode ? (
          // 시군구별 평균가 순위
          sigunRanking.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">데이터가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sigunRanking.map((item) => (
                <div key={item.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0
                    ${item.rank <= 3 ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">평균가</p>
                  </div>
                  <span className="text-sm font-bold text-orange-500">
                    {item.price.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          )
        ) : (
          // TOP10 개별 주유소
          stations.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">데이터가 없습니다.</p>
          ) : (
            stations.map((station) => (
              <StationCard key={station.id} station={station} rank={station.rank} />
            ))
          )
        )}
      </div>

      <p className="text-xs text-center text-gray-400 py-4">데이터 출처: 오피넷(한국석유공사)</p>
    </div>
  );
}
