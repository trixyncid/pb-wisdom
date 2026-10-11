"use client";

import { useState, useTransition } from "react";
import { withToast } from "@/lib/with-toast";
import { createAnnouncementAction } from "@/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AnnouncementForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await withToast(createAnnouncementAction(title, body), {
            loading: "Mengirim pengumuman…",
            success: "Pengumuman dikirim",
          });
          if (!res.ok) return;
          setTitle("");
          setBody("");
        });
      }}
    >
      <Input
        placeholder="Judul"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="min-h-24 w-full rounded-xl border border-navy/10 bg-cream px-3 py-2 text-sm text-navy"
        placeholder="Isi pengumuman"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      <Button type="submit" disabled={pending}>
        Publish
      </Button>
    </form>
  );
}
