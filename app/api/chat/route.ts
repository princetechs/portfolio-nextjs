import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/knowledge-base";
import { checkRateLimit } from "@/lib/rate-limiter";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = buildSystemPrompt();

// In-memory conversation history (per process — stateless between deploys)
// For multi-user persistence use a session store or DB
const conversationStore = new Map<string, Anthropic.MessageParam[]>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);

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
  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Message too long (max 1000 chars)" },
      { status: 400 }
    );
  }

  // Session-based conversation history (keyed by IP for simplicity)
  const sessionKey = body.sessionId ?? ip;
  const history = conversationStore.get(sessionKey) ?? [];

  // Add user message
  const updatedHistory: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: message },
  ];

  // Keep last 10 messages to stay within context limits
  const trimmedHistory = updatedHistory.slice(-10);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: trimmedHistory,
    });

    const replyContent = response.content[0];
    if (replyContent.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const reply = replyContent.text;

    // Persist history with assistant reply
    conversationStore.set(sessionKey, [
      ...trimmedHistory,
      { role: "assistant", content: reply },
    ]);

    return NextResponse.json(
      { response: reply, status: "success" },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Chat API error:", error.message);

    const fallbacks = [
      "Hey! I'm Sandip, a full-stack dev passionate about Rails and AI. What would you like to know? 😊",
      "Hi there! I specialize in building scalable web apps with Rails. Ask me anything! 👋",
      "Hello! I've been working with Rails for 3+ years, currently building AI platforms. How can I help? 😀",
    ];

    return NextResponse.json(
      {
        response: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        status: "fallback",
      },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip);
  return NextResponse.json({
    status: "ok",
    remaining: result.remaining,
    resetAt: result.resetAt,
  });
}
