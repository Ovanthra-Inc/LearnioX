"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, CreditCard, ShieldCheck, Check, Calendar, ArrowRight } from "lucide-react";
import { MOCK_USER_MEMBERSHIPS } from "@/lib/mock-data/learner";
import { formatCurrency } from "@/lib/utils";

export default function LearnerMembershipsPage() {
  const [memberships, setMemberships] = useState(MOCK_USER_MEMBERSHIPS);

  const handleCancelAutoRenew = (id: string) => {
    setMemberships(prev =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, status: sub.status === "active" ? "cancelled" : "active" } : sub
      )
    );
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-foreground">My Memberships</h1>
        <p className="text-body-sm text-muted-foreground">
          Manage your coaching academy memberships, pricing plans, and automatic billing details.
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className="border border-border p-16 text-center space-y-4 bg-card">
          <Award className="w-12 h-12 text-muted-foreground opacity-40 mx-auto" />
          <p className="text-body-lg font-bold uppercase text-muted-foreground tracking-wider">No active memberships</p>
          <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
            You don't have any subscription memberships active. Academy memberships grant unlimited access to all courses within that institution.
          </p>
          <Link
            href="/search"
            className="inline-block px-6 py-2.5 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Explore Academy Plans
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {memberships.map((sub) => (
            <div key={sub.id} className="border border-border bg-card flex flex-col justify-between overflow-hidden relative group">
              {/* Top border decoration */}
              <div className="h-1.5 bg-foreground w-full" />
              
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      {sub.institutionName}
                    </span>
                    <h3 className="text-headline-sm font-bold text-foreground mt-0.5">
                      {sub.membershipName}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] uppercase font-bold border ${
                      sub.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                {/* Price tag */}
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-md font-bold text-foreground">
                    {formatCurrency(sub.price)}
                  </span>
                  <span className="text-body-sm text-muted-foreground">
                    / {sub.billingCycle}
                  </span>
                </div>

                {/* Summary list */}
                <div className="border border-border bg-surface p-4 text-body-sm space-y-3 font-mono">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-foreground" />
                    <span>Started: {new Date(sub.startedAt).toLocaleDateString()}</span>
                  </div>
                  {sub.renewsAt && sub.status === "active" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-foreground" />
                      <span>Renews on: {new Date(sub.renewsAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {sub.status === "cancelled" && sub.renewsAt && (
                    <div className="flex items-center gap-2 text-rose-600 font-bold">
                      <Calendar className="w-4 h-4" />
                      <span>Expires on: {new Date(sub.renewsAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="w-4 h-4 text-foreground" />
                    <span>Pay Mode: {sub.paymentMethod || "UPI"}</span>
                  </div>
                </div>

                {/* Simulated features */}
                <div className="space-y-2">
                  <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Benefits Unlocked:</p>
                  <div className="space-y-1.5 text-body-sm text-muted-foreground">
                    {[
                      "Unlimited access to all courses in the academy",
                      "Priority 1:1 live doubt support sessions",
                      "Verifiable completion certificates",
                      "Exclusive Discord community channels"
                    ].map((feat, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-border bg-surface p-4 flex gap-3">
                <button
                  onClick={() => handleCancelAutoRenew(sub.id)}
                  className={`flex-1 py-2 text-label-sm uppercase tracking-wider font-bold border transition-colors ${
                    sub.status === "active"
                      ? "border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-400 dark:border-rose-900 dark:text-rose-400 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {sub.status === "active" ? "Cancel Auto-renew" : "Enable Auto-renew"}
                </button>
                <Link
                  href={`/c/techglobal`}
                  className="flex-1 py-2 text-center text-label-sm uppercase tracking-wider font-bold bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  Enter Studio <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
