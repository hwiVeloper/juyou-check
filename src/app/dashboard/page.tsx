"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FuelCode } from "@/lib/opinet";

const FUELS: { code: FuelCode; label: string }[] = [
  { code: "B027", label: "휘발유" },
  { code: "D047", label: "경유" },
  { code: "C004", label: "LPG" },
  { code: "B034", label: "고급휘발유" },
];

interface AvgPriceItem {
  PRODCD: string;
  PRODNM: string;
  PRICE: number | string;
  DIFF: number | string;
}

interface SidoPriceItem {
  SIDONM: string;
  SIDOCD: string;
  PRICE: number | string;
}

interface TrendItem {
  TRADE_DT: string;
  PRICE: number;
}

function DiffBadge({ diff }: { diff: number }) {
  if (Math.abs(diff) < 0.1)
    return (
      <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        <Minus className="w-3 h-3 mr-0.5" />보합
      </span>
    );
  return diff > 0 ? (
    <span className="flex items-center text-xs text-red-500">
      <TrendingUp className="w-3 h-3 mr-0.5" />+{diff}원
    </span>
  ) : (
    <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400">
      <TrendingDown className="w-3 h-3 mr-0.5" />{diff}원
    </span>
  );
}

export default function DashboardPage() {
  const [fuel, setFuel] = useState<FuelCode>("B027");
  const [avgAll, setAvgAll] = useState<AvgPriceItem[]>([]);
  const [sido, setSido] = useState<SidoPriceItem[]>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const safe = (p: Promise<Response>) =>
      p.then((r) => r.json()).catch(() => ({ OIL: [] }));
    Promise.all([
      safe(fetch(`/api/gas/avg-all?prodcd=${fuel}`)),
      safe(fetch(`/api/gas/avg-sido?prodcd=${fuel}`)),
      safe(fetch(`/api/gas/trend?prodcd=${fuel}`)),
    ])
      .then(([allData, sidoData, trendData]) => {
        setAvgAll(allData.OIL ?? []);
        setSido(
          (sidoData.OIL ?? []).filter(
            (s: SidoPriceItem) => s.SIDOCD !== "00"
          )
        );
        setTrend(trendData.OIL ?? []);
      })
      .finally(() => setLoading(false));
  }, [fuel]);

  const maxSidoPrice = Math.max(...sido.map((s) => Number(s.PRICE)), 0);
  const minSidoPrice = Math.min(...sido.map((s) => Number(s.PRICE)), Infinity);

  return (
    <div className="min-h-[100dvh] pb-32 bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-orange-500" />
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">유가 현황</h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* 유종 선택 */}
        <Select value={fuel} onValueChange={(v) => setFuel(v as FuelCode)}>
          <SelectTrigger className="w-36 h-9 text-sm">
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

        {/* 전국 평균가 카드 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            전국 평균가
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {FUELS.map((f) => {
                const item = avgAll.find((a) => a.PRODCD === f.code);
                return (
                  <Card
                    key={f.code}
                    className={cn(
                      "p-3 dark:bg-gray-900 dark:border-gray-800",
                      f.code === fuel &&
                        "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                    )}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {f.label}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {item ? Number(item.PRICE).toLocaleString() : "-"}
                      <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                        원
                      </span>
                    </p>
                    {item && <DiffBadge diff={Number(item.DIFF)} />}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* 5일 가격 추이 (간단한 바 차트) */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            최근 5일 추이
          </h2>
          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : trend.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">데이터 없음</p>
            ) : (
              <div className="flex items-end gap-2 h-24">
                {trend.map((t, i) => {
                  const prices = trend.map((x) => Number(x.PRICE));
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  const range = max - min || 1;
                  const price = Number(t.PRICE);
                  const height = ((price - min) / range) * 60 + 20;
                  const isLast = i === trend.length - 1;
                  return (
                    <div
                      key={t.TRADE_DT}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[9px] text-gray-500 dark:text-gray-400">
                        {price.toLocaleString()}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t",
                          isLast
                            ? "bg-orange-400"
                            : "bg-orange-200 dark:bg-orange-900/50"
                        )}
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">
                        {t.TRADE_DT.slice(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        {/* 시도별 평균가 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            시도별 평균가
          </h2>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800 dark:bg-gray-900 dark:border-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : (
              [...sido]
                .sort((a, b) => Number(a.PRICE) - Number(b.PRICE))
                .map((s) => {
                  const price = Number(s.PRICE);
                  return (
                    <div
                      key={s.SIDOCD}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        {price === minSidoPrice && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                            최저
                          </span>
                        )}
                        {price === maxSidoPrice && (
                          <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                            최고
                          </span>
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {s.SIDONM}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          price === minSidoPrice
                            ? "text-emerald-600 dark:text-emerald-400"
                            : price === maxSidoPrice
                              ? "text-red-500 dark:text-red-400"
                              : "text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {price.toLocaleString()}원
                      </span>
                    </div>
                  );
                })
            )}
          </Card>
        </section>

        <p className="text-xs text-center text-gray-400 pb-2">
          데이터 출처: 오피넷(한국석유공사)
        </p>
      </div>
    </div>
  );
}
