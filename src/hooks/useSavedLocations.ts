"use client";

import { useState, useEffect } from "react";

export type SavedLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

const STORAGE_KEY = "juyou-saved-locations";

export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLocations(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const add = (name: string, lat: number, lng: number) => {
    setLocations((prev) => {
      const next = [
        ...prev,
        { id: Date.now().toString(), name, lat, lng },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const remove = (id: string) => {
    setLocations((prev) => {
      const next = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { locations, add, remove };
}
