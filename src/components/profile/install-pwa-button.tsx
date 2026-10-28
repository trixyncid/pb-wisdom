"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InstallGuideSheet, useInstallPrompt } from "./install-guide";

/** Standalone CTA — profile uses the in-list row in ProfileShortcuts instead. */
export function InstallPwaButton({ className }: { className?: string }) {
  const install = useInstallPrompt();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" className={className} onClick={() => setOpen(true)}>
        Install app
      </Button>
      <InstallGuideSheet
        open={open}
        onClose={() => setOpen(false)}
        canPrompt={install.canPrompt}
        onPrompt={install.prompt}
      />
    </>
  );
}
