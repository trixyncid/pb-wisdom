import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-2xl border border-[#0b2a4a]/10 bg-white px-4 text-sm text-[#0b2a4a] placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2eb6ea]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
