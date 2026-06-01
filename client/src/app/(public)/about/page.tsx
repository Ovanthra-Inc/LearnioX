import Link from "next/link";
import { ArrowRight, Sparkles, Code, Cpu, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "About Us — LearnioX",
};

export default function AboutPage() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-16 space-y-12 font-sans">
      
      {/* Intro */}
      <div className="space-y-4 text-center">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-surface-container border border-border px-3 py-1">
          Our Mission
        </span>
        <h1 className="text-display-sm md:text-display-md font-bold uppercase tracking-tighter text-foreground">
          The Operating System for Ed-Tech
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          LearnioX enables coaching academies, creators, and subject experts to run full-scale online learning operations with zero engineering friction.
        </p>
      </div>

      {/* Philosophy grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-border bg-card p-6 md:p-8">
        <div className="space-y-3">
          <h3 className="text-body-lg font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-foreground" /> One-Person Operations
          </h3>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            We believe that a single subject-matter expert should be capable of hosting courses, managing live cohorts, verifying certificates, resolving doubts, and processing invoices without needing an administrative or dev team.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-body-lg font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-foreground" /> AI-Augmented Workflows
          </h3>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            From autogenerating high-fidelity lesson outlines and custom quizzes to drafting doubt replies and landing page copy, our AI Copilot workspace acts as an assistant that multiplies creator productivity tenfold.
          </p>
        </div>
      </div>

      {/* Tech Stack list */}
      <div className="border border-border divide-y divide-border">
        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface">
          <div>
            <h4 className="text-body-md font-bold text-foreground uppercase">Next-generation video</h4>
            <p className="text-xs text-muted-foreground">Streaming powered by Cloudflare Stream for low-latency bufferless delivery.</p>
          </div>
          <span className="text-[10px] bg-foreground text-background font-mono uppercase px-2 py-0.5 font-bold">
            CF Stream
          </span>
        </div>
        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface">
          <div>
            <h4 className="text-body-md font-bold text-foreground uppercase">Secure Indian Ledger</h4>
            <p className="text-xs text-muted-foreground">Automated UPI, netbanking, and card invoice pipelines integrated via Razorpay.</p>
          </div>
          <span className="text-[10px] bg-foreground text-background font-mono uppercase px-2 py-0.5 font-bold">
            Razorpay API
          </span>
        </div>
        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface">
          <div>
            <h4 className="text-body-md font-bold text-foreground uppercase">Extensible REST Core</h4>
            <p className="text-xs text-muted-foreground">High-performance async FastAPI microservices handling auth, analytics, and memberships.</p>
          </div>
          <span className="text-[10px] bg-foreground text-background font-mono uppercase px-2 py-0.5 font-bold">
            FastAPI 3.12
          </span>
        </div>
      </div>

      {/* Call to action */}
      <div className="border border-border bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-body-lg font-bold text-foreground uppercase tracking-tight">
            Ready to build your Academy?
          </h3>
          <p className="text-body-sm text-muted-foreground">
            Sign up for Academy Studio and build your first curriculum in minutes.
          </p>
        </div>
        <Link
          href="/auth/signup"
          className="flex items-center gap-2 px-6 py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-all flex-shrink-0"
        >
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
