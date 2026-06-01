import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Minimal header */}
      <header className="h-16 flex items-center px-6 border-b border-border bg-background">
        <Link href="/">
          <h1 className="text-headline-sm font-bold text-foreground">LearnioX</h1>
        </Link>
      </header>
      {/* Auth content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
      {/* Footer note */}
      <div className="h-12 flex items-center justify-center border-t border-border">
        <p className="text-label-sm text-muted-foreground uppercase tracking-widest">
          © 2025 Ovanthra Inc. — All rights reserved
        </p>
      </div>
    </div>
  );
}
