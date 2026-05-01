"use client";

import { usePathname } from "next/navigation";
import config from "@/lib/config";

/** Footer that auto-hides on the home page (full-screen chat layout) */
export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
      <p>{config.footer.text}</p>
    </footer>
  );
}
