import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Title block shared by the Club admin pages, with a way back to the dashboard. */
export function AdminHeader({
  title,
  desc,
  back = true,
  backHref = "/club",
  backLabel = "Club admin",
}: {
  title: string;
  desc?: string;
  back?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="rise" style={{ "--i": 0 } as React.CSSProperties}>
      {back && (
        <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-navy/60 hover:text-navy">
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
      )}
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Club admin</p>
      <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">{title}</h1>
      {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
    </div>
  );
}
