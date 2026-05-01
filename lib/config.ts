// Central typed config — single source of truth for the entire app.
// All values are read from data/config.json at build time (statically bundled).

import rawConfig from "@/data/config.json";

/* ── Type definitions ── */

export interface NavLink {
  name: string;
  path: string;
  external?: boolean;
}

export interface QuickAction {
  label: string;
  message: string;
}

export interface ChatPersona {
  maxTokens: number;
  maxMessageLength: number;
  historyLength: number;
  rules: string[];
}

export interface LLMProviderConfig {
  id: string;
  type: "openai-compatible" | "anthropic";
  envKey: string;
  envBaseUrl?: string;
  baseUrl?: string;
  model: string;
  envModel?: string;
}

export interface LLMConfig {
  providers: LLMProviderConfig[];
}

export interface AppConfig {
  profile: {
    name: string;
    firstName: string;
    initials: string;
    title: string;
    company: string;
    companyFull: string;
    location: string;
    timezone: string;
    email: string;
    github: string;
    githubHandle: string;
    linkedin: string;
    resumeUrl: string;
  };
  availability: {
    status: string;
    label: string;
    badgeText: string;
    hireable: boolean;
    openTo: string[];
    schedulingMessage: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    greeting: string;
    skillPills: string[];
  };
  chat: {
    botName: string;
    botSubtitle: string;
    welcomeMessage: string;
    quickActions: QuickAction[];
    fallbackResponses: string[];
    persona: ChatPersona;
    llm: LLMConfig;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  nav: {
    brand: string;
    brandInitials: string;
    links: NavLink[];
    ctaLabel: string;
  };
  footer: {
    text: string;
  };
}

const config: AppConfig = rawConfig as AppConfig;

export default config;
