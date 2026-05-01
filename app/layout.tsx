import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import config from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${config.nav.brand} Portfolio`,
  description: `${config.profile.name} – ${config.profile.title}. ${config.hero.subheadline}`,
  keywords: [...config.hero.skillPills, config.profile.title],
  openGraph: {
    title: `${config.nav.brand} Portfolio`,
    description: `${config.profile.title} passionate about building great products`,
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
          <p>{config.footer.text}</p>
        </footer>

      </body>
    </html>
  );
}
