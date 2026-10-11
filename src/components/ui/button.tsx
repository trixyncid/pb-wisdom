import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-navy text-white shadow-[0_10px_24px_rgba(14,44,60,0.22)] hover:bg-navy-2",
        accent:
          "bg-accent text-navy shadow-[0_10px_24px_rgba(238,159,72,0.35)] hover:bg-accent-2",
        secondary:
          "bg-white text-navy shadow-[0_6px_18px_rgba(14,44,60,0.08)] hover:bg-cream",
        outline:
          "border-2 border-navy/15 bg-white text-navy hover:border-accent hover:text-accent-ink",
        ghost: "text-navy hover:bg-sand",
        danger: "bg-rose-500 text-white hover:bg-rose-400",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "h-11 w-11",
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
