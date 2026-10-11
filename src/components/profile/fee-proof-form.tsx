"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-xs font-semibold text-navy">
        Foto / screenshot bukti transfer
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0])}
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-sand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
      />
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Pratinjau bukti transfer"
          className="max-h-48 rounded-xl border border-navy/8 object-contain"
        />
      )}
      <Button
        size="sm"
        disabled={pending || preparing || !image}
        onClick={() =>
          start(async () => {
            if (!image) return;
            const res = await submitFeeProofAction(dueId, image);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success("Bukti dikirim");
            setImage(null);
          })
        }
      >
        {preparing ? "Memproses foto…" : pending ? "Mengirim…" : "Kirim bukti"}
      </Button>
    </div>
  );
}
