"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { formatCurrency } from "@/lib/utils";
import { Suspense } from "react";

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "course-1";
  const amount = parseFloat(searchParams.get("amount") || "5898");

  // Find course
  const course = MOCK_COURSES.find((c) => c.id === courseId) || MOCK_COURSES[0];
  const orderId = `LX-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans items-center justify-center p-6">
      <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 space-y-6 text-center relative overflow-hidden">
        {/* Top brand */}
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          LearnioX Ledger
        </p>

        {/* Success icon */}
        <div className="flex justify-center pt-2">
          <CheckCircle2 className="w-16 h-16 text-foreground" />
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h1 className="text-headline-sm font-bold text-foreground uppercase tracking-tight">
            Payment Successful
          </h1>
          <p className="text-body-sm text-muted-foreground">
            Thank you! Your enrollment is now active.
          </p>
        </div>

        {/* Order details ledger */}
        <div className="border border-border bg-surface text-body-sm text-left divide-y divide-border font-mono">
          <div className="p-3 flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-semibold text-foreground">{orderId}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-muted-foreground">Course</span>
            <span className="font-semibold text-foreground truncate max-w-[180px]">{course.title}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-muted-foreground">Institution</span>
            <span className="font-semibold text-foreground">{course.institutionName}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-muted-foreground">Paid Amount</span>
            <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="font-semibold text-foreground text-xs">{dateStr}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Link
            href={`/learn/watch/lesson-1`}
            className="w-full block py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Go to Classroom
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/learn/dashboard"
              className="py-2.5 border border-border bg-card text-foreground text-label-sm uppercase tracking-wider font-bold hover:bg-surface-container transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => window.print()}
              className="py-2.5 border border-border bg-card text-foreground text-label-sm uppercase tracking-wider font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Invoice
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          <ShieldCheck className="w-4 h-4 text-foreground" /> Verified Secure Transaction
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center p-6 text-muted-foreground uppercase tracking-widest font-mono text-xs">Loading ledger...</div>}>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
