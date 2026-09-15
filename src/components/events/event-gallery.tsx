"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { addEventPhotoAction, deleteEventPhotoAction } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Photo = {
  id: string;
  imageUrl: string;
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
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function upload() {
    if (!url.trim()) return;
    start(async () => {
      await addEventPhotoAction(eventId, url.trim(), caption || undefined);
      setUrl("");
      setCaption("");
      toast.success("Foto ditambahkan");
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteEventPhotoAction(id);
      toast.success("Foto dihapus");
    });
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-bold text-[#0b2a4a]">Album event</h2>
      <Card className="mb-3 space-y-2">
        <p className="text-xs text-slate-400">
          Paste URL gambar (Cloudinary/UploadThing/Unsplash). Local seed uses
          placeholder URLs.
        </p>
        <Input
          placeholder="https://… image url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Input
          placeholder="Caption (opsional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <Button size="sm" onClick={upload} disabled={pending || !url}>
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-2xl border border-[#0b2a4a]/8"
          >
            <button
              type="button"
              className="block h-36 w-full"
              onClick={() => setLightbox(p.imageUrl)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.caption ?? ""}
                className="h-full w-full object-cover"
              />
            </button>
            {(isAdmin || p.uploaderId === currentUserId) && (
              <button
                type="button"
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-rose-600 opacity-0 transition group-hover:opacity-100"
                onClick={() => remove(p.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <p className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1 text-[10px] text-[#0b2a4a]">
              {p.uploaderName}
            </p>
          </div>
        ))}
      </div>

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full rounded-xl"
          />
        </button>
      )}
    </section>
  );
}
