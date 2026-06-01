import type { ID, Status, SocialLinks, Address } from "./common";

export interface Institution {
  id: ID;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  banner?: string;
  introVideoUrl?: string;
  categories: string[];
  tags: string[];
  status: Status;
  isVerified: boolean;
  plan: InstitutionPlan;
  ownerId: ID;
  ownerName: string;
  memberCount: number;
  studentCount: number;
  courseCount: number;
  rating: number;
  reviewCount: number;
  followersCount: number;
  address?: Address;
  socialLinks: SocialLinks;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  foundedYear?: number;
  achievements: string[];
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
  institutionType?: InstitutionType;
}

export type InstitutionType =
  | "general"
  | "college_university"
  | "corporate_training"
  | "edtech_startup"
  | "k12_school"
  | "workshop_seminar"
  | "organization";

export type InstitutionPlan = "free" | "starter" | "pro" | "business" | "enterprise";

export interface InstitutionMember {
  id: ID;
  institutionId: ID;
  userId: ID;
  name: string;
  email: string;
  avatar?: string;
  role: InstitutionRole;
  permissions: Permission[];
  joinedAt: string;
  lastActiveAt?: string;
  status: Status;
}

export type InstitutionRole =
  | "owner"
  | "co_owner"
  | "lead_instructor"
  | "instructor"
  | "teaching_assistant"
  | "doubt_solver"
  | "content_manager"
  | "marketing_manager"
  | "support_agent"
  | "finance_viewer";

export type Permission =
  | "courses.create"
  | "courses.edit"
  | "courses.delete"
  | "courses.publish"
  | "students.view"
  | "students.manage"
  | "doubts.view"
  | "doubts.answer"
  | "analytics.view"
  | "payments.view"
  | "payments.manage"
  | "team.manage"
  | "settings.manage"
  | "ai.use";

export interface InstitutionMembership {
  id: ID;
  institutionId: ID;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "yearly" | "lifetime";
  features: string[];
  courseAccess: "all" | "selected";
  selectedCourseIds?: ID[];
  studentLimit?: number;
  isPopular?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface InstitutionReview {
  id: ID;
  institutionId: ID;
  userId: ID;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface InstitutionAnnouncement {
  id: ID;
  institutionId: ID;
  title: string;
  content: string;
  authorId: ID;
  authorName: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}
