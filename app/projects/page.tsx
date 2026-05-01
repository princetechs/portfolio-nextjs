import projectsData from "@/data/projects.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects – DevSan Portfolio",
  description: "Featured projects and open-source work by Sandip Parida",
};

export default function ProjectsPage() {
  const featured = projectsData.filter((p) => p.featured);
  const others = projectsData.filter((p) => !p.featured);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-violet-800 mb-4">
          Featured Projects
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A showcase of my technical expertise through real-world applications,
          from full-stack web platforms to innovative AI integrations.
        </p>
      </div>

      {/* Featured */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Featured Work
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featured.map((project) => (
            <ProjectCard key={project.title} project={project} featured />
          ))}
        </div>
      </section>

      {/* Others */}
      {others.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            More Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {others.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface Project {
  title: string;
  description: string;
  technologies: string[];
  github_url: string;
  live_url: string;
  status: string;
  featured: boolean;
}

function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold mb-2 ${featured ? "text-xl" : "text-lg"}`}>
              {project.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-200 text-violet-800">
                {project.status}
              </span>
              {project.featured && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-2 ml-4 shrink-0">
            {project.github_url !== "#" && (
              <a
                href={project.github_url}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <GitHubIcon />
              </a>
            )}
            {project.live_url !== "#" && (
              <a
                href={project.live_url}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Live Demo"
              >
                <ExternalIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <p className="text-gray-600 mb-6 leading-relaxed flex-1">
          {project.description}
        </p>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">
            Technologies Used
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-violet-100 text-violet-800 text-sm rounded-full font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 mt-auto">
          <a
            href={project.github_url}
            className="flex-1 bg-gray-900 text-white text-center py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Code
          </a>
          <a
            href={project.live_url}
            className="flex-1 bg-violet-600 text-white text-center py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Live Demo
          </a>
        </div>
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
