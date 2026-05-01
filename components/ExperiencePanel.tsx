"use client";

import experienceData from "@/data/experience.json";
import skillsData from "@/data/skills.json";

const ICON_COLORS: Record<string, string> = {
  violet: "from-slate-600 to-slate-700",
  blue: "from-slate-600 to-slate-700",
  green: "from-slate-600 to-slate-700",
};

const SKILL_COLORS: Record<string, string> = {
  violet: "bg-slate-600",
  blue: "bg-slate-600",
  green: "bg-slate-600",
};

export default function ExperiencePanel() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Experience</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Professional journey &amp; technical skills</p>
        </div>

        {/* Two-column: Timeline left, Skills right */}
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ── Timeline ── */}
          <div className="flex-1 min-w-0">
            <div className="relative pl-5 border-l-2 border-slate-200/60 space-y-3">
              {experienceData.map((job) => (
                <div key={job.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-[27px] top-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-white shadow-sm" />

                  <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[13px] font-bold text-slate-900 leading-tight">{job.title}</h3>
                          {job.is_current && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold">{job.company}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">{job.period}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{job.description}</p>

                    {/* Achievements */}
                    {"achievements" in job && job.achievements && (
                      <ul className="space-y-0.5 mb-2">
                        {(job.achievements as string[]).map((ach, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-relaxed">
                            <span className="text-slate-400 mt-[3px] shrink-0">&#8226;</span>
                            {ach}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Tech pills */}
                    <div className="flex flex-wrap gap-1">
                      {job.technologies.map((tech) => (
                        <span key={tech} className="px-1.5 py-0.5 text-[9px] rounded bg-slate-50 text-slate-600 border border-slate-200/80 font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Skills sidebar ── */}
          <div className="xl:w-[280px] shrink-0 space-y-3">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Skills</h3>
            {skillsData.map((category) => (
              <div key={category.id} className="bg-white rounded-lg border border-slate-200/80 p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${ICON_COLORS[category.icon_color] ?? ICON_COLORS.violet} flex items-center justify-center shadow-sm`}>
                    <span className="text-white text-[10px]">&#9889;</span>
                  </div>
                  <h4 className="text-[12px] font-bold text-slate-900">{category.title}</h4>
                </div>
                <div className="space-y-2">
                  {category.skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px] font-medium text-slate-600">{skill.name}</span>
                        <span className="text-[9px] font-semibold text-slate-600">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${SKILL_COLORS[category.icon_color] ?? SKILL_COLORS.violet}`}
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
