"use client";

import { useState, useEffect } from "react";

export function useFavorites() {
  // 항상 빈 Set으로 초기화 → SSR과 클라이언트 hydration 불일치 방지
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 마운트 후 localStorage 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem("juyou-favorites");
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("juyou-favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.has(id);

  return { favorites, toggle, isFavorite };
}
