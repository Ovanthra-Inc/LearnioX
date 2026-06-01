"use client";

import { useState } from "react";
import { UserCheck, Plus, Search, Trash2, Mail, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "instructor" | "moderator";
  status: "active" | "invited";
  joinedAt: string;
}

export default function StudioTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([
    {
      id: "tm-1",
      name: "Ritu Kapoor",
      email: "ritu@designinstitute.in",
      role: "owner",
      status: "active",
      joinedAt: "2024-02-01",
    },
    {
      id: "tm-2",
      name: "Dr. Ankit Sharma",
      email: "ankit@techglobal.edu.in",
      role: "instructor",
      status: "active",
      joinedAt: "2024-01-01",
    },
    {
      id: "tm-3",
      name: "Sarah J.",
      email: "sarah.j@example.com",
      role: "moderator",
      status: "active",
      joinedAt: "2024-03-01",
    },
    {
      id: "tm-4",
      name: "Pranav Gupta",
      email: "pranav@example.com",
      role: "moderator",
      status: "invited",
      joinedAt: "2026-05-28",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("instructor");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const added: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteEmail.split("@")[0], // Fallback name
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "invited",
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setTeam([...team, added]);
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteRole("instructor");
  };

  const handleRoleChange = (id: string, newRole: TeamMember["role"]) => {
    setTeam(team.map((t) => (t.id === id ? { ...t, role: newRole } : t)));
  };

  const handleRemove = (id: string) => {
    setTeam(team.filter((t) => t.id !== id));
  };

  const filteredTeam = team.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Team Management</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Manage your academy's staff, instructors, and moderation permissions.
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Invite Staff Member
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Total Staff</p>
          <p className="text-headline-lg font-bold mt-2">{team.length}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Instructors</p>
          <p className="text-headline-lg font-bold mt-2">
            {team.filter((t) => t.role === "instructor").length}
          </p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Moderators</p>
          <p className="text-headline-lg font-bold mt-2">
            {team.filter((t) => t.role === "moderator").length}
          </p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Administrators</p>
          <p className="text-headline-lg font-bold mt-2">
            {team.filter((t) => t.role === "admin" || t.role === "owner").length}
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Member Sidebar Form */}
        <div className="border border-border p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-headline-sm font-bold">Invite Member</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Configure roles & permissions</p>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. colleague@designinstitute.in"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Staff Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              >
                <option value="instructor">Instructor</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity"
            >
              Send Invitation
            </button>
          </form>

          {/* Permissions Helper */}
          <div className="bg-surface-container border border-border p-4 space-y-3">
            <h4 className="text-label-sm uppercase font-bold text-foreground flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-foreground" />
              Permissions Guide
            </h4>
            <div className="space-y-2 text-body-sm text-muted-foreground">
              <p>
                <strong>Instructor:</strong> Edit courses curriculum, record announcements, set quizzes.
              </p>
              <p>
                <strong>Moderator:</strong> Resolve doubts queue, review assignment submissions, clear spam.
              </p>
              <p>
                <strong>Admin:</strong> Complete financial setups, change team roles, update institution verification.
              </p>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-headline-sm font-bold">Staff Directory</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Members of this institution</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground bg-surface-container">
                  <th className="p-3 text-label-xs uppercase font-bold">Staff Member</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Role</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Date Joined</th>
                  <th className="p-3 text-label-xs uppercase font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-body-sm text-muted-foreground">
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{member.name}</div>
                        <div className="text-label-xs text-muted-foreground">{member.email}</div>
                      </td>
                      <td className="p-3">
                        {member.role === "owner" ? (
                          <span className="text-label-sm uppercase font-bold text-foreground">
                            Owner
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                            className="p-1.5 bg-background border border-border text-label-sm uppercase tracking-wider outline-none focus:border-foreground rounded-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
                            <option value="moderator">Moderator</option>
                          </select>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                            ${
                              member.status === "active"
                                ? "bg-foreground text-background"
                                : "bg-muted-foreground/20 text-muted-foreground"
                            }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(member.joinedAt)}</td>
                      <td className="p-3 text-right">
                        {member.role !== "owner" ? (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="text-label-xs uppercase tracking-wider text-muted-foreground hover:text-foreground font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        ) : (
                          <span className="text-label-xs text-muted-foreground uppercase font-bold">
                            Protected
                          </span>
                        )}
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
