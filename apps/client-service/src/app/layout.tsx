import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

export const metadata: Metadata = {
  title: 'LearnioX — Enterprise Multi-Tenant Learning Platform',
  description: 'Production-grade institution learning, course authoring, and assessment platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
        <AppProviders>
          <main className="flex-1">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
