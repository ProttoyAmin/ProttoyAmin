import Link from "next/link";
import { ShieldAlert } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";

/** Shown when the signed-in account is not the portfolio owner. */
export function AccessDenied({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-danger/15 text-danger">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Access restricted</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <p className="mt-2 text-sm text-muted">
        Only the account listed in <code>settings.ownerEmail</code> can manage this site.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/admin/login">
          <Button variant="outline">Sign in as the owner</Button>
        </Link>
        <Link href="/">
          <Button>Back to the site</Button>
        </Link>
      </div>
    </main>
  );
}
