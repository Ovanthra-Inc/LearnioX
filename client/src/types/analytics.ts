import type { ID, TrendDirection } from "./common";

export interface AnalyticsStat {
  label: string;
  value: number | string;
  change?: number; // percentage
  trend?: TrendDirection;
  prefix?: string;
  suffix?: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  enrollments: number;
  refunds: number;
}

export interface WatchTimeDataPoint {
  date: string;
  hours: number;
}

export interface CourseAnalytics {
  courseId: ID;
  courseTitle: string;
  enrollments: number;
  completions: number;
  revenue: number;
  rating: number;
  watchTimeHours: number;
  dropoffLesson?: string;
  completionRate: number;
}

export interface StudioAnalyticsSummary {
  totalRevenue: number;
  revenueChange: number;
  activeLearners: number;
  learnersChange: number;
  totalEnrollments: number;
  enrollmentsChange: number;
  watchTimeHours: number;
  watchTimeChange: number;
  pendingDoubts: number;
  completionRate: number;
  completionRateChange: number;
}

export interface LearnerAnalyticsSummary {
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  memberships: number;
  pendingDoubts: number;
  watchTimeHours: number;
}

export interface AdminAnalyticsSummary {
  totalUsers: number;
  totalInstitutions: number;
  totalCourses: number;
  totalRevenue: number;
  activeUsers30d: number;
  newInstitutions30d: number;
}
