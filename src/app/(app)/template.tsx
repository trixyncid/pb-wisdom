import { PageTransition } from "@/components/layout/page-transition";

// Templates remount on navigation (layouts persist), so the enter animation
// plays for each page.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
