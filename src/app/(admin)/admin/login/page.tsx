import { Loader2, TriangleAlert } from "@/components/ui/icons";
import { Suspense } from "react";

import { LoginForm } from "@/client/admin/login-form";
import { isSessionSecretConfigured } from "@/server/auth/token";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the sign-in form…
      </div>
    </main>
  );
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/admin";

  // Missing configuration must be visible before the visitor types a
  // password — otherwise the failure looks like a broken login.
  const configured = isSessionSecretConfigured();

  return (
    <>
      {configured ? null : (
        <div className="mx-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Admin sign-in is disabled because{" "}
            <code className="font-medium">SESSION_SECRET</code> is not configured. Set it
            in the environment and restart the server.
          </p>
        </div>
      )}
      <Suspense fallback={<LoginFallback />}>
        <LoginForm next={next} disabled={!configured} />
      </Suspense>
    </>
  );
}
