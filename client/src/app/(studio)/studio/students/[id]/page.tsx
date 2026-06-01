"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_LEARNERS } from "@/lib/mock-data/users";
import { ArrowLeft, User, ShieldAlert, Award, ClipboardList } from "lucide-react";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function StudioStudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = use(params);

  // Find student
  const student = MOCK_LEARNERS.find((l) => l.id === id) || MOCK_LEARNERS[0];

  return (
    <div className="max-w-[800px] mx-auto py-6 font-sans space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/studio/students"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
      </div>

      {/* Profile Card */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4 flex gap-4 items-center">
          <div className="w-12 h-12 bg-surface-container border border-border flex items-center justify-center text-body-lg font-bold flex-shrink-0 font-mono">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-body-lg font-bold text-foreground">{student.name}</h1>
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
        </div>

        {/* Academic Ledger metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Completed assessments */}
          <div className="border border-border bg-surface p-5 space-y-4">
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Coursework Logs
            </h3>
            <div className="text-xs space-y-2.5 text-muted-foreground">
              <p className="flex justify-between border-b border-border/60 pb-1.5">
                <span>Advanced Python Loops Lab:</span>
                <span className="font-bold text-foreground">Submitted</span>
              </p>
              <p className="flex justify-between border-b border-border/60 pb-1.5">
                <span>Storybook Components:</span>
                <span className="font-bold text-emerald-600">Gradued (A-)</span>
              </p>
            </div>
          </div>

          {/* Certificates */}
          <div className="border border-border bg-surface p-5 space-y-4">
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Award className="w-5 h-5" /> Issued Qualifications
            </h3>
            <div className="text-xs space-y-2.5 text-muted-foreground">
              <p className="flex justify-between items-center border-b border-border/60 pb-1.5">
                <span>React Design Systems:</span>
                <Link href="/verify/cert-react-1" className="font-bold text-foreground underline hover:text-muted-foreground">
                  Verify cert-react-1
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
