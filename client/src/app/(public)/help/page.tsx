"use client";

import Link from "next/link";
import { Search, Book, HelpCircle, FileText, ArrowRight } from "lucide-react";

const HELP_CATEGORIES = [
  {
    title: "Learner Support",
    icon: <HelpCircle className="w-5 h-5" />,
    articles: [
      { title: "How to access enrolled program classrooms", slug: "access-classroom" },
      { title: "Retrieving and verifying certificates", slug: "verify-certificate" },
      { title: "Posting doubt questions under video lessons", slug: "post-doubts" },
    ]
  },
  {
    title: "Academy & Studio Operations",
    icon: <Book className="w-5 h-5" />,
    articles: [
      { title: "Setting up monthly membership plans", slug: "setup-membership" },
      { title: "Generating quizzes and lessons using AI Copilot", slug: "ai-copilot-guide" },
      { title: "Inviting team instructors and setting permissions", slug: "team-rbac" },
    ]
  },
  {
    title: "Billing & Ledger Services",
    icon: <FileText className="w-5 h-5" />,
    articles: [
      { title: "Refund queries and UPI invoice management", slug: "refund-invoice" },
      { title: "Corporate licensing seat options", slug: "corporate-license" },
    ]
  }
];

export default function HelpCenterPage() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-12 font-sans">
      {/* Hero header */}
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="text-headline-lg font-bold text-foreground">How can we help you?</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search help articles..."
            className="w-full h-14 pl-12 pr-4 border border-border bg-card text-foreground font-sans outline-none focus:border-foreground transition-colors"
          />
        </div>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HELP_CATEGORIES.map((cat) => (
          <div key={cat.title} className="border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              {cat.icon}
              <h3 className="text-body-md font-bold text-foreground uppercase tracking-tight">{cat.title}</h3>
            </div>
            <ul className="space-y-3">
              {cat.articles.map((art) => (
                <li key={art.slug}>
                  <Link
                    href={`/help/${art.slug}`}
                    className="text-body-sm text-muted-foreground hover:text-foreground hover:underline transition-colors block leading-snug"
                  >
                    {art.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Ticket CTA */}
      <div className="border border-border bg-surface p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-body-md font-bold text-foreground uppercase tracking-tight">Still need support help?</h3>
          <p className="text-body-sm text-muted-foreground">Submit a direct inquiry to our Indian operations support desk.</p>
        </div>
        <Link
          href="/support"
          className="px-6 py-3 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        >
          Contact Support <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
