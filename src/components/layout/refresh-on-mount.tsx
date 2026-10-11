"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-renders the current route once, including layouts. Used after a page
// changes data the persistent shell shows (e.g. the unread badge).
export function RefreshOnMount() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return null;
}
