import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#e8f3fb] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0b2a4a]",
        className,
      )}
      {...props}
    />
  );
}
