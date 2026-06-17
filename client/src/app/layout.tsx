import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GithuV — AI-Powered Career Growth Platform for Developers",
  description:
    "GithuV helps developers build stronger professional profiles, collaborate on projects, and accelerate career growth through AI-powered tools. GitHub analytics, AI resume builder, LinkedIn optimization, career coaching, and more.",
  keywords: [
    "developer career",
    "AI career coach",
    "GitHub profile generator",
    "resume builder",
    "LinkedIn optimization",
    "developer portfolio",
  ],
  openGraph: {
    title: "GithuV — AI-Powered Career Growth Platform for Developers",
    description:
      "Accelerate your developer career with AI-powered tools for profiles, resumes, collaboration, and growth.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
