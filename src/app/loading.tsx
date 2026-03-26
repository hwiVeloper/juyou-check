export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[100dvh] bg-white">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl animate-bounce">⛽</span>
        <p className="text-sm text-gray-500 font-medium">주유소 정보를 불러오는 중...</p>
      </div>
    </div>
  );
}
