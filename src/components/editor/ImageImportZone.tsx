"use client";

interface ImageImportZoneProps {
  onPickFiles: () => void;
  compact?: boolean;
}

export function ImageImportZone({ onPickFiles, compact }: ImageImportZoneProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-700 rounded-2xl bg-neutral-950/80 hover:border-neutral-500 transition-colors ${
        compact ? "p-8 max-w-md mx-auto" : "flex-1 m-6 min-h-[280px] p-12"
      }`}
    >
      <p className="text-neutral-200 font-medium mb-2">
        이미지를 붙여넣거나 파일을 놓으세요
      </p>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">
        Ctrl+V로 클립보드 이미지를 붙이거나, 아래에서 파일을 선택해 바로 편집할 수
        있습니다.
      </p>
      <button
        type="button"
        onClick={onPickFiles}
        className="ui-btn-primary px-5 py-2.5 text-sm"
      >
        이미지 파일 선택
      </button>
    </div>
  );
}
