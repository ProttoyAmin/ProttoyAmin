"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface FormRegistration {
  dirty: boolean;
  save: () => Promise<boolean>;
  discard: () => void;
}

interface UnsavedContextValue {
  register: (form: FormRegistration | null, id: string) => void;
}

const UnsavedContext = React.createContext<UnsavedContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = React.useRef<FormRegistration | null>(null);
  const dirtyRef = React.useRef(false);
  const activeFormId = React.useRef<string | null>(null);
  const registeredPath = React.useRef("");
  const pendingNavigation = React.useRef<string | null>(null);
  const lastLocation = React.useRef({ href: "", state: null as unknown });

  const [dirty, setDirty] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const shake = React.useCallback(() => {
    document.body.classList.remove("admin-navigation-shake");
    // Force the animation to restart on consecutive attempts.
    void document.body.offsetWidth;
    document.body.classList.add("admin-navigation-shake");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(
      () => document.body.classList.remove("admin-navigation-shake"),
      700,
    );
  }, []);

  const register = React.useCallback(
    (form: FormRegistration | null, id: string) => {
      const currentPath = window.location.pathname;
      if (
        form &&
        dirtyRef.current &&
        registeredPath.current &&
        currentPath !== registeredPath.current &&
        !pendingNavigation.current
      ) {
        const destination = currentPath + window.location.search + window.location.hash;
        pendingNavigation.current = destination;
        setPendingHref(destination);
        shake();
        return;
      }
      if (
        pendingNavigation.current &&
        activeFormId.current &&
        id !== activeFormId.current
      )
        return;
      if (form) {
        formRef.current = form;
        activeFormId.current = id;
        registeredPath.current = currentPath;
        dirtyRef.current = form.dirty;
        setDirty(form.dirty);
      } else if (id === activeFormId.current && !dirtyRef.current) {
        formRef.current = null;
        activeFormId.current = null;
        registeredPath.current = "";
        setDirty(false);
      }
    },
    [shake],
  );

  React.useEffect(() => {
    const href = window.location.pathname + window.location.search + window.location.hash;
    if (
      lastLocation.current.href &&
      lastLocation.current.href !== href &&
      dirtyRef.current
    ) {
      pendingNavigation.current = href;
      setPendingHref(href);
      shake();
      router.replace(lastLocation.current.href);
      return;
    }
    lastLocation.current = { href, state: window.history.state };
  }, [pathname, router, shake]);

  React.useEffect(() => {
    const guardClick = (event: MouseEvent) => {
      if (!dirtyRef.current || !formRef.current?.dirty) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (
        destination.pathname === window.location.pathname &&
        destination.hash === window.location.hash
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const href = destination.pathname + destination.search + destination.hash;
      pendingNavigation.current = href;
      setPendingHref(href);
      shake();
    };

    const guardPopState = (event: PopStateEvent) => {
      if (!formRef.current?.dirty || !lastLocation.current.href) return;
      const destination =
        window.location.pathname + window.location.search + window.location.hash;
      if (destination === lastLocation.current.href) return;
      // Stop Next's history listener before it renders the destination, then
      // put the address bar back until the owner chooses Save or Discard.
      event.stopImmediatePropagation();
      window.history.pushState(lastLocation.current.state, "", lastLocation.current.href);
      pendingNavigation.current = destination;
      setPendingHref(destination);
      shake();
    };

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || !formRef.current?.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("click", guardClick, true);
    window.addEventListener("popstate", guardPopState, true);
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => {
      document.removeEventListener("click", guardClick, true);
      window.removeEventListener("popstate", guardPopState, true);
      window.removeEventListener("beforeunload", warnBeforeUnload);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [shake]);

  async function saveAndContinue() {
    if (!formRef.current || saving) return;
    setSaving(true);
    const ok = await formRef.current.save();
    setSaving(false);
    if (ok) {
      dirtyRef.current = false;
      formRef.current = null;
      activeFormId.current = null;
      registeredPath.current = "";
      pendingNavigation.current = null;
      setDirty(false);
      const href = pendingHref;
      setPendingHref(null);
      if (href) router.push(href);
    }
  }

  function discardAndContinue() {
    const href = pendingHref;
    formRef.current?.discard();
    dirtyRef.current = false;
    formRef.current = null;
    activeFormId.current = null;
    registeredPath.current = "";
    pendingNavigation.current = null;
    setPendingHref(null);
    setDirty(false);
    if (href) router.push(href);
  }

  const contextValue = React.useMemo(() => ({ register }), [register]);

  return (
    <UnsavedContext.Provider value={contextValue}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-accent/30 bg-background/95 p-4 shadow-[0_20px_80px_-24px_rgba(0,0,0,.65)] backdrop-blur-xl transition-all duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5",
          dirty
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-8 opacity-0",
        )}
      >
        <p className="text-sm font-medium text-foreground">
          Careful — you have unsaved changes.
          <span className="ml-1 font-normal text-muted">
            Save them or discard before leaving this page.
          </span>
        </p>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={discardAndContinue}
            disabled={!dirty || saving}
          >
            Discard
          </Button>
          <Button size="sm" onClick={saveAndContinue} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </UnsavedContext.Provider>
  );
}

export function useUnsavedChanges(form: FormRegistration | null) {
  const context = React.useContext(UnsavedContext);
  const id = React.useId();
  if (!context)
    throw new Error("useUnsavedChanges must be used inside UnsavedChangesProvider");
  React.useEffect(() => {
    context.register(form, id);
    return () => context.register(null, id);
  }, [context, form, id]);
}
