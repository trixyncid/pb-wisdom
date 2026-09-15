"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Suspense, useState } from "react";
import { Toaster } from "sonner";
import { AuthModal } from "@/components/auth/auth-modal";
import { LogoutModal } from "@/components/auth/logout-modal";

export function Providers({
  children,
  session,
  demo = false,
}: {
  children: React.ReactNode;
  session?: Session | null;
  demo?: boolean;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <SessionProvider session={session ?? undefined}>
      <QueryClientProvider client={client}>
        {children}
        {!demo && (
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
        )}
        {!demo && <LogoutModal />}
        <Toaster theme="light" position="top-center" richColors />
      </QueryClientProvider>
    </SessionProvider>
  );
}
