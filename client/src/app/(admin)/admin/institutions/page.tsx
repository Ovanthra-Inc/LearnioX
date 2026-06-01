"use client";

import { useState } from "react";
import { Search, Building2, ShieldCheck, ShieldAlert, Award } from "lucide-react";
import { MOCK_ADMIN_INSTITUTIONS_TABLE } from "@/lib/mock-data/admin";
import { BadgeStatus } from "@/components/shared/ui-elements";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface AdminInstitution {
  id: string;
  name: string;
  plan: "starter" | "pro" | "business";
  status: "active" | "suspended";
  isVerified: boolean;
  students: number;
  courses: number;
  revenue: number;
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<AdminInstitution[]>(
    MOCK_ADMIN_INSTITUTIONS_TABLE as any
  );
  const [search, setSearch] = useState("");

  const handleToggleVerify = (id: string) => {
    setInstitutions(
      institutions.map((inst) => {
        if (inst.id === id) {
          return { ...inst, isVerified: !inst.isVerified };
        }
        return inst;
      })
    );
  };

  const handleToggleStatus = (id: string) => {
    setInstitutions(
      institutions.map((inst) => {
        if (inst.id === id) {
          const nextStatus = inst.status === "active" ? ("suspended" as const) : ("active" as const);
          return { ...inst, status: nextStatus };
        }
        return inst;
      })
    );
  };

  const filteredInsts = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = institutions.reduce((acc, curr) => acc + curr.students, 0);
  const totalRevenue = institutions.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Global Institutions</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Audit business credentials, verify coaching channels, and manage platform membership models.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Global Student Enrollments</p>
          <p className="text-headline-lg font-bold mt-2">{formatNumber(totalStudents)}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Aggregated Gross Sales</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Verification Checkmarks</p>
          <p className="text-headline-lg font-bold mt-2">
            {institutions.filter((i) => i.isVerified).length} / {institutions.length}
          </p>
        </div>
      </div>

      {/* Main Ledger */}
      <div className="border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Registered Institutions</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Official registered academies sitemap</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search academies..."
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
                <th className="p-3 text-label-xs uppercase font-bold">Institution</th>
                <th className="p-3 text-label-xs uppercase font-bold">Plan Plan</th>
                <th className="p-3 text-label-xs uppercase font-bold">Students</th>
                <th className="p-3 text-label-xs uppercase font-bold">Published Courses</th>
                <th className="p-3 text-label-xs uppercase font-bold">Sales Gross</th>
                <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                <th className="p-3 text-label-xs uppercase font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-body-sm text-muted-foreground">
                    No institutions found.
                  </td>
                </tr>
              ) : (
                filteredInsts.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{inst.name}</p>
                          <p className="text-label-xs text-muted-foreground uppercase">
                            {inst.isVerified ? "✓ verified kyc credential" : "pending verification docs"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="badge border-border text-label-sm uppercase">{inst.plan}</span>
                    </td>
                    <td className="p-3 font-semibold">{formatNumber(inst.students)}</td>
                    <td className="p-3 font-medium">{inst.courses}</td>
                    <td className="p-3 font-bold text-foreground">{formatCurrency(inst.revenue)}</td>
                    <td className="p-3">
                      <BadgeStatus status={inst.status} />
                    </td>
                    <td className="p-3 text-right space-x-3">
                      <button
                        onClick={() => handleToggleVerify(inst.id)}
                        className={`text-label-xs uppercase tracking-wider font-bold hover:underline transition-all
                          ${inst.isVerified ? "text-muted-foreground" : "text-foreground"}`}
                      >
                        {inst.isVerified ? "Revoke Badge" : "Verify KYC"}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(inst.id)}
                        className="text-label-xs uppercase tracking-wider text-muted-foreground hover:text-foreground font-bold transition-colors"
                      >
                        {inst.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
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
