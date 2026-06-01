"use client";

import { useState } from "react";
import { CreditCard, Search, ArrowUpRight, DollarSign, CheckCircle2, RefreshCw } from "lucide-react";
import { MOCK_ADMIN_ANALYTICS } from "@/lib/mock-data/admin";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface PlatformTransaction {
  id: string;
  studentName: string;
  institutionName: string;
  itemTitle: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  status: "success" | "pending";
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const analytics = MOCK_ADMIN_ANALYTICS;

  const [transactions, setTransactions] = useState<PlatformTransaction[]>([
    {
      id: "tx-g-101",
      studentName: "Alex Johnson",
      institutionName: "TechGlobal Institute",
      itemTitle: "Advanced Python for Data Science",
      grossAmount: 4999,
      platformFee: 250,
      netPayout: 4749,
      status: "success",
      createdAt: "2024-05-28T10:00:00Z",
    },
    {
      id: "tx-g-102",
      studentName: "Sarah J.",
      institutionName: "Design Institute",
      itemTitle: "Design Systems in React",
      grossAmount: 3999,
      platformFee: 200,
      netPayout: 3799,
      status: "success",
      createdAt: "2024-05-27T18:15:00Z",
    },
    {
      id: "tx-g-103",
      studentName: "Mike T.",
      institutionName: "Quantum Logic Academy",
      itemTitle: "Enterprise Software Integration",
      grossAmount: 5999,
      platformFee: 300,
      netPayout: 5699,
      status: "success",
      createdAt: "2024-05-27T14:00:00Z",
    },
    {
      id: "tx-g-104",
      studentName: "Elena Rostova",
      institutionName: "DataSys Academy",
      itemTitle: "Python for Data Analysis",
      grossAmount: 2999,
      platformFee: 150,
      netPayout: 2849,
      status: "pending",
      createdAt: "2024-05-26T11:00:00Z",
    },
  ]);

  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAlert, setProcessedAlert] = useState(false);

  const handleProcessPayouts = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessedAlert(true);
      setTransactions(transactions.map((tx) => ({ ...tx, status: "success" })));
      setTimeout(() => setProcessedAlert(false), 3000);
    }, 1200);
  };

  const filteredTx = transactions.filter(
    (tx) =>
      tx.studentName.toLowerCase().includes(search.toLowerCase()) ||
      tx.institutionName.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase())
  );

  const netCommission = analytics.totalRevenue * 0.05; // 5% flat fee

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Revenue Ledger</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Global sales summary, platform transaction cuts, and creator payout management.
          </p>
        </div>
        <button
          onClick={handleProcessPayouts}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
          Process Monthly Payouts
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Global Gross Volume</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(analytics.totalRevenue)}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Platform Net Commission (5%)</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(netCommission)}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Total Creator Payouts</p>
          <p className="text-headline-lg font-bold mt-2">
            {formatCurrency(analytics.totalRevenue - netCommission)}
          </p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Pending Payout Batch</p>
          <p className="text-headline-lg font-bold mt-2">
            {formatCurrency(transactions.some((t) => t.status === "pending") ? 2999 : 0)}
          </p>
        </div>
      </div>

      {processedAlert && (
        <div className="border border-foreground p-4 bg-surface-container flex items-center gap-2 text-body-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-foreground" />
          All pending payout balances have been cleared and disbursed to registered creators bank nodes.
        </div>
      )}

      {/* Transaction Logs Table */}
      <div className="border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Global Transactions Log</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Detailed incoming ledger</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse data-table">
            <thead>
              <tr className="border-b border-foreground bg-surface-container">
                <th className="p-3 text-label-xs uppercase font-bold">Tx ID / Date</th>
                <th className="p-3 text-label-xs uppercase font-bold">Student</th>
                <th className="p-3 text-label-xs uppercase font-bold">Institution</th>
                <th className="p-3 text-label-xs uppercase font-bold">Course / Product</th>
                <th className="p-3 text-label-xs uppercase font-bold">Gross Volume</th>
                <th className="p-3 text-label-xs uppercase font-bold">Platform Fee (5%)</th>
                <th className="p-3 text-label-xs uppercase font-bold">Net Payout</th>
                <th className="p-3 text-label-xs uppercase font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-body-sm text-muted-foreground">
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
                    <td className="p-3 font-medium text-foreground">{tx.studentName}</td>
                    <td className="p-3 text-muted-foreground">{tx.institutionName}</td>
                    <td className="p-3 text-foreground">{tx.itemTitle}</td>
                    <td className="p-3 font-semibold text-muted-foreground">
                      {formatCurrency(tx.grossAmount)}
                    </td>
                    <td className="p-3 text-muted-foreground">{formatCurrency(tx.platformFee)}</td>
                    <td className="p-3 font-bold text-foreground">{formatCurrency(tx.netPayout)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                          ${
                            tx.status === "success"
                              ? "bg-foreground text-background"
                              : "bg-muted-foreground/20 text-muted-foreground border border-border"
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
  );
}
