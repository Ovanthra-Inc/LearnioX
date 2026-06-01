"use client";

import { Bell, ShieldAlert, Award, FileQuestion, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "doubt",
    title: "Doubt question answered",
    body: "Instructor Ritu Kapoor has answered your doubt regarding 'Storybook layout component parameters'.",
    createdAt: "2026-05-29T10:00:00Z",
    isRead: false,
  },
  {
    id: "notif-2",
    type: "grade",
    title: "Assignment graded",
    body: "Your worksheet 'Storybook Layout Component Build' has been evaluated. Grade: A-.",
    createdAt: "2026-05-27T16:00:00Z",
    isRead: true,
  },
  {
    id: "notif-3",
    type: "certificate",
    title: "Certificate issued",
    body: "Congratulations! Your completion certificate for 'Foundations of Structural UI Design' is now ready for verification.",
    createdAt: "2026-05-20T12:00:00Z",
    isRead: true,
  }
];

export default function LearnerNotificationsPage() {
  const getIcon = (type: string) => {
    switch (type) {
      case "doubt":
        return <MessageSquare className="w-5 h-5 text-foreground" />;
      case "grade":
        return <FileQuestion className="w-5 h-5 text-foreground" />;
      case "certificate":
        return <Award className="w-5 h-5 text-foreground" />;
      default:
        return <Bell className="w-5 h-5 text-foreground" />;
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-3xl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Notifications</h1>
          <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
            System notices and classroom activity alerts
          </p>
        </div>
        <button className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          Mark all read
        </button>
      </div>

      {/* Notifications list */}
      <div className="border border-border bg-card divide-y divide-border">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <div
            key={notif.id}
            className={`p-5 flex gap-4 items-start transition-colors ${
              !notif.isRead ? "bg-surface-container/20 border-l-2 border-foreground" : ""
            }`}
          >
            <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center flex-shrink-0">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between items-baseline gap-4">
                <h3 className={`text-body-sm font-bold leading-snug ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                  {notif.title}
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                  {formatRelativeTime(notif.createdAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {notif.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
