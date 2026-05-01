# Sandip Parida — AI-Powered Portfolio

A single-page developer portfolio with an interactive Live2D avatar and AI chatbot persona. Built with Next.js 16, React 19, and Tailwind CSS 4. The AI chatbot (DevSan AI) answers questions about Sandip's experience, skills, and projects in first person, powered by a multi-LLM router that auto-selects the best available provider.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Design Philosophy](#design-philosophy)
- [Core Systems](#core-systems)
  - [Single-Page Layout](#single-page-layout)
  - [AI Chat System](#ai-chat-system)
  - [Multi-LLM Router](#multi-llm-router)
  - [Live2D Avatar](#live2d-avatar)
  - [Rate Limiting & Conversation Store](#rate-limiting--conversation-store)
  - [Config-Driven Architecture](#config-driven-architecture)
- [Data Flow](#data-flow)
- [Component Map](#component-map)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [For AI Agents](#for-ai-agents)

---

## Architecture Overview

```
Browser
  |
  v
┌────────────────────────────────────────────────────────────┐
│  Next.js App (Single Page)                                 │
│                                                            │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │   Sidebar     │  │   Right Panel (dynamic)            │  │
│  │  (dark, fixed)│  │                                    │  │
│  │              │  │  activeView = "home"                │  │
│  │  Profile     │  │    -> Hero banner + ChatInterface   │  │
│  │  Stats       │  │    -> Live2D avatar (floating)      │  │
│  │  Skills      │  │                                    │  │
│  │  Terminal    │  │  activeView = "experience"          │  │
│  │              │  │    -> ExperiencePanel               │  │
│  │  ─── Nav ─── │  │                                    │  │
│  │  [Hire Me]   │  │  activeView = "projects"            │  │
│  └──────────────┘  │    -> ProjectsPanel                 │  │
│                     └────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                          |
                    POST /api/chat
                          |
                          v
                ┌─────────────────────┐
                │  Edge Runtime API    │
                │                     │
                │  Rate Limiter       │──> Upstash Redis
                │  Conversation Store │──> Upstash Redis
                │  LLM Router         │──> Groq / OpenAI / Anthropic / etc.
                └─────────────────────┘
```

---

## Project Structure

```
portfolio-nextjs/
├── app/                          # Next.js App Router
│   ├── api/chat/route.ts         # AI chat API (Edge runtime, streaming)
│   ├── experience/page.tsx       # Standalone experience page (direct URL)
│   ├── projects/page.tsx         # Standalone projects page (direct URL)
│   ├── globals.css               # Global styles, animations, scrollbar
│   ├── layout.tsx                # Root layout (fonts, metadata, Header/Footer)
│   ├── page.tsx                  # Home — renders HeroSection
│   └── icon.svg                  # Favicon
│
├── components/
│   ├── HeroSection.tsx           # Main layout: sidebar + right panel
│   ├── ChatInterface.tsx         # AI chat UI (messages, input, quick actions)
│   ├── AvatarDisplay.tsx         # Live2D avatar with lip-sync
│   ├── ExperiencePanel.tsx       # Experience timeline + skills (in-panel)
│   ├── ProjectsPanel.tsx         # Project cards grid (in-panel)
│   ├── Header.tsx                # Top nav bar (hidden on home page)
│   └── Footer.tsx                # Footer
│
├── lib/
│   ├── config.ts                 # Typed config loader (from data/config.json)
│   ├── llm-provider.ts           # Multi-LLM router (auto-detect by env vars)
│   ├── knowledge-base.ts         # Builds system prompt from data files
│   ├── rate-limiter.ts           # Rate limiting (Upstash Redis or in-memory)
│   └── conversation-store.ts     # Chat history (Upstash Redis or in-memory)
│
├── data/                         # All content lives here (no hardcoded text)
│   ├── config.json               # App config (profile, chat, nav, LLM providers)
│   ├── experience.json           # Work history
│   ├── projects.json             # Project portfolio
│   └── skills.json               # Skill categories with proficiency levels
│
├── public/
│   └── mark/                     # Live2D model files (Cubism 3)
│       ├── Mark.model3.json
│       ├── Mark.moc3
│       ├── Mark.cdi3.json
│       ├── Mark.physics3.json
│       ├── Mark.2048/texture_00.png
│       └── motions/*.motion3.json
│
├── .env.local                    # API keys (git-ignored)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Design Philosophy

**Goal**: A minimal, professional portfolio that an HR person or recruiter can quickly scan, while also being technically impressive enough to stand out. The AI chatbot makes the portfolio interactive — visitors can ask questions instead of reading static text.

**Principles**:

1. **Single-page, no page jumps** — Sidebar stays fixed, content swaps in the right panel via React state. No full-page navigations for Experience/Projects.
2. **Config-driven** — All text content, profile data, LLM settings, and UI labels come from `data/*.json`. Zero hardcoded strings in components.
3. **Multi-provider resilience** — The LLM router tries 7 providers top-to-bottom. First one with a valid API key wins. If the primary goes down, swap an env var — no code changes.
4. **Slate neutral palette** — Professional monochrome (slate-600 to slate-900). No bright colors. The avatar and interactions provide the visual interest.
5. **Avatar as personality** — The Live2D avatar bounces in on load, floats in the center of the chat area, then slides to the input area when the user starts chatting. It lip-syncs responses using Web Speech API.

---

## Core Systems

### Single-Page Layout

**File**: `components/HeroSection.tsx`

The entire home page is one component managing a `activeView` state:

```
type View = "home" | "experience" | "projects";
```

- **Sidebar** (left, dark gradient): Profile identity, stats grid, skill pills, mini terminal, nav icon dock, "Hire Me" CTA
- **Right panel** (light): Conditionally renders `ChatInterface`, `ExperiencePanel`, or `ProjectsPanel`
- **Mobile**: Sidebar collapses to a compact top bar with inline nav buttons
- **Desktop**: Full sidebar (280-300px) with icon dock navigation at the bottom

The nav dock uses icon buttons with hover tooltips. External links (GitHub, Email) open in new tabs.

### AI Chat System

**Files**: `components/ChatInterface.tsx`, `app/api/chat/route.ts`

**Frontend** (`ChatInterface.tsx`):
- Messages stored in React state with unique IDs
- Streaming responses via `res.body.getReader()` + `TextDecoder`
- `chatStarted` state controls avatar position (centered vs. input-side)
- Quick action buttons above the input send predefined messages
- Rate limit banner shown when 429 received
- Supports two modes: `embedded` (inside HeroSection) and standalone

**Backend** (`app/api/chat/route.ts`):
- Edge runtime for low latency
- POST: validates message -> rate limit check -> fetch conversation history -> stream LLM response -> save history (fire-and-forget)
- GET: health check returning provider name and rate limit status
- Rate limit headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Fallback: if LLM fails, returns a random pre-written response from config

**System prompt** is built dynamically from all `data/*.json` files by `lib/knowledge-base.ts`. It includes the full work history, skills, projects, and persona rules so the AI can answer accurately.

### Multi-LLM Router

**File**: `lib/llm-provider.ts`

A provider-agnostic LLM router using the Vercel AI SDK:

1. Reads the `providers` array from `config.json`
2. Iterates top-to-bottom, checking if the env var for each provider is set
3. First provider with a valid API key becomes the active model
4. Creates either an OpenAI-compatible or Anthropic model instance

**Configured providers** (priority order):
1. Groq (llama-3.3-70b) — free tier, fastest
2. Heroku Inference (gpt-oss-120b)
3. OpenAI (gpt-4o-mini)
4. Together.ai (Llama-3.3-70B)
5. OpenRouter (llama-3.3-70b)
6. Cerebras (llama-3.3-70b)
7. Anthropic (claude-sonnet-4-6) — paid fallback

To switch providers, just set/unset env vars. To add a new provider, add an entry to `config.json` providers array.

### Live2D Avatar

**File**: `components/AvatarDisplay.tsx`

Loads a Cubism 3 Live2D model via CDN scripts (not npm — keeps bundle small):

1. **Script loading**: Pixi.js v6 -> Cubism2 -> Cubism4 -> pixi-live2d-display (sequential, with dedup)
2. **Rendering**: PixiJS Application with transparent background, scaled to container
3. **Lip-sync**: `speak(text)` uses Web Speech API (`SpeechSynthesisUtterance`). On word boundary events, calculates a vowel score (0-1) that drives the mouth parameter
4. **Mouth animation**: A LOW-priority PixiJS ticker lerps `ParamMouthOpenY` each frame for smooth movement
5. **Idle motion**: Loops the "Idle" motion group continuously
6. **Eye tracking**: `pointermove` events make the model's eyes follow the cursor
7. **Fallback**: If the model fails to load, shows a circular avatar with initials

**Avatar position transitions** (controlled by `HeroSection` + `ChatInterface`):
- **Before first message**: Avatar floats centered in the chat area with bounce-in + gentle bob animation (CSS: `.avatar-float-center`)
- **After first message**: Avatar slides to the bottom-left of the input area (CSS: `.avatar-slide-in`)

### Rate Limiting & Conversation Store

**Files**: `lib/rate-limiter.ts`, `lib/conversation-store.ts`

Both use the **Strategy pattern** with auto-detection:

1. Try Upstash Redis (serverless-safe, works on Vercel Edge)
2. Fall back to in-memory `Map` (local dev only — not shared across Edge isolates)

**Rate limiter**: Sliding window, 20 requests per 60 seconds per IP. Uses `@upstash/ratelimit`.

**Conversation store**: Stores chat history per session key (IP-based by default). Messages trimmed to last 10 entries. Sessions expire after 1 hour. Uses `@upstash/redis` directly.

### Config-Driven Architecture

**File**: `lib/config.ts` + `data/config.json`

Everything is driven by `data/config.json`:

- **Profile**: Name, title, company, location, contact links
- **Hero**: Headline, subheadline, greeting text, skill pills
- **Chat**: Bot name/subtitle, welcome message, quick actions, fallback responses, persona rules, LLM provider configs
- **Rate limit**: Window duration and max requests
- **Nav**: Brand name, brand initials, navigation links, CTA label
- **Footer**: Footer text

`lib/config.ts` provides TypeScript types for the entire config shape. Components import `config` and destructure what they need.

**Data files** (`data/*.json`):
- `experience.json`: Work history with achievements and technologies
- `projects.json`: Projects with descriptions, tech stacks, and URLs
- `skills.json`: Skill categories with proficiency percentages

---

## Data Flow

### Chat Message Flow

```
User types message
  -> ChatInterface.sendMessage()
  -> POST /api/chat { message, sessionId? }
  -> [parallel] checkRateLimit(ip) + getConversation(sessionKey)
  -> Rate limit OK?
     -> streamText({ model, system: SYSTEM_PROMPT, messages: history + new })
     -> Stream chunks back to client
     -> Client updates message content in real-time
     -> onFinish: saveConversation(key, messages) [fire-and-forget]
  -> Rate limited?
     -> 429 response
     -> Client shows rate limit banner
```

### Avatar Speech Flow

```
AI response text arrives
  -> HeroSection.handleAiResponse()
  -> cleanForSpeech(text) — strip markdown/emoji
  -> speakFnRef.current(cleaned)
  -> AvatarDisplay.speak()
  -> SpeechSynthesisUtterance created
  -> onboundary events fire per word
     -> vowelScore(word) -> mouthTarget
     -> PixiJS ticker lerps mouthSmooth toward target
     -> writeMouthParam(model, mouthSmooth) each frame
  -> Speaking indicator badge shows above avatar head
  -> onend: mouth closes, indicator fades
```

### View Navigation Flow

```
User clicks nav icon in sidebar dock
  -> setActiveView("experience" | "projects" | "home")
  -> Right panel re-renders with corresponding component
  -> No page navigation, no URL change, instant swap
```

---

## Component Map

| Component | Purpose | Props | State |
|-----------|---------|-------|-------|
| `HeroSection` | Main layout, sidebar + panel | — | `activeView`, speech refs |
| `ChatInterface` | Chat UI, messages, input | `onAiResponse`, `embedded`, `avatarSlot`, `onChatStarted` | `messages`, `input`, `loading`, `chatStarted`, `rateLimited` |
| `AvatarDisplay` | Live2D avatar rendering | `onReady`, `darkMode` | `loading`, `progress`, `fallback`, `errMsg` |
| `ExperiencePanel` | Work timeline + skills | — | — (reads from JSON) |
| `ProjectsPanel` | Project cards grid | — | — (reads from JSON) |
| `Header` | Top nav (hidden on `/`) | — | `mobileOpen` |
| `Footer` | Footer text | — | — |

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# === LLM Provider (at least one required) ===
# The router tries providers top-to-bottom from config.json.
# Set the env var for whichever provider(s) you want to use.

# Groq (free tier, recommended for development)
GROQ_API_KEY=gsk_your_key_here

# OpenAI
OPENAI_API_KEY=sk-your_key_here

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your_key_here

# Together.ai
TOGETHER_API_KEY=your_key_here

# OpenRouter
OPENROUTER_API_KEY=sk-or-your_key_here

# Cerebras
CEREBRAS_API_KEY=your_key_here

# Heroku
HEROKU_INFERENCE_URL=https://your-app.herokuapp.com
HEROKU_INFERENCE_KEY=your_key_here

# === Upstash Redis (recommended for production) ===
# Without these, rate limiting and conversation history use in-memory
# storage which does not persist across Edge runtime invocations.
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local  # or create manually (see above)

# Run development server
npm run dev

# Open http://localhost:3000
```

**Build**:
```bash
npm run build
npm start
```

**Lint**:
```bash
npm run lint
```

---

## Deployment

Designed for **Vercel** (Edge runtime, Upstash Redis integration):

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The chat API runs on Edge runtime for low-latency streaming. Upstash Redis is required in production for rate limiting and conversation persistence to work across Edge isolates.

---

## Known Limitations

1. **Edge runtime + in-memory stores**: Without Upstash Redis configured, the in-memory rate limiter and conversation store do not share state across Edge runtime isolates on Vercel. Each request may hit a fresh isolate. This means rate limiting is ineffective and conversation history is lost. Always configure Upstash Redis for production.

2. **GET `/api/chat` consumes rate limit tokens**: The health check endpoint calls `checkRateLimit(ip)` which decrements the user's remaining quota. Automated monitoring hitting this endpoint will drain user allowances.

3. **Fallback response format mismatch**: When the LLM fails, the API returns a JSON response (HTTP 200) but the client expects a text stream. The client will attempt to read `res.body` as a stream and display raw JSON text in the chat bubble.

4. **Speech synthesis browser support**: `voiceschanged` event may not fire on all browsers (notably some Safari versions). If voices never load, the greeting and lip-sync silently fail — the avatar still renders but won't speak.

5. **No session ID from client**: The chat client doesn't send a `sessionId`, so conversations are keyed by IP address. Users behind the same NAT/VPN share conversation history.

6. **Duplicate page components**: `ExperiencePanel`/`ProjectsPanel` (in-panel versions) and `app/experience/page.tsx`/`app/projects/page.tsx` (standalone pages) render the same data with separate implementations. Changes must be made in both places.

---

## For AI Agents

If you are an AI agent working on this codebase, here is what you need to know:

### Key decisions

- **Single-page architecture**: Navigation is via React state (`activeView`), not Next.js routing. The sidebar and right panel are both in `HeroSection.tsx`. Do not create new page routes for content that should appear in the right panel.
- **Config is king**: Never hardcode text in components. All user-facing strings come from `data/config.json` or other `data/*.json` files. The config is typed in `lib/config.ts`.
- **Slate palette only**: All colors use Tailwind's slate scale (slate-50 through slate-900). No bright colors (cyan, teal, violet, etc.). The dark sidebar uses a custom gradient (`#0c1a2b` to `#071318`).
- **Avatar lifecycle**: The avatar element is created in `HeroSection` and passed to `ChatInterface` via `avatarSlot` prop. Position is controlled by `chatStarted` state — centered when false, input-side when true.
- **LLM provider is env-driven**: To change the AI model, set/unset environment variables. The provider list and priority is in `config.json` under `chat.llm.providers`.

### Where things live

| What | Where |
|------|-------|
| Page layout & sidebar | `components/HeroSection.tsx` |
| Chat logic | `components/ChatInterface.tsx` |
| Chat API | `app/api/chat/route.ts` |
| Avatar rendering | `components/AvatarDisplay.tsx` |
| LLM routing | `lib/llm-provider.ts` |
| System prompt builder | `lib/knowledge-base.ts` |
| Rate limiting | `lib/rate-limiter.ts` |
| Chat history | `lib/conversation-store.ts` |
| All profile/content data | `data/*.json` |
| All type definitions | `lib/config.ts` |
| CSS animations (avatar) | `app/globals.css` |
| Live2D model files | `public/mark/` |

### Common tasks

- **Change profile info**: Edit `data/config.json` under `profile`
- **Add a project**: Add entry to `data/projects.json` (and update both `ProjectsPanel.tsx` and `app/projects/page.tsx` if the standalone page matters)
- **Add an LLM provider**: Add entry to `config.json` `chat.llm.providers` array, set the env var
- **Modify chat persona**: Edit `config.json` `chat.persona.rules` array
- **Change sidebar content**: Edit `components/HeroSection.tsx` desktop sidebar section
- **Adjust avatar animations**: Edit CSS keyframes in `app/globals.css`
- **Update experience/skills**: Edit `data/experience.json` and `data/skills.json`
