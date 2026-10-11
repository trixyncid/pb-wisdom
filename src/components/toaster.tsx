"use client";

import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

// Top-center, swipe up (or sideways) to dismiss. Colors come from the logo:
// success = orange, in-progress/info = light orange, error = navy.
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      swipeDirections={["top", "left", "right"]}
      visibleToasts={3}
      offset={16}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      icons={{
        success: <CheckCircle2 className="size-5" />,
        error: <AlertCircle className="size-5" />,
        info: <Info className="size-5" />,
        warning: <TriangleAlert className="size-5" />,
        loading: <Loader2 className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#fbe7cf",
          "--normal-text": "#0e2c3c",
          "--normal-border": "#f6cf9f",
          "--success-bg": "#ee9f48",
          "--success-text": "#0e2c3c",
          "--success-border": "#e08a2c",
          "--info-bg": "#fbe7cf",
          "--info-text": "#0e2c3c",
          "--info-border": "#f6cf9f",
          "--warning-bg": "#fbe7cf",
          "--warning-text": "#0e2c3c",
          "--warning-border": "#f6cf9f",
          "--error-bg": "#0e2c3c",
          "--error-text": "#ffffff",
          "--error-border": "#0e2c3c",
          "--border-radius": "22px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans !gap-3 !px-4 !py-3.5 !text-[15px] !font-semibold shadow-[0_16px_36px_rgba(14,44,60,0.22)]",
          description: "!text-[13px] !font-medium !opacity-80",
          icon: "!size-5",
        },
      }}
    />
  );
}
