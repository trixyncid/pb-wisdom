"use client";

import { useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { withToast } from "@/lib/with-toast";
import { submitFeeProofAction } from "@/actions/iuran";
import { Button } from "@/components/ui/button";
import { shrinkImageFile } from "@/lib/shrink-image";

// Must stay in sync with the server-side cap in submitFeeProofAction.
const MAX_PROOF_CHARS = 900_000;

export function FeeProofForm({ dueId }: { dueId: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [pending, start] = useTransition();
  const inputId = `proof-${dueId}`;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPreparing(true);
    try {
      setImage(await shrinkImageFile(file, MAX_PROOF_CHARS));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses foto");
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {image ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Pratinjau bukti transfer" className="max-h-48 rounded-2xl border border-navy/8 object-contain" />
          <button type="button" onClick={() => setImage(null)} aria-label="Ganti foto" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-navy/70 text-white">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-navy/15 px-4 py-5 text-center transition hover:border-accent hover:bg-accent-soft/50"
        >
          <ImagePlus className="size-6 text-accent-ink" />
          <span className="text-sm font-bold text-navy">{preparing ? "Memproses foto…" : "Upload bukti transfer"}</span>
          <span className="text-xs text-slate-500">Foto atau screenshot dari m-banking</span>
        </label>
      )}
      <input id={inputId} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="sr-only" />
      {image && (
        <Button
          disabled={pending || preparing}
          className="w-full"
          onClick={() =>
            start(async () => {
              const res = await withToast(submitFeeProofAction(dueId, image), { success: "Bukti dikirim, tunggu verifikasi admin" });
              if (res.ok) setImage(null);
            })
          }
        >
          {pending ? "Mengirim…" : "Kirim bukti"}
        </Button>
      )}
    </div>
  );
}
