"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import * as React from "react";

import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/client/site/section";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { contactInputSchema } from "@/lib/validation/content";

type Status = "idle" | "sending" | "success" | "error";

export function Contact({
  email,
  location,
  availability,
}: {
  email: string;
  location: string;
  availability: string;
}) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [startedAt] = React.useState(() => Date.now());
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
      website: String(formData.get("website") ?? ""),
      startedAt,
    };

    const parsed = contactInputSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus("error");
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setError(result.error ?? "Your message could not be sent.");
        return;
      }

      setStatus("success");
      formRef.current?.reset();
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let’s build something"
      description="Have a product idea, a role to fill, or a system that needs untangling? Send a note — I reply within a day or two."
    >
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wider text-muted">Email</p>
            <a
              href={`mailto:${email}`}
              className="mt-1.5 block text-sm font-medium text-accent hover:underline"
            >
              {email}
            </a>
          </div>
          <div className="rounded-2xl border border-line bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wider text-muted">Based in</p>
            <p className="mt-1.5 text-sm font-medium">{location}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wider text-muted">
              Availability
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-success" />
              {availability}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="rounded-2xl border border-line bg-surface/60 p-5 sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input name="name" placeholder="Ada Lovelace" required />
              </Field>
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  placeholder="ada@example.com"
                  required
                />
              </Field>
            </div>

            <Field label="Subject" className="mt-4">
              <Input name="subject" placeholder="Project enquiry" />
            </Field>

            <Field label="Message" className="mt-4">
              <Textarea
                name="body"
                placeholder="Tell me a little about what you have in mind…"
                required
              />
            </Field>

            {/* Honeypot — hidden from humans, catches bots */}
            <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send message
                  </>
                )}
              </Button>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.p
                    key="success"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-sm text-success"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Message received — thank you.
                  </motion.p>
                ) : null}
                {status === "error" && error ? (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-danger"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}
