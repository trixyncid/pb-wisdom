"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getCroppedDataUrl(
  imageSrc: string,
  crop: Area,
  size = 512,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = url;
  });
}

export function SquareImageUpload({
  value,
  onChange,
  initials = "P",
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  initials?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setCroppedArea(area);
  }, []);

  function onFile(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function applyCrop() {
    if (!raw || !croppedArea) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedDataUrl(raw, croppedArea);
      onChange(dataUrl);
      setRaw(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-28 w-28 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2eb6ea]"
        aria-label="Upload foto profil"
      >
        <span className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-[#2eb6ea]/30 shadow-[0_12px_30px_rgba(46,182,234,0.25)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[#e8f3fb] text-2xl font-black text-[#0b2a4a]">
              {initials.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <span className="absolute -bottom-1 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#2eb6ea] text-white shadow-md">
          <Camera className="h-4 w-4" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {raw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b2a4a]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white p-4 shadow-2xl">
            <p className="mb-3 text-sm font-bold text-[#0b2a4a]">
              Crop foto 1:1
            </p>
            <div className="relative h-72 overflow-hidden rounded-2xl bg-slate-900">
              <Cropper
                image={raw}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-3">
              <label className="text-xs font-bold text-slate-500">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 w-full accent-[#2eb6ea]"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRaw(null)}
              >
                Batal
              </Button>
              <Button type="button" onClick={applyCrop} disabled={busy}>
                {busy ? "Memproses…" : "Pakai foto"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
