"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronRight,
  Download,
  LogOut,
  Users,
  Wallet,
} from "lucide-react";
import { useUiStore } from "@/lib/store";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const linkRows = [
  {
    href: "/directory",
    label: "Directory",
    hint: "Cari & lihat anggota klub",
    icon: Users,
    tone: "bg-[#e8f3fb] text-[#0b2a4a]",
  },
  {
    href: "/profile/iuran",
    label: "Iuran saya",
    hint: "Status & upload bukti transfer",
    icon: Wallet,
    tone: "bg-[#dff3fc] text-[#1ea5d8]",
  },
] as const;

function RowShell({
  icon,
  tone,
  label,
  hint,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  hint: string;
}) {
  return (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-bold text-[#0b2a4a]">{label}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </>
  );
}

export function ProfileShortcuts() {
  const openLogout = useUiStore((s) => s.openLogout);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    toast.message("Install app", {
      description:
        "Di Chrome Android: menu ⋮ → Add to Home Screen / Install app",
    });
  }

  return (
    <div className="space-y-3">
      <ul className="overflow-hidden rounded-[28px] border border-[#0b2a4a]/6 bg-white shadow-[0_12px_40px_rgba(11,42,74,0.06)]">
        {linkRows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.href} className="border-b border-[#0b2a4a]/6">
              <Link
                href={row.href}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f7fbfe]"
              >
                <RowShell
                  icon={<Icon className="h-5 w-5" />}
                  tone={row.tone}
                  label={row.label}
                  hint={row.hint}
                />
              </Link>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={installApp}
            className="flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-[#f7fbfe]"
          >
            <RowShell
              icon={<Download className="h-5 w-5" />}
              tone="bg-emerald-50 text-emerald-600"
              label="Install app"
              hint="Tambah ke layar utama HP"
            />
          </button>
        </li>
      </ul>

      <button
        type="button"
        onClick={openLogout}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] text-sm font-bold text-rose-500 transition hover:bg-rose-50 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </div>
  );
}
