"use client";

import { useEffect, useRef } from "react";

/** Renders one email and shrinks the frame to the message, not a fixed height. */
export function EmailFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;

    function fit() {
      const doc = frame?.contentDocument;
      if (!frame || !doc) return;
      const height = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
      if (height > 0) frame.style.height = `${height}px`;
      doc.querySelector("img")?.addEventListener("load", () => {
        const next = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
        if (next > 0) frame.style.height = `${next}px`;
      }, { once: true });
    }

    frame.addEventListener("load", fit);
    if (frame.contentDocument?.readyState === "complete") fit();
    return () => frame.removeEventListener("load", fit);
  }, [html]);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="block w-full bg-cream"
      style={{ height: 560 }}
    />
  );
}
