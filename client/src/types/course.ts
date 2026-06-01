import type { ID, DifficultyLevel, PricingType, Visibility } from "./common";

export interface Course {
  id: ID;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  previewVideoUrl?: string;
  institutionId: ID;
  institutionName: string;
  institutionSlug: string;
  instructorIds: ID[];
  instructors: CourseInstructor[];
  categoryId: ID;
  categoryName: string;
  tags: string[];
  level: DifficultyLevel;
  pricingType: PricingType;
  price?: number;
  originalPrice?: number;
  currency: string;
  visibility: Visibility;
  language: string;
  totalLessons: number;
  totalDuration: number; // in seconds
  totalModules: number;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  certificate: boolean;
  requirements: string[];
  outcomes: string[];
  targetAudience: string[];
  modules: CourseModule[];
  structureType?: CourseStructureType;
  directUrl?: string;
  directId?: ID;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  isBestseller?: boolean;
  isFeatured?: boolean;
}

export interface CourseInstructor {
  id: ID;
  name: string;
  avatar?: string;
  title: string;
}

export interface CourseModule {
  id: ID;
  courseId: ID;
  title: string;
  description?: string;
  order: number;
  isPreview: boolean;
  lessons: Lesson[];
  totalDuration: number;
}

export interface Lesson {
  id: ID;
  moduleId: ID;
  title: string;
  description?: string;
  type: "video" | "pdf" | "quiz" | "assignment" | "live" | "text" | "exam" | "notes" | "sandbox" | "lab";
  duration?: number; // in seconds
  order: number;
  isPreview: boolean;
  isLocked: boolean;
  videoUrl?: string;
  pdfUrl?: string;
  quizId?: ID;
  assignmentId?: ID;
  resources?: LessonResource[];
}

export interface LessonResource {
  id: ID;
  title: string;
  type: "pdf" | "link" | "zip" | "image";
  url: string;
  sizeKb?: number;
}

export interface Quiz {
  id: ID;
  courseId: ID;
  lessonId?: ID;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  maxAttempts: number;
  isGraded: boolean;
}

export interface QuizQuestion {
  id: ID;
  quizId: ID;
  question: string;
  type: "single" | "multiple" | "true_false" | "short_answer";
  options?: string[];
  correctAnswers: string[];
  explanation?: string;
  points: number;
  order: number;
}

export interface Assignment {
  id: ID;
  courseId: ID;
  lessonId?: ID;
  title: string;
  description: string;
  instructions: string;
  dueDate?: string;
  maxScore: number;
  submissionType: "text" | "file" | "link";
  allowedFileTypes?: string[];
  status: "draft" | "published";
}

export interface CourseReview {
  id: ID;
  courseId: ID;
  userId: ID;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  helpfulCount: number;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: ID;
  courseCount: number;
  order: number;
}

export type CourseStructureType = 
  | "modular" 
  | "video" 
  | "quiz" 
  | "assignment" 
  | "exam" 
  | "notes" 
  | "sandbox" 
  | "lab";

export interface Program {
  id: ID;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  institutionId: ID;
  courseIds: ID[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
