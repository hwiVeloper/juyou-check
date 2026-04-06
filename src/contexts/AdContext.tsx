"use client";

import { createContext, useContext, useState } from "react";

interface AdContextValue {
  adVisible: boolean;
  setAdVisible: (v: boolean) => void;
}

const AdContext = createContext<AdContextValue>({
  adVisible: false,
  setAdVisible: () => {},
});

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [adVisible, setAdVisible] = useState(false);
  return (
    <AdContext.Provider value={{ adVisible, setAdVisible }}>
      {children}
    </AdContext.Provider>
  );
}

export function useAd() {
  return useContext(AdContext);
}
