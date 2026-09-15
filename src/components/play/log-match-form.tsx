"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { logMatchAction } from "@/actions/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Member = { id: string; label: string };

export function LogMatchForm({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const [type, setType] = useState<"SINGLES" | "DOUBLES">("SINGLES");
  const [score, setScore] = useState("21-19, 21-17");
  const [t1a, setT1a] = useState(currentUserId);
  const [t1b, setT1b] = useState("");
  const [t2a, setT2a] = useState("");
  const [t2b, setT2b] = useState("");
  const [winner, setWinner] = useState<1 | 2>(1);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        const team1Ids = type === "SINGLES" ? [t1a] : [t1a, t1b].filter(Boolean);
        const team2Ids = type === "SINGLES" ? [t2a] : [t2a, t2b].filter(Boolean);
        await logMatchAction({
          type,
          score,
          team1Ids,
          team2Ids,
          winnerTeam: winner,
        });
        toast.success("Match dicatat");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal");
      }
    });
  }

  const Select = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      className="h-11 w-full rounded-xl border border-[#0b2a4a]/10 bg-[#f3f8fc] px-3 text-sm text-[#0b2a4a]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Pilih player</option>
      {members.map((m) => (
        <option key={m.id} value={m.id} className="bg-white">
          {m.label}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={type === "SINGLES" ? "default" : "secondary"}
          onClick={() => setType("SINGLES")}
        >
          Singles
        </Button>
        <Button
          type="button"
          size="sm"
          variant={type === "DOUBLES" ? "default" : "secondary"}
          onClick={() => setType("DOUBLES")}
        >
          Doubles
        </Button>
      </div>
      <div className="space-y-1">
        <Label>Skor</Label>
        <Input value={score} onChange={(e) => setScore(e.target.value)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Team 1</Label>
          <Select value={t1a} onChange={setT1a} />
          {type === "DOUBLES" && <Select value={t1b} onChange={setT1b} />}
        </div>
        <div className="space-y-2">
          <Label>Team 2</Label>
          <Select value={t2a} onChange={setT2a} />
          {type === "DOUBLES" && <Select value={t2b} onChange={setT2b} />}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={winner === 1 ? "default" : "secondary"}
          onClick={() => setWinner(1)}
        >
          Team 1 menang
        </Button>
        <Button
          type="button"
          size="sm"
          variant={winner === 2 ? "default" : "secondary"}
          onClick={() => setWinner(2)}
        >
          Team 2 menang
        </Button>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Simpan match"}
      </Button>
    </form>
  );
}
