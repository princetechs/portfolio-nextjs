"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Experience", path: "/experience" },
  { name: "Projects", path: "/projects" },
  {
    name: "GitHub",
    path: "https://github.com/sandipparida",
    external: true,
  },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-sm" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-all duration-300">
              DS
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              DevSan
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-violet-700 hover:bg-violet-50/50 transition-all duration-200"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    pathname === item.path
                      ? "bg-violet-100/50 text-violet-700 shadow-sm shadow-violet-200/50"
                      : "text-slate-600 hover:text-violet-700 hover:bg-violet-50/50"
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
            <a
              href="mailto:sandip@betacraft.io"
              className="ml-4 px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Let&apos;s Talk
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl z-40">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-violet-700 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    pathname === item.path
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-violet-700"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
