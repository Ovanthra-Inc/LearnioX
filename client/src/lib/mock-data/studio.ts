import type { StudioAnalyticsSummary, CourseAnalytics, RevenueDataPoint } from "@/types/analytics";
import type { Notification } from "@/types/common";

export const MOCK_STUDIO_ANALYTICS: StudioAnalyticsSummary = {
  totalRevenue: 124500,
  revenueChange: 12.5,
  activeLearners: 8240,
  learnersChange: 5.2,
  totalEnrollments: 15302,
  enrollmentsChange: 0,
  watchTimeHours: 45120,
  watchTimeChange: 18.1,
  pendingDoubts: 142,
  completionRate: 68,
  completionRateChange: 2.4,
};

export const MOCK_COURSE_ANALYTICS: CourseAnalytics[] = [
  { courseId: "course-3", courseTitle: "Advanced UI/UX Architecture", enrollments: 4210, completions: 2870, revenue: 42100, rating: 4.9, watchTimeHours: 18200, completionRate: 68 },
  { courseId: "course-4", courseTitle: "Design Systems in React", enrollments: 3850, completions: 2888, revenue: 38500, rating: 4.8, watchTimeHours: 15400, completionRate: 75 },
  { courseId: "course-5", courseTitle: "Typography Mastery", enrollments: 2100, completions: 1764, revenue: 21000, rating: 4.7, watchTimeHours: 8400, completionRate: 84 },
  { courseId: "course-6", courseTitle: "Grid Layouts Deep Dive", enrollments: 1540, completions: 924, revenue: 15400, rating: 4.9, watchTimeHours: 6160, completionRate: 60 },
];

export const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { date: "2024-11-01", revenue: 8200, enrollments: 82, refunds: 240 },
  { date: "2024-12-01", revenue: 9100, enrollments: 91, refunds: 180 },
  { date: "2025-01-01", revenue: 10400, enrollments: 104, refunds: 310 },
  { date: "2025-02-01", revenue: 9800, enrollments: 98, refunds: 290 },
  { date: "2025-03-01", revenue: 11200, enrollments: 112, refunds: 220 },
  { date: "2025-04-01", revenue: 10600, enrollments: 106, refunds: 380 },
  { date: "2025-05-01", revenue: 12400, enrollments: 124, refunds: 150 },
];

export const MOCK_STUDIO_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "enrollment",
    title: "New Enrollment",
    message: "A new student enrolled in Advanced UI/UX Architecture",
    isRead: false,
    createdAt: "2024-05-28T10:10:00Z",
    actionUrl: "/studio/students",
  },
  {
    id: "notif-2",
    type: "doubt",
    title: "New Doubt",
    message: "Sarah J. asked a question in Design Systems in React",
    isRead: false,
    createdAt: "2024-05-28T09:45:00Z",
    actionUrl: "/studio/doubts",
  },
  {
    id: "notif-3",
    type: "payment",
    title: "Payment Received",
    message: "₹999 membership renewal from Mike T.",
    isRead: true,
    createdAt: "2024-05-27T14:00:00Z",
    actionUrl: "/studio/payments",
  },
];

export const MOCK_UPCOMING_LIVE_CLASSES = [
  {
    id: "live-1",
    title: "Live Q&A: Grid Systems",
    scheduledAt: "2024-05-28T14:00:00Z",
    duration: 90,
    registeredCount: 142,
    status: "scheduled",
  },
  {
    id: "live-2",
    title: "Workshop: Building Design Tokens",
    scheduledAt: "2024-05-29T10:00:00Z",
    duration: 120,
    registeredCount: 89,
    status: "scheduled",
  },
  {
    id: "live-3",
    title: "Portfolio Review Session",
    scheduledAt: "2024-05-31T16:00:00Z",
    duration: 60,
    registeredCount: 34,
    status: "scheduled",
  },
];

export const MOCK_ACTIVITY_LOGS = [
  { id: "log-1", timestamp: "2024-05-28T10:00:00Z", message: "New enrollment in Typography Mastery by user@example.com", type: "enrollment" as const },
  { id: "log-2", timestamp: "2024-05-28T09:00:00Z", message: "System backup completed successfully.", type: "system" as const },
  { id: "log-3", timestamp: "2024-05-28T07:30:00Z", message: "Module 3 content updated by Admin Sarah", type: "content" as const },
  { id: "log-4", timestamp: "2024-05-27T20:00:00Z", message: "Coupon DESIGN50 was used 12 times today", type: "marketing" as const },
  { id: "log-5", timestamp: "2024-05-27T18:00:00Z", message: "Certificate issued to Arjun Patel for Design Systems course", type: "certificate" as const },
];
