// Auto-generated knowledge base from JSON data files + config
// No hardcoded content — everything comes from data/*.json

import config from "@/lib/config";
import experienceData from "@/data/experience.json";
import skillsData from "@/data/skills.json";
import projectsData from "@/data/projects.json";

interface Experience {
  title: string;
  company: string;
  period: string;
  is_current: boolean;
  description: string;
  technologies: string[];
  achievements?: string[];
  learnings?: string[];
}

interface SkillCategory {
  title: string;
  skills: { name: string; level: number }[];
}

interface Project {
  title: string;
  description: string;
  technologies: string[];
  status: string;
  featured: boolean;
}

function buildKnowledgeBase(): string {
  const { profile, availability } = config;

  // ── Profile summary ──
  const lines: string[] = [
    `# ${profile.name} – ${profile.title}`,
    "",
    "## Personal Summary",
    `${profile.title} based in ${profile.location} (${profile.timezone}).`,
    `Currently at ${profile.companyFull}.`,
    "",
  ];

  // ── Experience ──
  lines.push("## Work Experience");
  for (const exp of experienceData as Experience[]) {
    lines.push(`### ${exp.title} — ${exp.company} (${exp.period})`);
    lines.push(exp.description);
    if (exp.achievements?.length) {
      for (const a of exp.achievements) lines.push(`- ${a}`);
    }
    if (exp.learnings?.length) {
      for (const l of exp.learnings) lines.push(`- ${l}`);
    }
    lines.push(`Tech: ${exp.technologies.join(", ")}`, "");
  }

  // ── Skills ──
  lines.push("## Technical Skills");
  for (const cat of skillsData as SkillCategory[]) {
    const items = cat.skills.map((s) => `${s.name} (${s.level}%)`).join(", ");
    lines.push(`- **${cat.title}**: ${items}`);
  }
  lines.push("");

  // ── Projects ──
  lines.push("## Key Projects");
  for (const proj of projectsData as Project[]) {
    lines.push(`- **${proj.title}** [${proj.status}]: ${proj.description}`);
  }
  lines.push("");

  // ── Availability ──
  lines.push("## Contact & Availability");
  lines.push(`- Status: ${availability.label}`);
  lines.push(`- Open to: ${availability.openTo.join(", ")}`);
  lines.push(`- Location: ${profile.location} (${profile.timezone})`);
  if (profile.github) lines.push(`- GitHub: ${profile.github}`);
  if (profile.email) lines.push(`- Email: ${profile.email}`);

  return lines.join("\n").trim();
}

export const KNOWLEDGE_BASE = buildKnowledgeBase();

export function buildSystemPrompt(): string {
  const { chat, availability } = config;
  const rulesBlock = chat.persona.rules.map((r, i) => `${i + 1}. ${r}`).join("\n");

  return `You are ${chat.botName} — the AI persona of ${config.profile.name}, a ${config.profile.title}.
You answer as ${config.profile.firstName} in first person ("I", "my", "I've").

PERSONA RULES:
${rulesBlock}

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

SCHEDULING:
If someone wants to schedule a meeting, tell them: "${availability.schedulingMessage}"`;
}
