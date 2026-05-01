"use client";

import projectsData from "@/data/projects.json";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  github_url: string;
  live_url: string;
  status: string;
  featured: boolean;
}

export default function ProjectsPanel() {
  const featured = projectsData.filter((p) => p.featured);
  const others = projectsData.filter((p) => !p.featured);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Projects</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Featured work &amp; open-source contributions</p>
        </div>

        {/* Featured — full width cards */}
        {featured.length > 0 && (
          <div className="space-y-3 mb-5">
            {featured.map((project) => (
              <ProjectCard key={project.title} project={project} featured />
            ))}
          </div>
        )}

        {/* Others — grid */}
        {others.length > 0 && (
          <>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">More Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {others.map((project) => (
                <ProjectCard key={project.title} project={project} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header bar */}
      <div className={`px-3.5 py-2.5 text-white ${featured ? "bg-gradient-to-r from-slate-800 to-slate-900" : "bg-gradient-to-r from-slate-700 to-slate-800"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`font-bold truncate ${featured ? "text-[14px]" : "text-[12px]"}`}>{project.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/20">{project.status}</span>
              {project.featured && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-amber-400/30 text-amber-100">Featured</span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {project.github_url !== "#" && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                className="p-1 bg-white/15 rounded hover:bg-white/25 transition-colors" aria-label="GitHub">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
            )}
            {project.live_url !== "#" && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                className="p-1 bg-white/15 rounded hover:bg-white/25 transition-colors" aria-label="Live Demo">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">{project.description}</p>
        <div className="flex flex-wrap gap-1">
          {project.technologies.map((tech) => (
            <span key={tech} className="px-1.5 py-0.5 text-[9px] rounded bg-slate-50 text-slate-600 border border-slate-200/80 font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
