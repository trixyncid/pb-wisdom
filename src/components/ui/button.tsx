import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#2eb6ea] text-white shadow-[0_10px_24px_rgba(46,182,234,0.35)] hover:bg-[#1ea5d8]",
        secondary:
          "bg-[#0b2a4a] text-white shadow-[0_10px_24px_rgba(11,42,74,0.2)] hover:bg-[#133a63]",
        outline:
          "border-2 border-[#0b2a4a]/15 bg-white text-[#0b2a4a] hover:border-[#2eb6ea] hover:text-[#2eb6ea]",
        ghost: "text-[#0b2a4a] hover:bg-[#e8f3fb]",
        danger: "bg-rose-500 text-white hover:bg-rose-400",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-13 rounded-full px-7 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";
