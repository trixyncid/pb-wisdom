"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
          await createAnnouncementAction(title, body);
          setTitle("");
          setBody("");
          toast.success("Pengumuman dikirim");
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
        className="min-h-24 w-full rounded-xl border border-[#0b2a4a]/10 bg-[#f3f8fc] px-3 py-2 text-sm text-[#0b2a4a]"
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
