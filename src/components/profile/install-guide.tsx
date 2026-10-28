"use client";

import { useEffect, useState } from "react";
import {
  CircleCheck,
  Download,
  EllipsisVertical,
  Globe,
  Share,
  SquarePlus,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "android" | "ios";

/** Captures Chrome's install prompt so we can fire it from our own button. */
export function useInstallPrompt() {
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

  async function prompt() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return { canPrompt: deferred !== null, prompt };
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as Mac; touch support gives it away.
  const isIos =
    /iPhone|iPad|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos ? "ios" : "android";
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const steps: Record<Platform, { icon: React.ReactNode; text: React.ReactNode }[]> = {
  android: [
    {
      icon: <Globe className="h-4 w-4" />,
      text: (
        <>
          Buka website ini di <b>Google Chrome</b>.
        </>
      ),
    },
    {
      icon: <EllipsisVertical className="h-4 w-4" />,
      text: (
        <>
          Ketuk menu <b>⋮</b> di pojok kanan atas.
        </>
      ),
    },
    {
      icon: <SquarePlus className="h-4 w-4" />,
      text: (
        <>
          Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke Layar utama</b>.
        </>
      ),
    },
    {
      icon: <Download className="h-4 w-4" />,
      text: (
        <>
          Ketuk <b>Instal</b>. Ikon PB Wisdom akan muncul di layar utama HP.
        </>
      ),
    },
  ],
  ios: [
    {
      icon: <Globe className="h-4 w-4" />,
      text: (
        <>
          Buka website ini di <b>Safari</b>.
        </>
      ),
    },
    {
      icon: <Share className="h-4 w-4" />,
      text: (
        <>
          Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas). Kalau tidak
          terlihat, ketuk <b>⋯</b> dulu.
        </>
      ),
    },
    {
      icon: <SquarePlus className="h-4 w-4" />,
      text: (
        <>
          Gulir ke bawah, pilih <b>Tambah ke Layar Utama</b>.
        </>
      ),
    },
    {
      icon: <Download className="h-4 w-4" />,
      text: (
        <>
          Ketuk <b>Tambah</b> di pojok kanan atas. Ikon PB Wisdom akan muncul di
          layar utama.
        </>
      ),
    },
  ],
};

export function InstallGuideSheet({
  open,
  onClose,
  canPrompt,
  onPrompt,
}: {
  open: boolean;
  onClose: () => void;
  canPrompt: boolean;
  onPrompt: () => Promise<void>;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Install app">
      <InstallGuideBody onClose={onClose} canPrompt={canPrompt} onPrompt={onPrompt} />
    </Sheet>
  );
}

/** Mounted only while the sheet is open, so reading the browser here is safe. */
function InstallGuideBody({
  onClose,
  canPrompt,
  onPrompt,
}: {
  onClose: () => void;
  canPrompt: boolean;
  onPrompt: () => Promise<void>;
}) {
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const [installed] = useState(isStandalone);

  return (
    <>
      {installed ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
          <CircleCheck className="h-5 w-5 shrink-0" />
          Kamu sudah membuka PB Wisdom sebagai aplikasi.
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Tambahkan PB Wisdom ke layar utama HP supaya bisa dibuka seperti
            aplikasi biasa.
          </p>

          {canPrompt && (
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={async () => {
                await onPrompt();
                onClose();
              }}
            >
              <Download className="h-4 w-4" />
              Install sekarang
            </Button>
          )}

          <div
            role="tablist"
            aria-label="Pilih HP"
            className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-cream p-1"
          >
            {(["android", "ios"] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={platform === p}
                onClick={() => setPlatform(p)}
                className={`h-10 rounded-xl text-sm font-bold transition ${
                  platform === p
                    ? "bg-white text-navy shadow-sm"
                    : "text-slate-400"
                }`}
              >
                {p === "android" ? "Android" : "iPhone / iPad"}
              </button>
            ))}
          </div>

          <ol className="mt-4 space-y-3">
            {steps[platform].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand text-navy">
                  {step.icon}
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <span className="pt-1.5 text-sm text-slate-600">
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
