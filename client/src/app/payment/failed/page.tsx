"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertOctagon, ArrowLeft, HelpCircle } from "lucide-react";
import { Suspense } from "react";

function PaymentFailedPageContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "course-1";

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans items-center justify-center p-6">
      <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 space-y-6 text-center">
        {/* Top brand */}
        <p className="text-[10px] uppercase font-bold tracking-widest text-rose-600">
          Transaction Failed
        </p>

        {/* Failed icon */}
        <div className="flex justify-center pt-2">
          <AlertOctagon className="w-16 h-16 text-rose-600" />
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h1 className="text-headline-sm font-bold text-foreground uppercase tracking-tight">
            Transaction Declined
          </h1>
          <p className="text-body-sm text-muted-foreground">
            We couldn't process your payment. This could be due to network issues, card limits, or incorrect details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Link
            href={`/checkout/${courseId}`}
            className="w-full block py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Retry Checkout
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/search"
              className="py-2.5 border border-border bg-card text-foreground text-label-sm uppercase tracking-wider font-bold hover:bg-surface-container transition-colors"
            >
              Browse Courses
            </Link>
            <Link
              href="/support"
              className="py-2.5 border border-border bg-card text-foreground text-label-sm uppercase tracking-wider font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center p-6 text-muted-foreground uppercase tracking-widest font-mono text-xs">Loading status...</div>}>
      <PaymentFailedPageContent />
    </Suspense>
  );
}
