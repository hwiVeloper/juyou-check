"use client";

import { useEffect, useRef, useState } from "react";
import { useAd } from "@/contexts/AdContext";

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className,
}: AdBannerProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [visible, setVisible] = useState(true);
  const { setAdVisible } = useAd();

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      setVisible(false);
      setAdVisible(false);
      return;
    }

    const ins = insRef.current;
    if (!ins) return;

    const observer = new MutationObserver(() => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "filled") {
        setAdVisible(true);
      } else if (status === "unfilled") {
        setVisible(false);
        setAdVisible(false);
      }
    });

    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });

    return () => observer.disconnect();
  }, [setAdVisible]);

  if (!visible) return null;

  return (
    <div className={className}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
}
