import type { AdminAnalyticsSummary } from "@/types/analytics";

export const MOCK_ADMIN_ANALYTICS: AdminAnalyticsSummary = {
  totalUsers: 142800,
  totalInstitutions: 2840,
  totalCourses: 18500,
  totalRevenue: 48200000,
  activeUsers30d: 28400,
  newInstitutions30d: 124,
};

export const MOCK_ADMIN_USERS_TABLE = [
  { id: "u1", name: "Alex Johnson", email: "alex@example.com", role: "learner" as const, status: "active" as const, createdAt: "2023-09-01", enrollments: 12 },
  { id: "u2", name: "Ritu Kapoor", email: "ritu@designinstitute.in", role: "owner" as const, status: "active" as const, createdAt: "2024-02-01", enrollments: 0 },
  { id: "u3", name: "Dr. Ankit Sharma", email: "ankit@techglobal.edu.in", role: "instructor" as const, status: "active" as const, createdAt: "2024-01-01", enrollments: 0 },
  { id: "u4", name: "Sarah J.", email: "sarah.j@example.com", role: "learner" as const, status: "active" as const, createdAt: "2024-03-01", enrollments: 5 },
  { id: "u5", name: "Blocked User", email: "blocked@spam.com", role: "learner" as const, status: "suspended" as const, createdAt: "2024-04-01", enrollments: 0 },
];

export const MOCK_ADMIN_INSTITUTIONS_TABLE = [
  { id: "inst-1", name: "TechGlobal Institute", plan: "pro" as const, status: "active" as const, isVerified: true, students: 45200, courses: 18, revenue: 8200000 },
  { id: "inst-2", name: "Quantum Logic Academy", plan: "business" as const, status: "active" as const, isVerified: true, students: 18400, courses: 9, revenue: 3400000 },
  { id: "inst-3", name: "Design Institute", plan: "pro" as const, status: "active" as const, isVerified: true, students: 22100, courses: 12, revenue: 4100000 },
  { id: "inst-4", name: "DataSys Academy", plan: "starter" as const, status: "active" as const, isVerified: false, students: 8900, courses: 6, revenue: 1200000 },
  { id: "inst-5", name: "CyberSec Institute", plan: "pro" as const, status: "active" as const, isVerified: true, students: 12800, courses: 8, revenue: 2900000 },
];

export const MOCK_MODERATION_QUEUE = [
  { id: "mod-1", type: "review" as const, content: "Suspected fake review with repeated text pattern", courseId: "course-1", reportedBy: "auto-system", createdAt: "2024-05-28T08:00:00Z", status: "pending" as const },
  { id: "mod-2", type: "doubt" as const, content: "Inappropriate language in doubt question in module 3", courseId: "course-3", reportedBy: "user-learner-3", createdAt: "2024-05-27T14:00:00Z", status: "pending" as const },
  { id: "mod-3", type: "institution" as const, content: "Institution claims accreditation not verified", courseId: undefined, reportedBy: "user-learner-4", createdAt: "2024-05-26T10:00:00Z", status: "reviewing" as const },
];

export const MOCK_PLATFORM_STATS_OVER_TIME = [
  { month: "Dec 2024", users: 98000, institutions: 2400, courses: 14200, revenue: 38000000 },
  { month: "Jan 2025", users: 108000, institutions: 2520, courses: 15100, revenue: 40000000 },
  { month: "Feb 2025", users: 118000, institutions: 2640, courses: 16000, revenue: 42000000 },
  { month: "Mar 2025", users: 128000, institutions: 2720, courses: 17000, revenue: 44500000 },
  { month: "Apr 2025", users: 136000, institutions: 2780, courses: 17800, revenue: 46800000 },
  { month: "May 2025", users: 142800, institutions: 2840, courses: 18500, revenue: 48200000 },
];
