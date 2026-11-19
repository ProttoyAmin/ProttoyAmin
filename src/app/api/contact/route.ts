import { NextResponse } from "next/server";

import {
  clientIpFromHeaders,
  consumeRateLimit,
} from "@/server/auth/rate-limit";
import { getRepositories } from "@/server/db/registry";
import { env } from "@/server/env";
import { contactInputSchema } from "@/lib/validation/content";

const MAX_PER_DAY = 20;
const MIN_DWELL_MS = 1500;

async function deliverEmail(message: {
  name: string;
  email: string;
  subject?: string;
  body: string;
}): Promise<void> {
  if (!env.mail.resendApiKey || !env.mail.toEmail) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.mail.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.mail.fromEmail,
        to: [env.mail.toEmail],
        reply_to: message.email,
        subject: message.subject || `Portfolio message from ${message.name}`,
        text: `${message.name} <${message.email}>\n\n${message.body}`,
      }),
    });

    if (!response.ok) {
      console.error("[contact] resend delivery failed:", await response.text());
    }
  } catch (error) {
    console.error("[contact] resend delivery error:", error);
  }
}

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);

  const limit = consumeRateLimit(`contact:${ip}`, MAX_PER_DAY, 24 * 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You have reached the daily message limit. Please try again tomorrow." },
      { status: 429 },
    );
  }

  const parsed = contactInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form" },
      { status: 422 },
    );
  }

  const { name, email, subject, body, website, startedAt } = parsed.data;

  // Honeypot + dwell-time heuristics.
  if (website) {
    return NextResponse.json({ ok: true });
  }
  if (typeof startedAt === "number" && Date.now() - startedAt < MIN_DWELL_MS) {
    return NextResponse.json({ error: "That was a little too fast — try again." }, { status: 422 });
  }

  try {
    const repositories = await getRepositories();
    const message = await repositories.messages.create({
      name,
      email,
      subject: subject ?? "",
      body,
      read: false,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    await deliverEmail({ name, email, subject, body });

    return NextResponse.json({ ok: true, id: message.id });
  } catch (error) {
    console.error("[contact] failed to store message:", error);
    return NextResponse.json(
      { error: "Your message could not be sent right now. Please try again." },
      { status: 500 },
    );
  }
}
