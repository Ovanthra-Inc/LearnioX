"use client"

import React, { useState } from "react"
import {
  UserPlus,
  Shield,
  Check,
  Search,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
} from "lucide-react"
import { FacultyAssignee, CommunityChannel } from "@/types/community"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface TeacherInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  channel: CommunityChannel
  onAssignTeacher: (teacher: FacultyAssignee) => void
  onRemoveTeacher?: (teacherId: string) => void
}

// Institution Faculty Directory
const INSTITUTION_FACULTY: FacultyAssignee[] = [
  {
    id: "u-owner",
    name: "Dr. Sarah Chen",
    email: "sarah.chen@ovanthra.edu",
    role: "OWNER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "u-instructor-2",
    name: "Alex Rivera",
    email: "alex.rivera@ovanthra.edu",
    role: "INSTRUCTOR",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "u-ta-1",
    name: "Kavya Patel",
    email: "kavya.patel@ovanthra.edu",
    role: "TA",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "u-admin-1",
    name: "Marcus Aurelius",
    email: "marcus@ovanthra.edu",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "u-instructor-3",
    name: "Dr. Elena Rostova",
    email: "elena.rostova@ovanthra.edu",
    role: "INSTRUCTOR",
  },
  {
    id: "u-ta-2",
    name: "Devon Vance",
    email: "devon.vance@ovanthra.edu",
    role: "TA",
  },
]

export function TeacherInvitationModal({
  isOpen,
  onClose,
  channel,
  onAssignTeacher,
  onRemoveTeacher,
}: TeacherInvitationModalProps) {
  const [search, setSearch] = useState("")

  if (!isOpen) return null

  const assignedIds = new Set([
    channel.channelLead?.id,
    ...(channel.assignedFaculty?.map((f) => f.id) || []),
  ])

  const filteredTeachers = INSTITUTION_FACULTY.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (teacher: FacultyAssignee) => {
    if (assignedIds.has(teacher.id)) {
      if (teacher.id === channel.channelLead?.id) {
        toast.error("Cannot remove the Channel Lead educator.")
        return
      }
      onRemoveTeacher?.(teacher.id)
    } else {
      onAssignTeacher(teacher)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground font-sans flex items-center gap-2">
                <span>Invite Teacher to Channel</span>
                <code className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                  #{channel.title}
                </code>
              </h3>
              <p className="text-xs text-muted-foreground">
                Assign educators or TAs to moderate, answer doubts, and broadcast announcements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, email, or role..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
          />
        </div>

        {/* Faculty List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {filteredTeachers.map((teacher) => {
            const isAssigned = assignedIds.has(teacher.id)
            const isLead = teacher.id === channel.channelLead?.id

            return (
              <div
                key={teacher.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-colors",
                  isAssigned
                    ? "bg-primary/5 border-primary/20"
                    : "bg-background/60 border-border hover:bg-secondary/60"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-secondary font-bold text-xs text-foreground shrink-0 overflow-hidden border border-border">
                    {teacher.avatar ? (
                      <img src={teacher.avatar} alt={teacher.name} className="size-full object-cover" />
                    ) : (
                      <span>{teacher.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="grid leading-tight min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground truncate">{teacher.name}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase border",
                          teacher.role === "OWNER"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : teacher.role === "INSTRUCTOR"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        )}
                      >
                        {teacher.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">{teacher.email}</span>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isLead ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Channel Lead
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggle(teacher)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                        isAssigned
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                      )}
                    >
                      {isAssigned ? (
                        <>
                          <Check className="size-3" />
                          <span>Assigned</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-3" />
                          <span>Assign</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-border text-xs text-muted-foreground">
          <span>{channel.assignedFaculty?.length || 0} additional faculty assigned</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-secondary hover:bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  )
}
