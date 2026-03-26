"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
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

interface RankedStation extends Station {
  rank: number;
}

export default function Top10Page() {
  const [fuel, setFuel] = useState<FuelCode>("B027");
  const [sido, setSido] = useState("01");
  const [sidoList, setSidoList] = useState<SidoItem[]>([]);
  const [stations, setStations] = useState<RankedStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gas/codes/sido")
      .then((r) => r.json())
      .then((d) => setSidoList(d.OIL ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gas/top10?prodcd=${fuel}&sido=${sido}`)
      .then((r) => r.json())
      .then((d) => setStations(d.stations ?? []))
      .finally(() => setLoading(false));
  }, [fuel, sido]);

  return (
    <div className="min-h-[100dvh] pb-20 bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-orange-500" />
        <h1 className="text-base font-bold text-gray-900">최저가 TOP 10</h1>
      </header>

      <div className="px-4 pt-4 flex gap-2">
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
        <Select value={sido} onValueChange={setSido}>
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
      </div>

      <div className="mt-4 bg-white mx-0 rounded-none shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-100">
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
          <p className="py-16 text-center text-sm text-gray-400">데이터가 없습니다.</p>
        ) : (
          stations.map((station) => (
            <StationCard key={station.id} station={station} rank={station.rank} />
          ))
        )}
      </div>

      <p className="text-xs text-center text-gray-400 py-4">데이터 출처: 오피넷(한국석유공사)</p>
    </div>
  );
}
