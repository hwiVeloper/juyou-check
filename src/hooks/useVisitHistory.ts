"use client";

import { useState, useEffect } from "react";

export interface VisitRecord {
  id: string;
  name: string;
  brand: string;
  brandColor: string;
  address: string;
  price: number;
  fuelCode: string;
  visitedAt: number;
}

const MAX_HISTORY = 50;
const STORAGE_KEY = "juyou-history";

export function useVisitHistory() {
  // 항상 빈 배열로 초기화 → SSR과 클라이언트 hydration 불일치 방지
  const [history, setHistory] = useState<VisitRecord[]>([]);

  // 마운트 후 localStorage 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const addVisit = (record: Omit<VisitRecord, "visitedAt">) => {
    setHistory((prev) => {
      // 중복 제거 후 최신 기록으로 갱신
      const filtered = prev.filter((r) => r.id !== record.id);
      const next = [
        { ...record, visitedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addVisit, clearHistory };
}
