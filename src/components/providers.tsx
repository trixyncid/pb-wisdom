"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Toaster } from "@/components/toaster";
import { AuthModal } from "@/components/auth/auth-modal";
import { LogoutModal } from "@/components/auth/logout-modal";

export function Providers({
  children,
  demo = false,
}: {
  children: React.ReactNode;
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
    <QueryClientProvider client={client}>
      {children}
      {!demo && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
      {!demo && <LogoutModal />}
      <Toaster />
    </QueryClientProvider>
  );
}
