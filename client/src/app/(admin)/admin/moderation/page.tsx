"use client";

import { useState } from "react";
import { Search, ShieldAlert, Check, Trash2, HelpCircle, Star, Building } from "lucide-react";
import { MOCK_MODERATION_QUEUE } from "@/lib/mock-data/admin";
import { formatRelativeTime } from "@/lib/utils";

interface ModerationItem {
  id: string;
  type: "review" | "doubt" | "institution";
  content: string;
  courseId?: string;
  reportedBy: string;
  createdAt: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
}

export default function AdminModerationPage() {
  const [queue, setQueue] = useState<ModerationItem[]>(
    MOCK_MODERATION_QUEUE.map((item) => ({
      ...item,
      status: item.status as any,
    }))
  );
  const [search, setSearch] = useState("");

  const handleResolve = (id: string, action: "resolve" | "dismiss") => {
    setQueue(
      queue.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: action === "resolve" ? ("resolved" as const) : ("dismissed" as const),
          };
        }
        return item;
      })
    );
  };

  const filteredQueue = queue.filter(
    (item) =>
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.reportedBy.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Moderation Queue</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Resolve reported comments, reviews, doubts, or flagged institution profiles.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Total Reports Flagged</p>
          <p className="text-headline-lg font-bold mt-2">{queue.length}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Pending Review</p>
          <p className="text-headline-lg font-bold mt-2">
            {queue.filter((q) => q.status === "pending" || q.status === "reviewing").length}
          </p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Resolved Today</p>
          <p className="text-headline-lg font-bold mt-2">
            {queue.filter((q) => q.status === "resolved" || q.status === "dismissed").length}
          </p>
        </div>
      </div>

      {/* Queue List */}
      <div className="border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Audit Log Queue</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Items flagged by users or auto-filters</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredQueue.length === 0 ? (
            <div className="p-8 text-center text-body-sm text-muted-foreground border border-border">
              All clear! No pending reported content in the queue.
            </div>
          ) : (
            filteredQueue.map((item) => (
              <div
                key={item.id}
                className={`p-5 border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all
                  ${
                    item.status === "resolved" || item.status === "dismissed"
                      ? "border-border bg-surface-container/50 opacity-60"
                      : "border-foreground bg-surface"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    {item.type === "review" ? (
                      <Star className="w-5 h-5 text-foreground" />
                    ) : item.type === "doubt" ? (
                      <HelpCircle className="w-5 h-5 text-foreground" />
                    ) : (
                      <Building className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-label-xs uppercase font-bold border border-border px-1">
                        {item.type}
                      </span>
                      <span className="text-label-xs text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-body-sm text-foreground font-semibold mt-2">
                      {item.content}
                    </p>
                    <p className="text-label-xs text-muted-foreground uppercase mt-1">
                      Flagged by: {item.reportedBy} {item.courseId ? `• Course: ${item.courseId}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-3">
                  {item.status === "pending" || item.status === "reviewing" ? (
                    <>
                      <button
                        onClick={() => handleResolve(item.id, "dismiss")}
                        className="px-3 py-1.5 border border-border hover:border-foreground text-label-xs uppercase tracking-wider font-bold transition-all"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => handleResolve(item.id, "resolve")}
                        className="px-3 py-1.5 bg-foreground text-background text-label-xs uppercase tracking-wider font-bold hover:opacity-85 transition-opacity"
                      >
                        Takedown Content
                      </button>
                    </>
                  ) : (
                    <span className="text-label-xs font-bold uppercase text-muted-foreground">
                      Status: {item.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
