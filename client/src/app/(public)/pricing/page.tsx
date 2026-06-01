"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<"learner" | "institution">("learner");

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-16 space-y-12 font-sans">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-surface-container border border-border px-3 py-1">
          Simple Pricing
        </span>
        <h1 className="text-headline-lg md:text-headline-xl font-bold uppercase tracking-tighter text-foreground">
          Clear Plans. No Hidden Fees.
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
          Whether you are a student preparing for competitive exams or an academy looking to digitize your classroom operations.
        </p>

        {/* Plan Switcher */}
        <div className="flex justify-center pt-6">
          <div className="flex border border-border p-1 bg-card">
            <button
              onClick={() => setActiveTab("learner")}
              className={`px-6 py-2.5 text-label-sm uppercase tracking-wider font-bold transition-colors ${
                activeTab === "learner"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Learners
            </button>
            <button
              onClick={() => setActiveTab("institution")}
              className={`px-6 py-2.5 text-label-sm uppercase tracking-wider font-bold transition-colors ${
                activeTab === "institution"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Institutions
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {activeTab === "learner" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Free Plan */}
          <div className="p-8 bg-card flex flex-col justify-between min-h-[480px]">
            <div className="space-y-4">
              <span className="text-label-sm text-muted-foreground uppercase tracking-widest">Basic Access</span>
              <h3 className="text-headline-md font-bold text-foreground">Free Tier</h3>
              <p className="text-body-sm text-muted-foreground">Browse and explore free coaching videos with no commitment.</p>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-foreground">₹0</span>
                <span className="text-xs text-muted-foreground font-mono">/ Forever</span>
              </div>
              <ul className="space-y-3 pt-6 border-t border-border/60">
                {["Watch free preview video lessons", "Browse institution catalogs", "Follow coaching channels", "Basic search filters"].map((feat) => (
                  <li key={feat} className="flex gap-2 text-body-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth/signup"
              className="mt-8 w-full text-center py-3 bg-surface hover:bg-surface-container text-foreground border border-border text-label-sm uppercase tracking-wider font-bold transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Basic Pass */}
          <div className="p-8 bg-surface-container/30 flex flex-col justify-between min-h-[480px] relative">
            <div className="absolute top-0 left-0 right-0 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest text-center py-1.5">
              Popular Choice
            </div>
            <div className="space-y-4 pt-4">
              <span className="text-label-sm text-muted-foreground uppercase tracking-widest">Academy Pass</span>
              <h3 className="text-headline-md font-bold text-foreground">Basic Pass</h3>
              <p className="text-body-sm text-muted-foreground">Unlock selected course directories and join academy groups.</p>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-foreground">₹499</span>
                <span className="text-xs text-muted-foreground font-mono">/ month</span>
              </div>
              <ul className="space-y-3 pt-6 border-t border-border/60">
                {["Unlock standard curriculum modules", "Join community doubt groups", "Download lecture PDF notes", "Ask up to 15 doubts/month", "Auto-issued digital certificates"].map((feat) => (
                  <li key={feat} className="flex gap-2 text-body-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth/signup"
              className="mt-8 w-full text-center py-3 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
            >
              Subscribe Pass
            </Link>
          </div>

          {/* Pro Pass */}
          <div className="p-8 bg-card flex flex-col justify-between min-h-[480px]">
            <div className="space-y-4">
              <span className="text-label-sm text-muted-foreground uppercase tracking-widest">All Access</span>
              <h3 className="text-headline-md font-bold text-foreground">Pro Pass</h3>
              <p className="text-body-sm text-muted-foreground">Complete coaching preparation with unlimited doubts and live classes.</p>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-foreground">₹1,499</span>
                <span className="text-xs text-muted-foreground font-mono">/ month</span>
              </div>
              <ul className="space-y-3 pt-6 border-t border-border/60">
                {["Full access to all course directories", "Attend weekly live batches", "Submit unlimited assignments", "Priority doubt solving queue", "1:1 mock test review", "Resume verification audits"].map((feat) => (
                  <li key={feat} className="flex gap-2 text-body-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth/signup"
              className="mt-8 w-full text-center py-3 bg-surface hover:bg-surface-container text-foreground border border-border text-label-sm uppercase tracking-wider font-bold transition-colors"
            >
              Subscribe Pro
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Creator Free */}
          <div className="p-8 bg-card flex flex-col justify-between min-h-[480px]">
            <div className="space-y-4">
              <span className="text-label-sm text-muted-foreground uppercase tracking-widest">Solo Teacher</span>
              <h3 className="text-headline-md font-bold text-foreground">Starter Workspace</h3>
              <p className="text-body-sm text-muted-foreground">Start building your community and teaching online for free.</p>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-foreground">₹0</span>
                <span className="text-xs text-muted-foreground font-mono">/ Forever</span>
              </div>
              <ul className="space-y-3 pt-6 border-t border-border/60">
                {["Host up to 3 courses", "Host up to 100 students", "5GB secure video storage", "Manual certificate generation", "Standard payment gateway fee (5% split)"].map((feat) => (
                  <li key={feat} className="flex gap-2 text-body-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth/signup"
              className="mt-8 w-full text-center py-3 bg-surface hover:bg-surface-container text-foreground border border-border text-label-sm uppercase tracking-wider font-bold transition-colors"
            >
              Create Free Academy
            </Link>
          </div>

          {/* Studio Pro */}
          <div className="p-8 bg-surface-container/30 flex flex-col justify-between min-h-[480px] relative">
            <div className="absolute top-0 left-0 right-0 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest text-center py-1.5">
              Best Value
            </div>
            <div className="space-y-4 pt-4">
              <span className="text-label-sm text-muted-foreground uppercase tracking-widest">Growth Plan</span>
              <h3 className="text-headline-md font-bold text-foreground">Studio Pro</h3>
              <p className="text-body-sm text-muted-foreground">Run a full-scale coaching academy with AI support, team RBAC, and coupons.</p>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-foreground">₹2,999</span>
                <span className="text-xs text-muted-foreground font-mono">/ month</span>
              </div>
              <ul className="space-y-3 pt-6 border-t border-border/60">
                {["Unlimited courses & programs", "Unlimited student seats", "500GB video storage", "AI Copilot: Gen outline/quizzes", "Create custom coupons & referral models", "Invite up to 10 team members", "Low txn fee (2% split)"].map((feat) => (
                  <li key={feat} className="flex gap-2 text-body-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth/signup"
              className="mt-8 w-full text-center py-3 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
            >
              Start 14-day Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 bg-card flex flex-col justify-between min-h-[480px]">
            <div className="space-y-4">
              <span className="text-label-sm text-muted-foreground uppercase tracking-widest">Custom Brand</span>
              <h3 className="text-headline-md font-bold text-foreground">Enterprise</h3>
              <p className="text-body-sm text-muted-foreground">White-labeled portal, custom domains, and dedicated Zoom hosting pipelines.</p>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-foreground">Contact</span>
                <span className="text-xs text-muted-foreground font-mono">Sales</span>
              </div>
              <ul className="space-y-3 pt-6 border-t border-border/60">
                {["Custom domain (e.g. academy.yoursite.com)", "Fully white-labeled client & player", "Dedicated cloud video storage", "Unlimited team roles & permissions", "Custom API integrations", "Dedicated account support manager"].map((feat) => (
                  <li key={feat} className="flex gap-2 text-body-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className="mt-8 w-full text-center py-3 bg-surface hover:bg-surface-container text-foreground border border-border text-label-sm uppercase tracking-wider font-bold transition-colors">
              Talk to Sales
            </button>
          </div>
        </div>
      )}

      {/* Comparison Grid info */}
      <div className="border border-border p-6 bg-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-body-md font-bold text-foreground uppercase tracking-tight">Need a custom corporate plan?</h3>
          <p className="text-body-sm text-muted-foreground">We provide custom invoicing, bulk student seats, and organization managers.</p>
        </div>
        <button className="px-6 py-3 border border-border hover:border-foreground uppercase text-label-sm tracking-wider font-bold transition-colors">
          Contact Enterprise Support <ArrowRight className="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  );
}
