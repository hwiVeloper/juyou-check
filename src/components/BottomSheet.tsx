"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SheetState = "collapsed" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

/**
 * 스냅 높이 (절대 top 대신 height 기반).
 * 외부 레이아웃에서 지도 아래에 flex child로 배치되므로
 * 시트가 커질수록 지도가 줄어들고, 지도에는 min-h가 적용됨.
 *
 * full = 100dvh에서 (헤더 ~52px + 바텀내비 56px + 지도 최소 180px) 제외
 */
const SNAP_H: Record<SheetState, string> = {
  collapsed: "7.5rem",            // 120px — 드래그 핸들 + 필터 헤더만
  half: "55vh",                   // 편안한 절반 뷰
  full: "calc(100dvh - 18rem)",   // ~288px 여백 → 지도 약 200px 확보
};

export default function BottomSheet({ children, header }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("half");
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startH = useRef(0);
  const isDragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startH.current = sheetRef.current?.offsetHeight ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    // 위로 드래그(dy < 0) → 시트 높아짐, 아래(dy > 0) → 낮아짐
    const dy = e.clientY - startY.current;
    const newH = Math.max(80, startH.current - dy);
    sheetRef.current.style.height = `${newH}px`;
    sheetRef.current.style.transition = "none";
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dy = e.clientY - startY.current;
    if (sheetRef.current) sheetRef.current.style.transition = "";

    if (dy < -60) {
      setState((s) => (s === "collapsed" ? "half" : "full"));
    } else if (dy > 60) {
      setState((s) => (s === "full" ? "half" : "collapsed"));
    } else {
      // 제자리 복귀: 재렌더로 style 높이 복원
      setState((s) => s);
    }
  };

  return (
    <div
      ref={sheetRef}
      style={{ height: SNAP_H[state] }}
      className={cn(
        "shrink-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl",
        "transition-[height] duration-300 ease-out",
        "flex flex-col"
      )}
    >
      {/* 드래그 핸들 */}
      <div
        className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>

      {/* 헤더 영역 */}
      {header && (
        <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
          {header}
        </div>
      )}

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </div>
  );
}
