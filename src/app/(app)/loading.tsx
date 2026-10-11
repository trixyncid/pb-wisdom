// Shown instantly on navigation while the server renders the page. It also
// lets Next prefetch dynamic routes up to this boundary.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Memuat">
      <div className="h-7 w-40 rounded-xl bg-navy/10" />
      <div className="h-32 rounded-[28px] bg-navy/[0.06]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-[24px] bg-navy/[0.06]" />
        <div className="h-24 rounded-[24px] bg-navy/[0.06]" />
      </div>
      <div className="h-48 rounded-[28px] bg-navy/[0.06]" />
    </div>
  );
}
