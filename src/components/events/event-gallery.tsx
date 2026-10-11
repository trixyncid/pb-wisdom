"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ImagePlus, Images, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { addEventPhotoAction, deleteEventPhotoAction } from "@/actions/events";
import { withToast } from "@/lib/with-toast";
import { shrinkImageFile } from "@/lib/shrink-image";
import { Input } from "@/components/ui/input";

// Must stay in sync with the cap in addEventPhotoAction.
const MAX_PHOTO_CHARS = 900_000;

type Photo = {
  id: string;
  src: string;
  caption: string | null;
  uploaderId: string;
  uploaderName: string;
};

export function EventGallery({
  eventId,
  photos,
  currentUserId,
  isAdmin,
}: {
  eventId: string;
  photos: Photo[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const list = [...files];
    let done = 0;
    for (const [i, file] of list.entries()) {
      const label = list.length > 1 ? ` (${i + 1}/${list.length})` : "";
      const id = toast.loading(`Memproses foto${label}…`);
      try {
        const image = await shrinkImageFile(file, MAX_PHOTO_CHARS);
        toast.dismiss(id);
        const res = await withToast(addEventPhotoAction(eventId, image, caption || undefined), {
          loading: `Mengupload foto${label}…`,
          success: list.length > 1 ? `Foto${label} ditambahkan` : "Foto ditambahkan ke album",
        });
        if (res.ok) done += 1;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses foto", { id });
      }
    }
    if (done > 0) setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  function remove(photo: Photo) {
    if (!window.confirm("Hapus foto ini dari album?")) return;
    start(async () => {
      const res = await withToast(deleteEventPhotoAction(photo.id), { success: "Foto dihapus" });
      if (res.ok) setOpen(null);
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl font-bold text-navy">Album</h2>
        <span className="text-sm text-navy/50">{photos.length} foto</span>
      </div>

      <div className="flex flex-col gap-2 rounded-[26px] border border-white bg-white/90 p-3 shadow-[0_10px_28px_rgba(14,44,60,0.06)]">
        <Input
          aria-label="Caption foto (opsional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (opsional)"
          maxLength={140}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id={`photo-${eventId}`}
          onChange={(e) => upload(e.target.files)}
        />
        <label
          htmlFor={`photo-${eventId}`}
          aria-disabled={busy}
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-navy text-sm font-bold text-white shadow-[0_10px_22px_rgba(14,44,60,0.22)] transition hover:bg-navy-2 aria-disabled:pointer-events-none aria-disabled:opacity-60"
        >
          <ImagePlus className="size-4" /> {busy ? "Mengupload…" : "Tambah foto"}
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[26px] border border-dashed border-navy/15 px-6 py-10 text-center">
          <Images className="size-7 text-navy/30" />
          <p className="text-sm text-slate-500">Belum ada foto. Jadi yang pertama!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p, i) => (
            <figure key={p.id} className="relative overflow-hidden rounded-[22px] bg-sand">
              <button type="button" onClick={() => setOpen(i)} className="block aspect-square w-full" aria-label={`Lihat foto ${i + 1}${p.caption ? `: ${p.caption}` : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.caption ?? ""} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </button>
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-semibold text-white">
                {p.caption ? <span className="block truncate">{p.caption}</span> : null}
                <span className="block truncate opacity-75">oleh {p.uploaderName}</span>
              </figcaption>
              {(isAdmin || p.uploaderId === currentUserId) && (
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label="Hapus foto"
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-navy/60 shadow transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </figure>
          ))}
        </div>
      )}

      <Lightbox photos={photos} index={open} onIndex={setOpen} />
    </section>
  );
}

function Lightbox({ photos, index, onIndex }: { photos: Photo[]; index: number | null; onIndex: (i: number | null) => void }) {
  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, onIndex, photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, go, onIndex]);

  const photo = index !== null ? photos[index] : null;
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Foto album"
          className="fixed inset-0 z-[100] flex flex-col bg-navy/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between p-4 pt-[max(16px,env(safe-area-inset-top))] text-white">
            <span className="text-sm font-semibold">
              {index! + 1} / {photos.length}
            </span>
            <button type="button" onClick={() => onIndex(null)} aria-label="Tutup" className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={photo.id}
                src={photo.src}
                alt={photo.caption ?? ""}
                className="max-h-full max-w-full touch-pan-y select-none rounded-2xl object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                drag={photos.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
              />
            </AnimatePresence>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Foto sebelumnya" className="absolute left-3 hidden size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Foto berikutnya" className="absolute right-3 hidden size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
          <div className="p-4 pb-[max(20px,env(safe-area-inset-bottom))] text-center text-white">
            {photo.caption && <p className="font-semibold">{photo.caption}</p>}
            <p className="text-sm text-white/60">oleh {photo.uploaderName}{photos.length > 1 ? " · geser untuk foto lain" : ""}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
