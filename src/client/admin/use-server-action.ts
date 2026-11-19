"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/server/actions/admin";

/**
 * Small helper for calling server actions from client components with
 * consistent pending state, toasts and revalidation.
 */
export function useServerAction() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          toast.success(result.message ?? "Saved");
        } else {
          toast.error(result.error ?? "Something went wrong");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        router.refresh();
      }
    });
  }

  return { pending, run };
}
