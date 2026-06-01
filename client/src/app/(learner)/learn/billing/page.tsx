"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, Download, Plus, Receipt } from "lucide-react";
import { MOCK_PAYMENTS } from "@/lib/mock-data/learner";
import { formatCurrency } from "@/lib/utils";

export default function LearnerBillingPage() {
  const [payments] = useState(MOCK_PAYMENTS);

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Billing & Payments</h1>
        <p className="text-body-sm text-muted-foreground">
          Review invoices, manage payment details, and check your purchase history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-card p-6 space-y-4">
            <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Transaction History
            </h2>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transaction records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm divide-y divide-border border border-border">
                  <thead className="bg-surface text-label-xs uppercase tracking-wider font-bold text-muted-foreground">
                    <tr>
                      <th className="p-3">Reference ID</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-surface-container transition-colors">
                        <td className="p-3 font-semibold text-foreground text-xs">{pay.id}</td>
                        <td className="p-3 text-foreground font-sans truncate max-w-[150px]" title={pay.description}>
                          {pay.description}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : new Date(pay.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold text-foreground">{formatCurrency(pay.amount)}</td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] uppercase font-bold border ${
                              pay.status === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => window.print()}
                            className="p-1.5 border border-border hover:border-foreground text-muted-foreground hover:text-foreground hover:bg-surface inline-flex items-center gap-1 font-sans text-xs uppercase"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Payment Methods */}
        <div className="space-y-6">
          <div className="border border-border bg-card p-6 space-y-4">
            <h2 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Saved UPI / Cards
            </h2>

            {/* Saved method card */}
            <div className="p-4 border border-border bg-surface flex items-center justify-between font-mono text-body-sm text-foreground">
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground font-sans">Primary UPI ID</p>
                <p className="font-semibold text-foreground">alex@okaxis</p>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase border border-border px-1.5 py-0.5 bg-card">
                Default
              </span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 border border-dashed border-border hover:border-foreground py-3 text-label-sm uppercase tracking-wider font-bold transition-colors">
              <Plus className="w-4 h-4" /> Add Payment Method
            </button>
          </div>

          <div className="p-4 border border-border bg-surface-container flex items-start gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-foreground flex-shrink-0" />
            <p className="leading-relaxed">
              All payment methods are verified securely. For any billing queries, contact our platform billing desk support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
