import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { BadgeStatus } from "@/components/shared/ui-elements";
import { MOCK_ADMIN_ANALYTICS, MOCK_ADMIN_INSTITUTIONS_TABLE, MOCK_ADMIN_USERS_TABLE, MOCK_MODERATION_QUEUE, MOCK_PLATFORM_STATS_OVER_TIME } from "@/lib/mock-data/admin";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import { ArrowRight, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard — LearnioX",
};

export default function AdminDashboardPage() {
  const analytics = MOCK_ADMIN_ANALYTICS;
  const recentInstitutions = MOCK_ADMIN_INSTITUTIONS_TABLE.slice(0, 3);
  const recentUsers = MOCK_ADMIN_USERS_TABLE.slice(0, 4);
  const modQueue = MOCK_MODERATION_QUEUE;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Platform Admin</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase text-label-md tracking-wider">
          LearnioX — Global Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-border">
        <div className="border-r border-border">
          <StatCard label="Total Users" value={formatNumber(analytics.totalUsers)} inverted />
        </div>
        <div className="border-r border-border">
          <StatCard label="Institutions" value={formatNumber(analytics.totalInstitutions)} />
        </div>
        <div className="border-r border-border">
          <StatCard label="Total Courses" value={formatNumber(analytics.totalCourses)} />
        </div>
        <div className="border-r border-border">
          <StatCard label="Platform Revenue" value={formatCurrency(analytics.totalRevenue)} />
        </div>
        <div className="border-r border-border">
          <StatCard label="Active (30d)" value={formatNumber(analytics.activeUsers30d)} />
        </div>
        <div>
          <StatCard label="New Institutions" value={`+${analytics.newInstitutions30d}`} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border">
        {/* Growth Chart */}
        <div className="p-6 border-r border-border">
          <h3 className="text-headline-sm font-bold text-foreground mb-4">Platform Growth</h3>
          <div className="flex items-end gap-2 h-36">
            {MOCK_PLATFORM_STATS_OVER_TIME.map((pt) => {
              const max = Math.max(...MOCK_PLATFORM_STATS_OVER_TIME.map((s) => s.users));
              const h = (pt.users / max) * 100;
              return (
                <div key={pt.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-foreground" style={{ height: `${h}%` }} title={`${formatNumber(pt.users)} users`} />
                  <span className="text-label-sm text-muted-foreground">{pt.month.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Moderation Queue
            </h3>
            <Link href="/admin/moderation" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="border border-border">
            {modQueue.map((item) => (
              <div key={item.id} className="p-4 border-b last:border-b-0 border-border hover:bg-surface-container transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <span className="badge border-border text-muted-foreground text-label-sm uppercase">{item.type}</span>
                  <BadgeStatus status={item.status === "pending" ? "pending" : "active"} />
                </div>
                <p className="text-body-sm text-foreground mt-2 line-clamp-2">{item.content}</p>
                <p className="text-label-sm text-muted-foreground mt-1 uppercase">Reported: {item.reportedBy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Institutions */}
      <div>
        <div className="flex items-end justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-headline-sm font-bold text-foreground">Institutions</h2>
          <Link href="/admin/institutions" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
            Manage All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="border border-border">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Plan</th>
                <th>Students</th>
                <th>Courses</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ADMIN_INSTITUTIONS_TABLE.map((inst) => (
                <tr key={inst.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-foreground">{inst.name}</p>
                      <p className="text-label-sm text-muted-foreground uppercase">{inst.isVerified ? "✓ Verified" : "Unverified"}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge border-border text-label-sm uppercase">{inst.plan}</span>
                  </td>
                  <td className="font-semibold">{formatNumber(inst.students)}</td>
                  <td>{inst.courses}</td>
                  <td className="font-semibold">{formatCurrency(inst.revenue)}</td>
                  <td><BadgeStatus status={inst.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Users */}
      <div>
        <div className="flex items-end justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-headline-sm font-bold text-foreground">Recent Users</h2>
          <Link href="/admin/users" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
            Manage All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="border border-border">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-label-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge border-border text-label-sm uppercase">{user.role}</span>
                  </td>
                  <td className="text-muted-foreground">{user.createdAt}</td>
                  <td><BadgeStatus status={user.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
