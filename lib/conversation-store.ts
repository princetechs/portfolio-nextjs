// Modular conversation store — Upstash Redis or in-memory fallback.
// Stores chat history per session so the AI has context across messages.

import config from "@/lib/config";
import { Redis } from "@upstash/redis";

const HISTORY_LENGTH = config.chat.persona.historyLength;
const TTL_SECONDS = 60 * 60; // 1 hour session expiry

interface MessageParam {
  role: "user" | "assistant";
  content: string;
}

/* ── Strategy interface ── */

interface ConversationStrategy {
  get(key: string): Promise<MessageParam[]>;
  set(key: string, messages: MessageParam[]): Promise<void>;
}

/* ── 1. Upstash Redis strategy ── */

function createUpstashStrategy(): ConversationStrategy | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.startsWith("your_")) return null;

  try {
    const redis = new Redis({ url, token });
    const prefix = "portfolio:chat:";

    console.log("[conversation-store] Using Upstash Redis strategy");

    return {
      async get(key: string): Promise<MessageParam[]> {
        const data = await redis.get(`${prefix}${key}`);
        if (!data) return [];
        return (typeof data === "string" ? JSON.parse(data) : data) as MessageParam[];
      },
      async set(key: string, messages: MessageParam[]): Promise<void> {
        const trimmed = messages.slice(-HISTORY_LENGTH);
        await redis.set(`${prefix}${key}`, JSON.stringify(trimmed), { ex: TTL_SECONDS });
      },
    };
  } catch {
    return null;
  }
}

/* ── 2. In-memory strategy ── */

function createInMemoryStrategy(): ConversationStrategy {
  const store = new Map<string, { messages: MessageParam[]; expiresAt: number }>();

  console.log("[conversation-store] Using in-memory strategy (local dev mode)");

  return {
    async get(key: string): Promise<MessageParam[]> {
      const entry = store.get(key);
      if (!entry || entry.expiresAt < Date.now()) return [];
      return entry.messages;
    },
    async set(key: string, messages: MessageParam[]): Promise<void> {
      const trimmed = messages.slice(-HISTORY_LENGTH);
      store.set(key, { messages: trimmed, expiresAt: Date.now() + TTL_SECONDS * 1000 });
    },
  };
}

/* ── Auto-detect ── */

const strategy: ConversationStrategy = createUpstashStrategy() ?? createInMemoryStrategy();

export async function getConversation(key: string): Promise<MessageParam[]> {
  return strategy.get(key);
}

export async function saveConversation(key: string, messages: MessageParam[]): Promise<void> {
  return strategy.set(key, messages);
}
