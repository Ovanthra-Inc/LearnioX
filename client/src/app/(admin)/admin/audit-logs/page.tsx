"use client";

import { useState } from "react";
import { Search, FileText, Filter, Terminal, ShieldAlert } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface SystemAuditLog {
  id: string;
  timestamp: string;
  module: "security" | "billing" | "catalog" | "accounts";
  message: string;
  actorEmail: string;
  ipAddress: string;
  severity: "info" | "warning" | "critical";
}

export default function AdminAuditLogsPage() {
  const [logs] = useState<SystemAuditLog[]>([
    {
      id: "log-101",
      timestamp: "2024-05-28T10:05:00Z",
      module: "accounts",
      message: "User account alex@example.com suspended due to repeated login failures",
      actorEmail: "security-daemon",
      ipAddress: "192.168.1.1",
      severity: "warning",
    },
    {
      id: "log-102",
      timestamp: "2024-05-28T10:00:00Z",
      module: "billing",
      message: "Monthly payouts disbursement processed successfully for 142 creators",
      actorEmail: "super-admin@learniox.com",
      ipAddress: "49.206.12.144",
      severity: "info",
    },
    {
      id: "log-103",
      timestamp: "2024-05-27T18:30:00Z",
      module: "catalog",
      message: "Course 'Advanced UI/UX Architecture' flagged following policy breach report",
      actorEmail: "super-admin@learniox.com",
      ipAddress: "49.206.12.144",
      severity: "warning",
    },
    {
      id: "log-104",
      timestamp: "2024-05-27T14:20:00Z",
      module: "security",
      message: "Failed corporate registry verification submit from unverified node",
      actorEmail: "audit-bot",
      ipAddress: "185.220.101.5",
      severity: "critical",
    },
    {
      id: "log-105",
      timestamp: "2024-05-26T09:12:00Z",
      module: "accounts",
      message: "New institution channel approved: Quantum Logic Academy",
      actorEmail: "super-admin@learniox.com",
      ipAddress: "49.206.12.144",
      severity: "info",
    },
  ]);

  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<"all" | SystemAuditLog["module"]>("all");

  const filteredLogs = logs.filter(
    (log) =>
      (filterModule === "all" || log.module === filterModule) &&
      (log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground flex items-center gap-2">
            <Terminal className="w-6 h-6 text-foreground" />
            Audit Logs
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Realtime immutable transaction ledger monitoring global configuration updates and security events.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">System Uptime (30d)</p>
          <p className="text-headline-lg font-bold mt-2 text-foreground">99.98%</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Log Count Index</p>
          <p className="text-headline-lg font-bold mt-2">14,840</p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Active Security Warnings</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-headline-lg font-bold text-foreground">
              {logs.filter((l) => l.severity === "critical").length}
            </p>
            <span className="text-label-xs text-muted-foreground uppercase font-bold flex items-center gap-0.5">
              <ShieldAlert className="w-3 h-3 text-foreground" />
              1 critical event
            </span>
          </div>
        </div>
      </div>

      {/* Logs Table Section */}
      <div className="border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">System Audit ledger</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Platform action events log</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as any)}
              className="p-2 bg-background border border-border text-label-sm uppercase tracking-wider font-bold outline-none focus:border-foreground rounded-none"
            >
              <option value="all">All Modules</option>
              <option value="accounts">Accounts</option>
              <option value="billing">Billing</option>
              <option value="catalog">Catalog</option>
              <option value="security">Security</option>
            </select>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ledger logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse data-table">
            <thead>
              <tr className="border-b border-foreground bg-surface-container">
                <th className="p-3 text-label-xs uppercase font-bold">Timestamp</th>
                <th className="p-3 text-label-xs uppercase font-bold">Log ID</th>
                <th className="p-3 text-label-xs uppercase font-bold">Module</th>
                <th className="p-3 text-label-xs uppercase font-bold">Log Message</th>
                <th className="p-3 text-label-xs uppercase font-bold">Actor</th>
                <th className="p-3 text-label-xs uppercase font-bold">IP Address</th>
                <th className="p-3 text-label-xs uppercase font-bold">Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-body-sm text-muted-foreground">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                  >
                    <td className="p-3 text-muted-foreground">{formatRelativeTime(log.timestamp)}</td>
                    <td className="p-3 font-mono text-label-xs">{log.id}</td>
                    <td className="p-3">
                      <span className="text-label-xs uppercase font-semibold text-muted-foreground border border-border px-1">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-foreground">{log.message}</td>
                    <td className="p-3 text-muted-foreground font-mono text-label-xs">
                      {log.actorEmail}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-label-xs">{log.ipAddress}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                          ${
                            log.severity === "info"
                              ? "bg-foreground text-background"
                              : log.severity === "warning"
                              ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500"
                              : "bg-red-500/10 text-red-600 border border-red-600 font-bold"
                          }`}
                      >
                        {log.severity}
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
