"use client";

import { useState } from "react";
import { Search, Plus, UserCheck, ShieldAlert, UserMinus } from "lucide-react";
import { MOCK_ADMIN_USERS_TABLE } from "@/lib/mock-data/admin";
import { BadgeStatus } from "@/components/shared/ui-elements";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "learner" | "owner" | "instructor";
  status: "active" | "suspended";
  createdAt: string;
  enrollments: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS_TABLE as any);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "learner" as "learner" | "owner" | "instructor",
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const added = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "active" as const,
      createdAt: new Date().toISOString().split("T")[0],
      enrollments: 0,
    };

    setUsers([added, ...users]);
    setShowAddForm(false);
    setNewUser({ name: "", email: "", role: "learner" });
  };

  const handleToggleStatus = (id: string) => {
    setUsers(
      users.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === "active" ? ("suspended" as const) : ("active" as const);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleRoleChange = (id: string, newRole: typeof users[0]["role"]) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Global Users</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Search, edit permissions, and moderate all platform user accounts.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Register Sidebar Form */}
        <div className="border border-border p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Add New User</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Create a mock profile</p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Richard Hendricks"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. richard@piedpiper.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Global Platform Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              >
                <option value="learner">Learner (Student)</option>
                <option value="owner">Institution Owner (Creator)</option>
                <option value="instructor">Academy Instructor (Teacher)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity"
            >
              Add Profile
            </button>
          </form>
        </div>

        {/* Directory Ledger */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-headline-sm font-bold">Accounts Directory</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Ledger of all registered accounts</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name or email..."
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
                  <th className="p-3 text-label-xs uppercase font-bold">User</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Role</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Enrollments</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Date Joined</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                  <th className="p-3 text-label-xs uppercase font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-body-sm text-muted-foreground">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{user.name}</div>
                        <div className="text-label-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className="p-1.5 bg-background border border-border text-label-sm uppercase tracking-wider outline-none focus:border-foreground rounded-none"
                        >
                          <option value="learner">learner</option>
                          <option value="owner">owner</option>
                          <option value="instructor">instructor</option>
                        </select>
                      </td>
                      <td className="p-3 font-semibold">{user.enrollments}</td>
                      <td className="p-3 text-muted-foreground">{user.createdAt}</td>
                      <td className="p-3">
                        <BadgeStatus status={user.status} />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`text-label-xs uppercase tracking-wider font-bold hover:underline transition-all
                            ${user.status === "active" ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {user.status === "active" ? "Suspend" : "Activate"}
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
    </div>
  );
}
