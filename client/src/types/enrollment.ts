import type { ID } from "./common";

export interface Enrollment {
  id: ID;
  courseId: ID;
  courseTitle: string;
  courseThumbnail?: string;
  institutionId: ID;
  institutionName: string;
  userId: ID;
  enrolledAt: string;
  expiresAt?: string;
  accessType: "purchased" | "membership" | "free" | "invited";
  progress: LearnerProgress;
  certificateId?: ID;
  certificateIssuedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface LearnerProgress {
  enrollmentId: ID;
  courseId: ID;
  completionPercentage: number;
  completedLessons: ID[];
  totalLessons: number;
  watchTimeSeconds: number;
  lastLessonId?: ID;
  lastLessonTitle?: string;
}

export interface LessonProgress {
  lessonId: ID;
  userId: ID;
  isCompleted: boolean;
  watchedSeconds: number;
  totalSeconds: number;
  lastWatchedAt?: string;
  quizScore?: number;
  assignmentSubmitted?: boolean;
}

export interface Note {
  id: ID;
  userId: ID;
  courseId: ID;
  courseTitle: string;
  lessonId: ID;
  lessonTitle: string;
  content: string;
  timestamp?: number; // video timestamp in seconds
  createdAt: string;
  updatedAt: string;
}

export interface Doubt {
  id: ID;
  userId: ID;
  userName: string;
  userAvatar?: string;
  courseId: ID;
  courseTitle: string;
  lessonId?: ID;
  lessonTitle?: string;
  question: string;
  description?: string;
  attachments?: string[];
  status: "pending" | "answered" | "closed";
  answeredBy?: ID;
  answeredByName?: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
}

export interface AssignmentSubmission {
  id: ID;
  assignmentId: ID;
  userId: ID;
  courseId: ID;
  submittedAt: string;
  content?: string;
  fileUrl?: string;
  linkUrl?: string;
  status: "submitted" | "reviewing" | "graded" | "rejected";
  score?: number;
  maxScore: number;
  feedback?: string;
  reviewedBy?: ID;
  reviewedAt?: string;
}

export interface Certificate {
  id: ID;
  userId: ID;
  userName: string;
  courseId: ID;
  courseTitle: string;
  institutionId: ID;
  institutionName: string;
  issuedAt: string;
  verificationCode: string;
  verificationUrl: string;
  templateId?: ID;
  grade?: string;
}

export interface MembershipSubscription {
  id: ID;
  userId: ID;
  institutionId: ID;
  institutionName: string;
  membershipId: ID;
  membershipName: string;
  price: number;
  billingCycle: string;
  status: "active" | "expired" | "cancelled" | "paused";
  startedAt: string;
  expiresAt?: string;
  renewsAt?: string;
  paymentMethod?: string;
}

export interface Payment {
  id: ID;
  userId: ID;
  institutionId?: ID;
  courseId?: ID;
  membershipId?: ID;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  method: "card" | "upi" | "netbanking" | "wallet" | "emi";
  gateway: "razorpay" | "stripe";
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  invoice?: string;
  paidAt?: string;
  createdAt: string;
  description: string;
}
