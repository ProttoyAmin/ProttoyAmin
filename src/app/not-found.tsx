import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        This page does not exist
      </h1>
      <p className="mt-3 text-muted">
        The link you followed is broken or the page has moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
      >
        Back to the portfolio
      </Link>
    </main>
  );
}
