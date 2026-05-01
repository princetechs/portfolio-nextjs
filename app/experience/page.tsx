import experienceData from "@/data/experience.json";
import skillsData from "@/data/skills.json";
import config from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Experience – ${config.nav.brand} Portfolio`,
  description: `Professional journey, skills and achievements of ${config.profile.name}`,
};

const ICON_COLORS: Record<string, string> = {
  violet: "from-cyan-600 to-teal-600",
  blue: "from-blue-600 to-cyan-600",
  green: "from-green-600 to-emerald-600",
};

const SKILL_COLORS: Record<string, string> = {
  violet: "bg-cyan-600",
  blue: "bg-blue-600",
  green: "bg-green-600",
};

export default function ExperiencePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-violet-800 mb-4">
          Professional Experience
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A journey through my professional growth, skills development, and key
          achievements in software development.
        </p>
      </div>

      {/* Timeline */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">
          Work History
        </h2>
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-400 to-indigo-400 transform md:-translate-x-1/2" />

          <div className="space-y-12">
            {experienceData.map((job, i) => (
              <div
                key={job.id}
                className={`relative flex flex-col md:flex-row ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } gap-8 md:gap-12`}
              >
                {/* dot */}
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 -translate-y-1">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                      ICON_COLORS[job.icon_color] ?? ICON_COLORS.violet
                    } shadow-lg flex items-center justify-center`}
                  >
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>

                {/* Card */}
                <div
                  className={`ml-12 md:ml-0 md:w-1/2 ${
                    i % 2 === 0 ? "md:pr-12" : "md:pl-12"
                  }`}
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                    {job.is_current && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                        Current
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-cyan-600 font-semibold mb-1">
                      {job.company}
                    </p>
                    <p className="text-slate-400 text-sm mb-4">{job.period}</p>
                    <p className="text-slate-600 mb-5">{job.description}</p>

                    {/* Achievements */}
                    {"achievements" in job && job.achievements && (
                      <ul className="space-y-2 mb-5">
                        {(job.achievements as string[]).map((ach, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-cyan-500 mt-0.5 shrink-0">▸</span>
                            {ach}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Tech pills */}
                    <div className="flex flex-wrap gap-2">
                      {job.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-0.5 text-xs rounded-full bg-cyan-50 text-cyan-700 border border-violet-100 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">
          Technical Skills
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skillsData.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    ICON_COLORS[category.icon_color] ?? ICON_COLORS.violet
                  } flex items-center justify-center shadow-md`}
                >
                  <span className="text-white text-lg">⚡</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {category.title}
                </h3>
              </div>

              <div className="space-y-4">
                {category.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {skill.name}
                      </span>
                      <span className="text-sm font-semibold text-cyan-600">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          SKILL_COLORS[category.icon_color] ?? SKILL_COLORS.violet
                        } transition-all duration-700`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
