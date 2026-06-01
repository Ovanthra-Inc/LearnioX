"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_CERTIFICATES } from "@/lib/mock-data/learner";
import { ArrowLeft, ShieldCheck, Check, Calendar, Award } from "lucide-react";

interface VerifyPageProps {
  params: Promise<{ certId: string }>;
}

export default function CertificateVerificationPage({ params }: VerifyPageProps) {
  const { certId } = use(params);

  // Find certificate matching ID
  const cert = MOCK_CERTIFICATES.find((c) => c.id === certId) || MOCK_CERTIFICATES[0];

  return (
    <div className="max-w-[700px] mx-auto px-6 py-16 space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </div>

      {/* Verification Card */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6 text-center">
        <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center mx-auto rounded-none">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] bg-emerald-600 text-white font-bold uppercase tracking-widest px-3 py-1">
            ✓ Credential Verified
          </span>
          <h1 className="text-headline-md font-bold text-foreground pt-3">
            Certificate of Completion
          </h1>
          <p className="text-body-sm text-muted-foreground">
            LearnioX Ledger verification ID: <span className="font-mono text-foreground font-bold">{cert.id}</span>
          </p>
        </div>

        {/* Certificate Details Table */}
        <div className="border border-border text-left divide-y divide-border text-body-sm">
          <div className="p-4 flex justify-between bg-surface">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Recipient Name</span>
            <span className="font-semibold text-foreground">Alex Johnson</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Program Title</span>
            <span className="font-semibold text-foreground">{cert.courseTitle}</span>
          </div>
          <div className="p-4 flex justify-between bg-surface">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Offering Academy</span>
            <span className="font-semibold text-foreground">{cert.institutionName}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Issue Date</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Footnote */}
        <div className="pt-4 flex items-start gap-2.5 text-xs text-muted-foreground text-left bg-surface-container/40 p-4 border border-border">
          <ShieldCheck className="w-5 h-5 text-foreground flex-shrink-0" />
          <p className="leading-relaxed">
            This credential audit was verified via LearnioX's automated completion registrar. It confirms the candidate finished all modules, submitted required assignments, and passed mock quiz assessments.
          </p>
        </div>
      </div>
    </div>
  );
}
