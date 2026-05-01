import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevSan Portfolio",
  description:
    "Sandip Parida – Full-Stack Developer. Rails, Python, React & AI. Ask me anything via the AI chat!",
  keywords: ["Ruby on Rails", "React", "AI", "LLMs", "Full Stack Developer"],
  openGraph: {
    title: "DevSan Portfolio",
    description: "Full-Stack Developer passionate about Rails & AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <p>
            Built with Next.js &amp; ❤️ by{" "}
            <span className="text-violet-600 font-semibold">Sandip Parida</span>
          </p>
        </footer>

      </body>
    </html>
  );
}
