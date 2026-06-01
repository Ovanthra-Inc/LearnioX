import type { ID, Role, Status, SocialLinks } from "./common";

export interface User {
  id: ID;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  role: Role;
  status: Status;
  isEmailVerified: boolean;
  phone?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLinks;
  expertise?: string[];
  institutionId?: ID; // for institution members
  createdAt: string;
  lastLoginAt?: string;
}

export interface LearnerProfile extends User {
  enrollmentCount: number;
  completedCourseCount: number;
  certificateCount: number;
  watchTimeHours: number;
  xpPoints: number;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface InstructorProfile extends User {
  title: string;
  institutionIds: ID[];
  courseCount: number;
  studentCount: number;
  rating: number;
  reviewCount: number;
  totalEarnings?: number;
  bio: string;
  expertise: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: "learner" | "creator";
}
