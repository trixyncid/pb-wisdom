"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Minus, Plus, Search, Trophy, UserPlus, UserRound, X } from "lucide-react";
import { logMatchAction, type PlayerSlot } from "@/actions/matches";
import { withToast } from "@/lib/with-toast";
import { canScore, gameWinner, matchResult, POINT_CAP, POINTS_TO_WIN, type GameScore } from "@/lib/badminton";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import trophy3d from "@/assets/3d/trophy.png";
import shuttle3d from "@/assets/3d/shuttle.png";
import logoLight from "@/assets/brand/logo-light.png";

export type ScorerMember = { id: string; name: string; avatar: string };
export type ScorerGuest = { id: string; name: string };

// Slot keys: a member's user id, "g:<guestId>" for a saved guest, "n:<name>" for a new one.
const isGuestKey = (key: string) => key.startsWith("g:") || key.startsWith("n:");
function toSlot(key: string): PlayerSlot {
  if (key.startsWith("g:")) return { guestId: key.slice(2) };
  if (key.startsWith("n:")) return { guestName: key.slice(2) };
  return { userId: key };
}
type MatchType = "SINGLES" | "DOUBLES";
type Step = "players" | "score" | "review" | "done";
type Slot = { team: 0 | 1; index: 0 | 1 };

const TEAM_STYLE = [
  { name: "Tim A", panel: "from-[#f6b46a] to-accent-2 text-navy", chip: "bg-accent text-navy", ring: "ring-accent" },
  { name: "Tim B", panel: "from-navy-2 to-navy text-white", chip: "bg-white text-navy", ring: "ring-white" },
] as const;

const springy = { type: "spring", stiffness: 520, damping: 30 } as const;

/**
 * Full-screen match scorer: pick players, score games like a scoreboard
 * (or type the final numbers), review, send. Loaded on demand.
 */
