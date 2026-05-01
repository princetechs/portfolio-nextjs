export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { buildSystemPrompt } from "@/lib/knowledge-base";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getConversation, saveConversation } from "@/lib/conversation-store";
import { getModel, getProviderName, getMaxTokens } from "@/lib/llm-provider";
import config from "@/lib/config";

const SYSTEM_PROMPT = buildSystemPrompt();
const { persona, fallbackResponses } = config.chat;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  let body: { message?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (message.length > persona.maxMessageLength) {
    return NextResponse.json(
      { error: `Message too long (max ${persona.maxMessageLength} chars)` },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const sessionKey = body.sessionId ?? ip;

  // ── Parallel: rate limit + conversation history ──
  const [rateLimit, history] = await Promise.all([
    checkRateLimit(ip),
    getConversation(sessionKey),
  ]);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
        status: "rate_limited",
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt),
          "Retry-After": String(rateLimit.retryAfter ?? 60),
        },
      }
    );
  }

  const messages = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  try {
    const result = streamText({
      model: getModel(),
      maxOutputTokens: getMaxTokens(),
      system: SYSTEM_PROMPT,
      messages,
      onFinish: async ({ text }) => {
        // Save conversation after stream completes (fire-and-forget)
        if (text) {
          saveConversation(sessionKey, [
            ...messages,
            { role: "assistant" as const, content: text },
          ]).catch((e) => console.error("Failed to save conversation:", e));
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    });
  } catch (err) {
    console.error("Chat API error:", (err as Error).message);
    return NextResponse.json(
      {
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        status: "fallback",
      },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const result = await checkRateLimit(ip);
  return NextResponse.json({
    status: "ok",
    provider: getProviderName(),
    remaining: result.remaining,
    resetAt: result.resetAt,
  });
}
