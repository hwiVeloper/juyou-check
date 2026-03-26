"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-[100dvh] bg-white">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <span className="text-4xl">😵</span>
        <p className="text-base font-semibold text-gray-800">오류가 발생했습니다</p>
        <p className="text-sm text-gray-500">{error.message || "알 수 없는 오류입니다."}</p>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    </div>
  );
}