export function Scorer({
  members,
  guests,
  currentUserId,
  isAdmin,
  onClose,
}: {
  members: ScorerMember[];
  guests: ScorerGuest[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("players");
  const [type, setType] = useState<MatchType>("DOUBLES");
  const [bestOf, setBestOf] = useState<1 | 3>(3);
  const [teams, setTeams] = useState<[(string | null)[], (string | null)[]]>([
    [currentUserId, null],
    [null, null],
  ]);
  const [picking, setPicking] = useState<Slot | null>(null);
  const [games, setGames] = useState<GameScore[]>([[0, 0]]);
  const [current, setCurrent] = useState(0);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<"PENDING" | "CONFIRMED" | null>(null);
  const [ranked, setRanked] = useState(true);

  const size = type === "SINGLES" ? 1 : 2;
  const lineup: [string[], string[]] = [
    teams[0].slice(0, size).filter(Boolean) as string[],
    teams[1].slice(0, size).filter(Boolean) as string[],
  ];
  const hasMember = [...lineup[0], ...lineup[1]].some((k) => !isGuestKey(k));
  const playersReady = lineup[0].length === size && lineup[1].length === size && hasMember;
  const byId = useMemo(
    () => new Map<string, ScorerMember>([...members.map((m) => [m.id, m] as const), ...guests.map((g) => [`g:${g.id}`, { id: `g:${g.id}`, name: g.name, avatar: "" }] as const)]),
    [members, guests],
  );
  const who = (key: string): ScorerMember => byId.get(key) ?? { id: key, name: key.slice(2), avatar: "" };
  const finished = games.filter((g) => gameWinner(g) !== null);
  const verdict = matchResult(finished);
  const decided = isDecided(games, games.length - 1, bestOf) && !("error" in verdict);
  const dirty = step !== "players" || teams.flat().filter(Boolean).length > 1;

  // Lock page scroll; Escape closes (asks first when something was entered).
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !picking) requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  });

  function requestClose() {
    if (step === "done" || !dirty || window.confirm("Batalkan pencatatan skor?")) {
      exitLandscape();
      onClose();
    }
  }

  // Release fullscreen / orientation lock if the scorer unmounts mid-game.
  useEffect(() => exitLandscape, []);

  function assign(id: string) {
    if (!picking) return;
    setTeams((t) => {
      const next: [(string | null)[], (string | null)[]] = [[...t[0]], [...t[1]]];
      // a player can only be in one slot
      for (const team of next) for (let i = 0; i < team.length; i++) if (team[i] === id) team[i] = null;
      next[picking.team][picking.index] = id;
      return next;
    });
    setPicking(null);
  }

  function setScore(team: 0 | 1, value: number) {
    setGames((gs) => {
      const next = gs.map((g) => [...g] as GameScore);
      const g = next[current];
      g[team] = Math.max(0, Math.min(POINT_CAP, Math.round(value) || 0));
      // Typing can overshoot (e.g. 25-10); keep it within what the rules allow.
      const other = g[1 - team];
      if (g[team] > POINTS_TO_WIN && g[team] - other > 2) g[team] = Math.max(POINTS_TO_WIN, other + 2);
      // If the match is decided by this game, later games no longer apply.
      return isDecided(next, current, bestOf) ? next.slice(0, current + 1) : next;
    });
  }

  function bump(team: 0 | 1, delta: 1 | -1) {
    const g = games[current];
    if (delta === 1 && !canScore(g, team === 0 ? 1 : 2)) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
    setScore(team, g[team] + delta);
  }

  function nextGame() {
    if (decided) return setStep("review");
    if (games.length < 3) {
      setGames((gs) => [...gs, [0, 0]]);
      setCurrent(games.length);
    }
  }

  function submit() {
    start(async () => {
      const res = await withToast(
        logMatchAction({ type, team1: lineup[0].map(toSlot), team2: lineup[1].map(toSlot), games: finished, ranked }),
        {
          loading: "Mengirim skor…",
          success: (r) =>
            "status" in r && r.status === "CONFIRMED" ? (ranked ? "Match masuk leaderboard" : "Match disimpan") : "Skor terkirim, menunggu verifikasi admin",
        },
      );
      if (res.ok) {
        setResult("status" in res ? res.status : "PENDING");
        setStep("done");
      }
    });
  }

  function reset() {
    setGames([[0, 0]]);
    setCurrent(0);
    setResult(null);
    setStep("players");
  }

  const steps: { key: Step; label: string }[] = [
    { key: "players", label: "Pemain" },
    { key: "score", label: "Skor" },
    { key: "review", label: "Kirim" },
  ];
  const stepIndex = Math.min(2, steps.findIndex((s) => s.key === step) === -1 ? 2 : steps.findIndex((s) => s.key === step));

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Catat skor match"
      className="fixed inset-0 z-[95] flex flex-col overflow-hidden bg-[#0b2331] text-white"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.22 }}
    >
      {/* court lines backdrop */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 100 200">
        <path d="M8 8 H92 V192 H8 Z M8 100 H92 M50 8 V192 M8 40 H92 M8 160 H92" stroke="white" strokeWidth="0.6" fill="none" />
      </svg>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/25 blur-3xl" />

      {/* header (the scoreboard has its own controls) */}
      <header className={cn("relative flex items-center gap-3 px-4 pb-2 pt-[max(14px,env(safe-area-inset-top))]", step === "score" && "hidden")}>
        <button
          type="button"
          onClick={step === "score" ? () => setStep("players") : step === "review" ? () => setStep("score") : requestClose}
          aria-label={step === "score" || step === "review" ? "Kembali" : "Tutup"}
          className="flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          {step === "score" || step === "review" ? <ArrowLeft className="size-5" /> : <X className="size-5" />}
        </button>
        {step !== "done" ? (
          <ol className="flex flex-1 items-center justify-center gap-2" aria-label="Langkah">
            {steps.map((s, i) => (
              <li key={s.key} className={cn("flex items-center gap-1.5 text-xs font-bold transition", i <= stepIndex ? "text-white" : "text-white/35")}>
                <span className={cn("flex size-6 items-center justify-center rounded-full text-[11px] transition", i < stepIndex ? "bg-accent text-navy" : i === stepIndex ? "bg-white text-navy" : "bg-white/10")}>
                  {i < stepIndex ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="hidden min-[380px]:inline">{s.label}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex-1" />
        )}
        {step !== "done" && step !== "players" ? (
          <button type="button" onClick={requestClose} aria-label="Tutup" className="flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
            <X className="size-5" />
          </button>
        ) : (
          <span className="size-11" />
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {step === "players" && (
            <StepPane key="players">
              <h2 className="font-display text-3xl font-extrabold">Siapa yang main?</h2>
              <div role="radiogroup" aria-label="Jenis match" className="mt-4 flex gap-1 rounded-full bg-white/10 p-1">
                {(["SINGLES", "DOUBLES"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={type === t}
                    onClick={() => setType(t)}
                    className={cn("relative h-11 flex-1 rounded-full text-sm font-bold transition-colors", type === t ? "text-navy" : "text-white/60")}
                  >
                    {type === t && <motion.span layoutId="scorer-type" transition={springy} className="absolute inset-0 rounded-full bg-white" />}
                    <span className="relative">{t === "SINGLES" ? "Single" : "Ganda"}</span>
                  </button>
                ))}
              </div>

              <div role="radiogroup" aria-label="Format" className="mt-2 flex justify-center gap-2">
                {([3, 1] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={bestOf === n}
                    onClick={() => {
                      setBestOf(n);
                      setGames((gs) => (n === 1 ? gs.slice(0, 1) : gs));
                      setCurrent(0);
                    }}
                    className={cn("h-9 rounded-full px-4 text-xs font-bold transition", bestOf === n ? "bg-accent text-navy" : "bg-white/10 text-white/60")}
                  >
                    {n === 3 ? "Best of 3" : "1 game"}
                  </button>
                ))}
              </div>

              {/* the court */}
              <div className="relative mt-5 flex flex-1 flex-col overflow-hidden rounded-[30px] border-2 border-white/15 bg-white/[0.04]">
                {[0, 1].map((team) => (
                  <div key={team} className={cn("flex flex-1 flex-col items-center justify-center gap-3 p-4", team === 0 && "border-b-2 border-dashed border-white/25")}>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", TEAM_STYLE[team].chip)}>{TEAM_STYLE[team].name}</span>
                    <div className="flex gap-5">
                      {Array.from({ length: size }, (_, index) => {
                        const id = teams[team][index];
                        const m = id ? who(id) : null;
                        return (
                          <motion.button
                            key={index}
                            type="button"
                            layout
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setPicking({ team: team as 0 | 1, index: index as 0 | 1 })}
                            className="flex w-24 flex-col items-center gap-1.5"
                            aria-label={m ? `Ganti ${m.name}` : `Pilih pemain ${TEAM_STYLE[team].name}`}
                          >
                            {m ? (
                              <Avatar className={cn("size-[72px] ring-4", TEAM_STYLE[team].ring)}>
                                <AvatarImage src={m.avatar} alt="" />
                                <AvatarFallback className="text-navy">{m.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <span className="flex size-[72px] items-center justify-center rounded-full border-2 border-dashed border-white/40 text-white/70">
                                <UserPlus className="size-6" />
                              </span>
                            )}
                            <span className="w-full truncate text-center text-sm font-semibold">{m ? m.name : "Pilih"}</span>
                            {id && isGuestKey(id) && <span className="-mt-1 text-[11px] font-semibold text-white/50">tamu</span>}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b2331] px-3 py-1 font-display text-sm font-extrabold text-white/70 ring-2 ring-white/15">
                  VS
                </span>
              </div>

              <PrimaryButton
                disabled={!playersReady}
                onClick={() => {
                  enterLandscape();
                  setStep("score");
                }}
              >
                {playersReady ? "Lanjut ke skor" : lineup[0].length === size && lineup[1].length === size ? "Minimal satu pemain harus member" : "Pilih semua pemain dulu"}
              </PrimaryButton>
            </StepPane>
          )}

          {step === "score" && (
            <LandscapeScoreboard
              key="score"
              games={games}
              current={current}
              onSelectGame={setCurrent}
              teams={lineup.map((ids) => ids.map(who)) as [ScorerMember[], ScorerMember[]]}
              gamesWon={[
                finished.slice(0, current).filter((g) => gameWinner(g) === 1).length,
                finished.slice(0, current).filter((g) => gameWinner(g) === 2).length,
              ]}
              decided={decided}
              onBump={bump}
              onNext={() => {
                if (decided) exitLandscape();
                nextGame();
              }}
              onBack={() => {
                exitLandscape();
                setStep("players");
              }}
              onClose={requestClose}
            />
          )}

          {step === "review" && !("error" in verdict) && (
            <StepPane key="review">
              <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                <motion.div initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={springy}>
                  <Image src={trophy3d} alt="" width={110} height={198} className="float-tilt drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Pemenang</p>
                  <p className="font-display mt-1 text-3xl font-extrabold">
                    {lineup[verdict.winner - 1].map((id) => who(id).name).join(" & ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {finished.map((g, i) => (
                    <div key={i} className="rounded-2xl bg-white/10 px-4 py-2">
                      <p className="text-[11px] font-bold text-white/50">G{i + 1}</p>
                      <p className="font-display text-xl font-extrabold tabular-nums">
                        <span className={cn(g[0] > g[1] && "text-accent")}>{g[0]}</span>
                        <span className="text-white/40">-</span>
                        <span className={cn(g[1] > g[0] && "text-accent")}>{g[1]}</span>
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ranked}
                  onClick={() => setRanked((r) => !r)}
                  className="flex w-full max-w-xs items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">Masuk leaderboard</span>
                    <span className="block text-xs text-white/55">{ranked ? "Hasil dihitung ke ranking & winrate" : "Hanya disimpan di riwayat (fun match)"}</span>
                  </span>
                  <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", ranked ? "bg-accent" : "bg-white/20")}>
                    <motion.span layout transition={springy} className={cn("absolute top-1 size-5 rounded-full bg-white shadow", ranked ? "right-1" : "left-1")} />
                  </span>
                </button>
                <p className="max-w-xs text-sm text-white/60">
                  {isAdmin ? "Kamu admin: match langsung disahkan." : "Skor dan pilihan leaderboard akan dicek admin."}
                </p>
              </div>
              <PrimaryButton disabled={pending} onClick={submit}>
                {pending ? "Mengirim…" : isAdmin ? "Simpan match" : "Kirim untuk verifikasi"}
              </PrimaryButton>
            </StepPane>
          )}

          {step === "done" && (
            <StepPane key="done">
              <Confetti />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <motion.div
                  initial={{ x: -160, y: 120, rotate: -60, opacity: 0 }}
                  animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 140, damping: 14 }}
                >
                  <Image src={shuttle3d} alt="" width={130} height={140} className="float-tilt drop-shadow-[0_18px_28px_rgba(0,0,0,0.4)]" />
                </motion.div>
                <h2 className="font-display text-3xl font-extrabold">{result === "CONFIRMED" ? (ranked ? "Masuk leaderboard!" : "Match tersimpan!") : "Skor terkirim!"}</h2>
                <p className="max-w-xs text-white/70">
                  {result === "CONFIRMED"
                    ? ranked
                      ? "Ranking sudah diperbarui."
                      : "Disimpan di riwayat, tidak dihitung ke ranking."
                    : "Admin akan memverifikasi skornya setelah match. Kamu dapat notifikasi saat disahkan."}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={reset} className="h-14 flex-1 rounded-full bg-white/10 text-base font-bold transition hover:bg-white/20">
                  Catat lagi
                </button>
                <button type="button" onClick={onClose} className="h-14 flex-1 rounded-full bg-accent text-base font-bold text-navy shadow-[0_14px_30px_rgba(238,159,72,0.45)] transition hover:bg-accent-2">
                  Selesai
                </button>
              </div>
            </StepPane>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {picking && (
          <PlayerPicker
            members={members}
            guests={guests}
            taken={new Set(teams.flat().filter(Boolean) as string[])}
            title={`${TEAM_STYLE[picking.team].name} · pemain ${picking.index + 1}`}
            onPick={assign}
            onClose={() => setPicking(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** True when games[0..upto] already decide the match (all of them finished). */
function isDecided(games: GameScore[], upto: number, bestOf: 1 | 3) {
  const played = games.slice(0, upto + 1);
  if (!played.every((g) => gameWinner(g) !== null)) return false;
  if (bestOf === 1) return played.length >= 1;
  const t1 = played.filter((g) => gameWinner(g) === 1).length;
  return Math.max(t1, played.length - t1) >= 2;
}

function StepPane({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className="h-14 w-full shrink-0 rounded-full bg-accent text-base font-bold text-navy shadow-[0_14px_30px_rgba(238,159,72,0.45)] transition-colors hover:bg-accent-2 disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
    >
      {children}
    </motion.button>
  );
}

// ---------- landscape ----------

type LockableOrientation = ScreenOrientation & { lock?: (o: "landscape") => Promise<void>; unlock?: () => void };

/** Fullscreen + landscape lock where the browser allows it (Android). */
function enterLandscape() {
  const el = document.documentElement;
  const lock = () => (screen.orientation as LockableOrientation | undefined)?.lock?.("landscape").catch(() => {});
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen({ navigationUI: "hide" }).then(lock, () => {});
  } else {
    lock();
  }
}

function exitLandscape() {
  (screen.orientation as LockableOrientation | undefined)?.unlock?.();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

const portraitQuery = "(orientation: portrait)";
function subscribePortrait(cb: () => void) {
  const mq = window.matchMedia(portraitQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
/** True while the phone is held upright (no lock: iPhone, or lock refused). */
function usePortrait() {
  return useSyncExternalStore(subscribePortrait, () => window.matchMedia(portraitQuery).matches, () => false);
}

/**
 * The scoreboard, always laid out landscape: Tim A | logo + games | Tim B.
 * When the phone stays upright, the whole board is drawn rotated 90°, so the
 * player just turns the phone.
 */
function LandscapeScoreboard({
  games,
  current,
  onSelectGame,
  teams,
  gamesWon,
  decided,
  onBump,
  onNext,
  onBack,
  onClose,
}: {
  games: GameScore[];
  current: number;
  onSelectGame: (i: number) => void;
  teams: [ScorerMember[], ScorerMember[]];
  gamesWon: [number, number];
  decided: boolean;
  onBump: (team: 0 | 1, delta: 1 | -1) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const portrait = usePortrait();
  const game = games[current];
  const winner = gameWinner(game);
  const deuce = !winner && game[0] >= 20 && game[0] === game[1];

  return (
    <motion.div
      className={cn(
        "z-10 flex bg-[#0b2331]",
        // Upright phone: a landscape-sized box rotated into view.
        portrait ? "fixed left-[100vw] top-0 h-[100vw] w-[100dvh] origin-top-left rotate-90" : "fixed inset-0",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* watermark */}
      <Image
        src={logoLight}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 w-[58%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      />

      <div className="relative grid min-h-0 flex-1 grid-cols-[1fr_minmax(118px,22%)_1fr] gap-3 p-3 pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]">
        <TeamPanel team={0} members={teams[0]} game={game} gameIndex={current} gamesWon={gamesWon} onBump={onBump} />

        {/* center column */}
        <div className="flex min-h-0 flex-col items-center gap-2 py-1">
          <div className="flex w-full items-center justify-between">
            <button type="button" onClick={onBack} aria-label="Kembali ke pemain" className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ArrowLeft className="size-5" />
            </button>
            <button type="button" onClick={onClose} aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X className="size-5" />
            </button>
          </div>
          <Image src={logoLight} alt="PB Wisdom" className="w-full max-w-[120px]" priority />
          <div className="flex w-full flex-col gap-1.5" role="tablist" aria-label="Game">
            {games.map((g, i) => {
              const w = gameWinner(g);
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  onClick={() => onSelectGame(i)}
                  className={cn(
                    "flex h-9 items-center justify-between rounded-full px-3 text-xs font-bold transition",
                    i === current ? "bg-white text-navy" : "bg-white/10 text-white/70",
                  )}
                >
                  <span>G{i + 1}</span>
                  <span className={cn("font-display tabular-nums", w && i !== current && "text-accent")}>
                    {g[0]}-{g[1]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div key="won" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={springy} className="flex flex-col items-center gap-1 text-white">
                  <Trophy className="size-6 text-accent" />
                  <p className="font-display text-sm font-extrabold leading-tight">
                    Game {current + 1}
                    <br />
                    untuk {TEAM_STYLE[winner - 1].name}
                  </p>
                </motion.div>
              ) : deuce ? (
                <motion.span key="deuce" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="rounded-full bg-white px-3 py-1 font-display text-sm font-extrabold text-navy">
                  DEUCE
                </motion.span>
              ) : (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] leading-snug text-white/45">
                  Tap kartu tim untuk menambah poin
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          {winner && (
            <motion.button
              type="button"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNext}
              className="h-12 w-full rounded-full bg-accent text-sm font-bold text-navy shadow-[0_10px_24px_rgba(238,159,72,0.45)]"
            >
              {decided ? "Lihat hasil" : current < games.length - 1 ? `Ke game ${current + 2}` : `Game ${games.length + 1}`}
            </motion.button>
          )}
        </div>

        <TeamPanel team={1} members={teams[1]} game={game} gameIndex={current} gamesWon={gamesWon} onBump={onBump} />
      </div>
    </motion.div>
  );
}

/** A whole team card is the "+1" button; the small − undoes a point. */
function TeamPanel({
  team,
  members,
  game,
  gameIndex,
  gamesWon,
  onBump,
}: {
  team: 0 | 1;
  members: ScorerMember[];
  game: GameScore;
  gameIndex: number;
  gamesWon: [number, number];
  onBump: (team: 0 | 1, delta: 1 | -1) => void;
}) {
  const value = game[team];
  const winner = gameWinner(game);
  const enabled = canScore(game, team === 0 ? 1 : 2);
  const lost = winner !== null && winner !== team + 1;
  const theirs = game[1 - team];
  const atPoint = !winner && ((value >= 20 && value > theirs) || value === POINT_CAP - 1);
  const tag = winner === team + 1 ? "Menang game" : atPoint ? (gamesWon[team] === 1 || gameIndex === 2 ? "Match point" : "Game point") : null;
  const name = TEAM_STYLE[team].name;

  return (
    <motion.div
      role="button"
      tabIndex={enabled ? 0 : -1}
      aria-disabled={!enabled}
      aria-label={`Tambah poin ${name}, skor ${value}`}
      onClick={() => enabled && onBump(team, 1)}
      onKeyDown={(e) => {
        if (enabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onBump(team, 1);
        }
      }}
      whileTap={enabled ? { scale: 0.98 } : undefined}
      className={cn(
        "relative flex min-h-0 select-none flex-col items-center justify-between overflow-hidden rounded-[30px] bg-gradient-to-b p-3 outline-none transition-opacity duration-300 focus-visible:ring-4 focus-visible:ring-white/70",
        TEAM_STYLE[team].panel,
        enabled && "cursor-pointer",
        lost && "opacity-45",
      )}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      {/* tap flash */}
      <AnimatePresence>
        <motion.span
          key={value}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white"
          initial={{ opacity: 0.22 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        />
      </AnimatePresence>

      <div className="flex w-full items-center gap-2">
        <div className="flex -space-x-2.5">
          {members.map((m) => (
            <Avatar key={m.id} className="size-9 ring-2 ring-white">
              <AvatarImage src={m.avatar} alt="" />
              <AvatarFallback className="text-[10px] text-navy">{m.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{members.map((m) => m.name).join(" & ")}</p>
        <span className="font-display text-xs font-extrabold opacity-70">{name}</span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        <div className="h-6">
          <AnimatePresence>
            {tag && (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase", team === 0 ? "bg-navy text-accent" : "bg-accent text-navy")}
              >
                {tag}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {/* No overflow-hidden here: Chrome drops clipped children of a rotated
            parent (upright-phone mode). The card itself clips the roll animation. */}
        <div className="relative flex h-[clamp(96px,46vmin,280px)] w-full items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: 60, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.7 }}
              transition={springy}
              className="font-display absolute text-[clamp(88px,40vmin,250px)] font-extrabold leading-none tabular-nums"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBump(team, -1);
          }}
          disabled={value === 0}
          aria-label={`Kurangi poin ${name}`}
          className="flex size-12 items-center justify-center rounded-full bg-black/15 transition active:scale-90 disabled:opacity-30"
        >
          <Minus className="size-5" />
        </button>
        <span className="flex items-center gap-1 text-xs font-bold opacity-70">
          <Plus className="size-3.5" /> tap kartu
        </span>
      </div>
    </motion.div>
  );
}

function PlayerPicker({
  members,
  guests,
  taken,
  title,
  onPick,
  onClose,
}: {
  members: ScorerMember[];
  guests: ScorerGuest[];
  taken: Set<string>;
  title: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().replace(/\s+/g, " ");
  const needle = query.toLowerCase();
  const list = members.filter((m) => m.name.toLowerCase().includes(needle));
  const guestList = guests.filter((g) => g.name.toLowerCase().includes(needle)).slice(0, 12);
  // Typing a name nobody has yet offers to add them as a new guest.
  const canAddGuest = query.length >= 2 && !guests.some((g) => g.name.toLowerCase() === needle);
  return (
    <>
      <motion.button
        type="button"
        aria-label="Tutup pilihan pemain"
        className="absolute inset-0 z-10 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78%] flex-col rounded-t-[32px] bg-white pb-[max(16px,env(safe-area-inset-bottom))] text-navy"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) onClose();
        }}
      >
        <span aria-hidden className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-navy/15" />
        <div className="px-4 pt-3">
          <p className="font-display text-lg font-bold">{title}</p>
          <label className="relative mt-3 block">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-navy/40" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari member atau ketik nama tamu"
              aria-label="Cari member atau ketik nama tamu"
              className="h-12 w-full rounded-full bg-cream pl-11 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4 overflow-y-auto px-4 pb-2">
          {list.map((m) => {
            const used = taken.has(m.id);
            return (
              <button key={m.id} type="button" onClick={() => onPick(m.id)} className="flex flex-col items-center gap-1.5 text-center">
                <span className="relative">
                  <Avatar className={cn("size-14", used && "opacity-40")}>
                    <AvatarImage src={m.avatar} alt="" />
                    <AvatarFallback className="text-navy">{m.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {used && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-navy px-1.5 text-[9px] font-bold text-white">dipilih</span>}
                </span>
                <span className="w-full truncate text-xs font-semibold">{m.name}</span>
              </button>
            );
          })}
          {list.length === 0 && <p className="col-span-4 py-3 text-center text-sm text-slate-500">Tidak ada member &quot;{q}&quot;</p>}
          {(guestList.length > 0 || canAddGuest) && (
            <div className="col-span-4 flex flex-col gap-2 border-t border-navy/10 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-navy/45">Tamu (tidak masuk ranking)</p>
              <div className="flex flex-wrap gap-2">
                {canAddGuest && (
                  <button
                    type="button"
                    onClick={() => onPick(`n:${query.slice(0, 60)}`)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-bold text-navy"
                  >
                    <Plus className="size-4" /> Tambah tamu &quot;{query}&quot;
                  </button>
                )}
                {guestList.map((g) => {
                  const key = `g:${g.id}`;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onPick(key)}
                      className={cn("inline-flex h-10 items-center gap-1.5 rounded-full bg-cream px-3.5 text-sm font-semibold text-navy", taken.has(key) && "opacity-40")}
                    >
                      <UserRound className="size-4 text-navy/50" /> {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

/** Lightweight confetti: a few dozen CSS-animated pieces, no library. */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 9) * 0.06,
        duration: 1.6 + ((i * 7) % 10) / 10,
        drift: ((i * 53) % 120) - 60,
        color: ["#ee9f48", "#ffffff", "#fbe7cf", "#e08a2c", "#f6b46a"][i % 5],
        rotate: (i * 47) % 360,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
              "--rot": `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
