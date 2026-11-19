"use client";

import Link from "next/link";
import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-danger">Error</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        {error.message ||
          "An unexpected error occurred while rendering this page. The site keeps working — try again."}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
