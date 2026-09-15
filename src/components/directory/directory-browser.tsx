"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type DirectoryMember = {
  id: string;
  role: string;
  email: string;
  name: string | null;
  image: string | null;
  nickname: string;
  phone: string | null;
  imageUrl: string | null;
};

const PAGE_SIZE = 10;

export function DirectoryBrowser({
  members,
  initialQ = "",
  initialPage = 1,
}: {
  members: DirectoryMember[];
  initialQ?: string;
  initialPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [pending, start] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page") || initialPage) || 1);
  const query = (searchParams.get("q") ?? initialQ).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return members;
    return members.filter((m) => {
      const hay = `${m.nickname} ${m.name ?? ""} ${m.email} ${m.phone ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [members, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function pushParams(nextQ: string, nextPage: number) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    start(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams(q, 1);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSearchSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, email, atau nomor…"
          className="pl-10"
        />
      </form>

      <p className="text-xs font-medium text-slate-500">
        {filtered.length} member
        {query ? ` · hasil “${query}”` : ""}
        {pending ? " · memuat…" : ""}
      </p>

      <Card className="space-y-1 p-2">
        {slice.length === 0 && (
          <p className="p-3 text-sm text-slate-500">Tidak ada member ditemukan</p>
        )}
        {slice.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5"
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={m.imageUrl ?? m.image ?? undefined} />
              <AvatarFallback>{m.nickname.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0b2a4a]">
                {m.nickname}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {m.phone ?? m.email}
              </p>
            </div>
            {m.role === "ADMIN" && <Badge>Admin</Badge>}
          </div>
        ))}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => pushParams(query, currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <p className="flex items-center gap-1 text-xs font-bold text-slate-500">
          <Users className="h-3.5 w-3.5" />
          {currentPage} / {totalPages}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => pushParams(query, currentPage + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
