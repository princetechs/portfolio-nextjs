// Multi-LLM Router — powered by Vercel AI SDK.
// Config-driven: reads providers from config.json, auto-detects by env vars.
// Supports ANY OpenAI-compatible API + Anthropic. Zero custom streaming code.
//
// To add a provider: add to config.json → set env var → done.

import config from "@/lib/config";
import type { LLMProviderConfig } from "@/lib/config";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

const { persona, llm } = config.chat;

/* ── Provider Resolution ──
   Iterates config.json providers top-to-bottom.
   First one with a valid env key becomes the active provider. */

interface ResolvedProvider {
  id: string;
  model: LanguageModel;
  modelName: string;
}

function resolveProvider(): ResolvedProvider | null {
  for (const providerCfg of llm.providers) {
    const apiKey = process.env[providerCfg.envKey];
    if (!apiKey || apiKey.startsWith("your_")) continue;

    const modelName = providerCfg.envModel
      ? (process.env[providerCfg.envModel] ?? providerCfg.model)
      : providerCfg.model;

    try {
      const model = createModel(providerCfg, apiKey, modelName);
      if (model) {
        console.log(`[llm-router] ✓ ${providerCfg.id} (${modelName})`);
        return { id: providerCfg.id, model, modelName };
      }
    } catch (err) {
      console.warn(`[llm-router] Failed to init ${providerCfg.id}:`, (err as Error).message);
    }
  }

  console.warn(
    "[llm-router] ✗ No provider configured. Set one of:",
    llm.providers.map((p) => p.envKey).join(", ")
  );
  return null;
}

function createModel(
  cfg: LLMProviderConfig,
  apiKey: string,
  modelName: string
): LanguageModel | null {
  switch (cfg.type) {
    case "openai-compatible": {
      const baseUrl = cfg.envBaseUrl
        ? (process.env[cfg.envBaseUrl] ?? cfg.baseUrl)
        : cfg.baseUrl;
      if (!baseUrl) return null;

      const provider = createOpenAICompatible({
        name: cfg.id,
        baseURL: baseUrl,
        apiKey,
      });
      return provider.languageModel(modelName);
    }

    case "anthropic": {
      const provider = createAnthropic({ apiKey });
      return provider.languageModel(modelName);
    }

    default:
      return null;
  }
}

/* ── Singleton ── */

const active = resolveProvider();

/* ── Public API ── */

/** The resolved AI SDK model instance (pass to streamText/generateText) */
export function getModel(): LanguageModel {
  if (!active) {
    throw new Error(
      `No LLM provider configured. Set one of: ${llm.providers.map((p) => p.envKey).join(", ")}`
    );
  }
  return active.model;
}

export function getProviderName(): string {
  return active?.id ?? "none";
}

export function getProviderModel(): string {
  return active?.modelName ?? "none";
}

export function getMaxTokens(): number {
  return persona.maxTokens;
}
