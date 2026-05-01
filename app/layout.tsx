import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
      <body className="h-full flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
