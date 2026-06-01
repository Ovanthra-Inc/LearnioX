"use client";

import { useState } from "react";
import { CreditCard, Download, Search, TrendingUp, DollarSign, ArrowUpRight, CheckCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface StudioTransaction {
  id: string;
  studentName: string;
  studentEmail: string;
  itemTitle: string;
  type: "course_sale" | "membership_fee";
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: "success" | "pending" | "failed";
  createdAt: string;
  paymentMethod: string;
}

export default function StudioPaymentsPage() {
  // Mock payouts
  const [payouts] = useState([
    { id: "po-1", amount: 45000, status: "completed", date: "2024-05-15", method: "Bank Transfer (xxxx 4321)" },
    { id: "po-2", amount: 32000, status: "completed", date: "2024-04-15", method: "Bank Transfer (xxxx 4321)" },
    { id: "po-3", amount: 27200, status: "completed", date: "2024-03-15", method: "Bank Transfer (xxxx 4321)" },
  ]);

  // Mock transaction logs
  const [transactions] = useState<StudioTransaction[]>([
    {
      id: "tx-101",
      studentName: "Arjun Patel",
      studentEmail: "arjun@example.com",
      itemTitle: "Advanced UI/UX Architecture",
      type: "course_sale",
      grossAmount: 4999,
      feeAmount: 250,
      netAmount: 4749,
      status: "success",
      createdAt: "2024-05-28T10:00:00Z",
      paymentMethod: "UPI (Razorpay)",
    },
    {
      id: "tx-102",
      studentName: "Sarah J.",
      studentEmail: "sarah.j@example.com",
      itemTitle: "Core Pass Membership",
      type: "membership_fee",
      grossAmount: 499,
      feeAmount: 25,
      netAmount: 474,
      status: "success",
      createdAt: "2024-05-28T09:45:00Z",
      paymentMethod: "Card (Stripe)",
    },
    {
      id: "tx-103",
      studentName: "Mike T.",
      studentEmail: "mike@example.com",
      itemTitle: "Studio Pro Membership",
      type: "membership_fee",
      grossAmount: 1499,
      feeAmount: 75,
      netAmount: 1424,
      status: "success",
      createdAt: "2024-05-27T14:00:00Z",
      paymentMethod: "UPI (Razorpay)",
    },
    {
      id: "tx-104",
      studentName: "Elena Rostova",
      studentEmail: "elena@example.com",
      itemTitle: "Typography Mastery",
      type: "course_sale",
      grossAmount: 2999,
      feeAmount: 150,
      netAmount: 2849,
      status: "success",
      createdAt: "2024-05-26T16:30:00Z",
      paymentMethod: "Card (Stripe)",
    },
    {
      id: "tx-105",
      studentName: "David Kim",
      studentEmail: "david@example.com",
      itemTitle: "Design Systems in React",
      type: "course_sale",
      grossAmount: 3999,
      feeAmount: 200,
      netAmount: 3799,
      status: "pending",
      createdAt: "2024-05-25T11:20:00Z",
      paymentMethod: "Net Banking",
    },
  ]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "course_sale" | "membership_fee">("all");

  const grossTotal = transactions.reduce((acc, curr) => curr.status === "success" ? acc + curr.grossAmount : acc, 0);
  const netTotal = transactions.reduce((acc, curr) => curr.status === "success" ? acc + curr.netAmount : acc, 0);
  const totalFees = transactions.reduce((acc, curr) => curr.status === "success" ? acc + curr.feeAmount : acc, 0);

  const filteredTx = transactions.filter(
    (tx) =>
      (filterType === "all" || tx.type === filterType) &&
      (tx.studentName.toLowerCase().includes(search.toLowerCase()) ||
        tx.itemTitle.toLowerCase().includes(search.toLowerCase()) ||
        tx.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Payments & Revenue</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Track your course sales, memberships earnings, fees, and payout status.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border hover:border-foreground transition-colors text-label-md uppercase tracking-wider">
            <Download className="w-4 h-4" />
            Export Ledger
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity font-bold">
            <CreditCard className="w-4 h-4" />
            Payout Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Gross Earnings</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(grossTotal)}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Platform Fees (5%)</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(totalFees)}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Net Revenue (After Fees)</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(netTotal)}</p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Pending Payout Balance</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-headline-lg font-bold">{formatCurrency(24500)}</p>
            <span className="text-label-xs text-muted-foreground uppercase font-bold flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              Est June 15
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Transactions & Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payout History */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold">Payouts History</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Transfers to your bank account</p>
          </div>

          <div className="space-y-4">
            {payouts.map((po) => (
              <div key={po.id} className="p-4 border border-border flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-body-sm font-bold text-foreground">{formatCurrency(po.amount)}</div>
                  <div className="text-label-xs text-muted-foreground uppercase">{po.method}</div>
                  <div className="text-label-xs text-muted-foreground">{formatDate(po.date)}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-label-xs font-bold uppercase px-1.5 py-0.5 bg-surface-container text-foreground border border-border">
                  <CheckCircle className="w-3 h-3 text-foreground" />
                  {po.status}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-surface-container border border-border p-4 space-y-3">
            <h4 className="text-label-sm uppercase font-bold text-foreground">Linked Account</h4>
            <p className="text-body-sm text-muted-foreground">
              Earnings are automatically distributed on the 15th of every month.
            </p>
            <div className="text-label-xs uppercase font-semibold text-foreground">
              Bank HDFC •••• 4321
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-headline-sm font-bold">Transactions</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Detailed log of recent incoming sales</p>
            </div>
            {/* Filter & Search */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="p-2 bg-background border border-border text-label-sm uppercase tracking-wider font-bold outline-none focus:border-foreground rounded-none"
              >
                <option value="all">All Types</option>
                <option value="course_sale">Course Sales</option>
                <option value="membership_fee">Memberships</option>
              </select>
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground bg-surface-container">
                  <th className="p-3 text-label-xs uppercase font-bold">Tx ID / Date</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Learner</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Item Purchased</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Type</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Gross</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Net</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-body-sm text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{tx.id}</div>
                        <div className="text-label-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{tx.studentName}</div>
                        <div className="text-label-xs text-muted-foreground uppercase">{tx.studentEmail}</div>
                      </td>
                      <td className="p-3 text-foreground">{tx.itemTitle}</td>
                      <td className="p-3">
                        <span className="text-label-xs font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1">
                          {tx.type === "course_sale" ? "course" : "membership"}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-muted-foreground">
                        {formatCurrency(tx.grossAmount)}
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        {formatCurrency(tx.netAmount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                            ${
                              tx.status === "success"
                                ? "bg-foreground text-background"
                                : tx.status === "pending"
                                ? "bg-muted-foreground/20 text-muted-foreground border border-border"
                                : "bg-red-500/10 text-red-500"
                            }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
