"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type SheetState = "collapsed" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

const SNAP = {
  collapsed: "calc(100% - 120px)",
  half: "45%",
  full: "8px",
};

export default function BottomSheet({ children, header }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("half");
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startTop = useRef<number>(0);
  const isDragging = useRef(false);

  const getTopPx = useCallback(() => {
    return sheetRef.current?.getBoundingClientRect().top ?? 0;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startTop.current = getTopPx();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [getTopPx]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const dy = e.clientY - startY.current;
    const newTop = Math.max(8, startTop.current + dy);
    sheetRef.current.style.top = `${newTop}px`;
    sheetRef.current.style.transition = "none";
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dy = e.clientY - startY.current;
    if (sheetRef.current) sheetRef.current.style.transition = "";

    if (dy < -60) {
      // 위로 스와이프
      setState((s) => (s === "collapsed" ? "half" : "full"));
    } else if (dy > 60) {
      // 아래로 스와이프
      setState((s) => (s === "full" ? "half" : "collapsed"));
    } else {
      // 제자리 복귀
      setState((s) => s);
    }
  }, []);

  return (
    <div
      ref={sheetRef}
      style={{ top: SNAP[state] }}
      className={cn(
        "absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl",
        "transition-[top] duration-300 ease-out",
        "flex flex-col z-20"
      )}
    >
      {/* 드래그 핸들 */}
      <div
        className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* 헤더 영역 (유종/반경 필터) */}
      {header && (
        <div className="px-4 pb-2 border-b border-gray-100">{header}</div>
      )}

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </div>
  );
}
