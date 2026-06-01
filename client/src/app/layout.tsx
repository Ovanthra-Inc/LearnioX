import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LearnioX — Learn from the best institutions online",
    template: "%s | LearnioX",
  },
  description:
    "Discover courses, free lessons, live batches, and academy memberships from trusted coaching institutions. LearnioX — the ed-tech operating system.",
  keywords: ["online learning", "courses", "coaching", "institutions", "LearnioX"],
  authors: [{ name: "LearnioX" }],
  creator: "Ovanthra Inc.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "LearnioX",
    title: "LearnioX — Learn from the best institutions online",
    description: "Discover courses, live batches, and academy memberships from trusted coaching institutions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
