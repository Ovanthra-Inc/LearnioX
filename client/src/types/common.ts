// ============================================================
// LearnioX — Common Types
// ============================================================

export type ID = string;

export type Role = "learner" | "owner" | "instructor" | "admin" | "super_admin";

export type Status = "active" | "inactive" | "pending" | "suspended";

export type Visibility = "public" | "private" | "unlisted";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type PricingType = "free" | "paid" | "membership";

export type TrendDirection = "up" | "down" | "flat";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  success: boolean;
  message?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface Notification {
  id: ID;
  type: "enrollment" | "doubt" | "assignment" | "live_class" | "payment" | "certificate" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}
