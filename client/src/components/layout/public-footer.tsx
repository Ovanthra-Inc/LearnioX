import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <h2 className="text-headline-md font-bold text-foreground mb-3">LearnioX</h2>
            <p className="text-body-sm text-muted-foreground max-w-xs mb-6">
              The ed-tech operating system. Learn from the best coaching institutions. A single platform for courses, live classes, memberships, and certifications.
            </p>
            <div className="flex gap-2">
              <Link href="/auth/signup" className="btn-primary text-label-md uppercase tracking-widest px-5 py-2.5 inline-block">
                Get Started — Free
              </Link>
            </div>
          </div>

          {/* Learners */}
          <div>
            <p className="text-label-md uppercase tracking-widest font-bold text-foreground mb-4">
              Learners
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Discover Courses", href: "/search" },
                { label: "Free Videos", href: "/free-videos" },
                { label: "Live Batches", href: "/live-batches" },
                { label: "Certifications", href: "/verify/cert-1" },
                { label: "Help Center", href: "/help" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutions */}
          <div>
            <p className="text-label-md uppercase tracking-widest font-bold text-foreground mb-4">
              Institutions
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Become a Creator", href: "/auth/signup" },
                { label: "Academy Studio", href: "/studio/dashboard" },
                { label: "AI Copilot", href: "/studio/ai-copilot" },
                { label: "Pricing Passes", href: "/pricing" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-label-md uppercase tracking-widest font-bold text-foreground mb-4">
              Company
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: "About", href: "/about" },
                { label: "Contact Support", href: "/support" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-label-md uppercase tracking-widest font-bold text-foreground mb-4">
              Support
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Help Center", href: "/help" },
                { label: "Privacy Policy", href: "/about" },
                { label: "Terms of Service", href: "/about" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-body-sm text-muted-foreground">
            © 2025 Ovanthra Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <p className="text-label-sm text-muted-foreground uppercase tracking-widest">
              Designed in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
