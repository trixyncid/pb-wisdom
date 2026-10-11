import { AppShell } from "@/components/layout/app-shell";

// The shell (nav, top bar, unread count) lives in a layout so client
// navigation only re-renders the page, not the shell and its queries.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
