"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Check, 
  Play, 
  Lock, 
  Clock, 
  BookOpen, 
  Globe, 
  Award, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Share2, 
  CheckSquare
} from "lucide-react";
import { getCourseBySlug, MOCK_COURSE_REVIEWS } from "@/lib/mock-data/courses";
import { MOCK_ENROLLMENTS } from "@/lib/mock-data/learner";
import { formatCurrency, formatDuration, formatNumber } from "@/lib/utils";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const course = getCourseBySlug(slug);

  // Accordion state for modules
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "instructors" | "reviews">("overview");

  if (!course) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-headline-md font-bold text-foreground">Course Not Found</h1>
        <p className="text-muted-foreground">The course with slug "{slug}" does not exist.</p>
        <Link
          href="/search"
          className="inline-block px-6 py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
        >
          Browse All Courses
        </Link>
      </div>
    );
  }

  // Check enrollment
  const isEnrolled = MOCK_ENROLLMENTS.some((e) => e.courseId === course.id);
  const enrollment = MOCK_ENROLLMENTS.find((e) => e.courseId === course.id);

  // Toggle module expansion
  const toggleModule = (id: string) => {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedModules(course.modules.map((m) => m.id));
  };

  const collapseAll = () => {
    setExpandedModules([]);
  };

  // Pricing calculations
  const hasDiscount = course.originalPrice && course.originalPrice > (course.price || 0);
  const discountPercent = hasDiscount
    ? Math.round(((course.originalPrice! - course.price!) / course.originalPrice!) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto px-6 py-8">
      
      {/* Hero Header Section */}
      <div className="border border-border bg-card p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-start relative overflow-hidden">
        
        {/* Corner watermark badge for bestsellers */}
        {course.isBestseller && (
          <div className="absolute top-0 right-0 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 border-l border-b border-border">
            Bestseller
          </div>
        )}

        {/* Main Details */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap gap-2 text-label-sm uppercase tracking-wider font-bold">
            <Link href={`/search?category=${course.categoryId}`} className="text-muted-foreground hover:text-foreground">
              {course.categoryName}
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground capitalize">{course.level} Level</span>
          </div>

          <h1 className="text-headline-md md:text-headline-lg font-bold text-foreground leading-tight max-w-4xl">
            {course.title}
          </h1>

          <p className="text-body-lg text-muted-foreground leading-relaxed max-w-3xl">
            {course.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <span className="text-body-md font-bold text-foreground">{course.rating.toFixed(1)}</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(course.rating)
                        ? "text-foreground fill-foreground"
                        : "text-muted-foreground opacity-30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-body-sm text-muted-foreground">({formatNumber(course.reviewCount)} reviews)</span>
            </div>

            {/* Enrolled Count */}
            <span className="text-body-sm text-muted-foreground">
              <strong className="text-foreground font-bold">{formatNumber(course.enrollmentCount)}</strong> students enrolled
            </span>

            {/* Language */}
            <span className="text-body-sm text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> {course.language}
            </span>
          </div>

          {/* Instructor brief */}
          <div className="flex items-center gap-3 pt-3">
            <span className="text-label-sm uppercase tracking-wider text-muted-foreground">Created by</span>
            <div className="flex -space-x-2">
              {course.instructors.map((ins) => (
                <div key={ins.id} className="w-8 h-8 rounded-none border border-border bg-surface-container flex items-center justify-center font-bold text-xs uppercase text-foreground">
                  {ins.name.substring(0, 2)}
                </div>
              ))}
            </div>
            <span className="text-body-sm font-bold text-foreground">
              {course.instructors.map((i) => i.name).join(", ")}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <Link href={`/c/${course.institutionSlug}`} className="text-body-sm font-bold underline hover:text-muted-foreground">
              {course.institutionName}
            </Link>
          </div>
        </div>

        {/* Thumbnail Preview Area */}
        <div className="w-full lg:w-[380px] bg-surface-container border border-border p-3 space-y-4 flex-shrink-0">
          <div className="aspect-video relative border border-border bg-black group overflow-hidden">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-white flex items-center justify-center rounded-none shadow-lg">
                <Play className="w-5 h-5 text-black fill-current" />
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="space-y-4 pt-2">
            <div className="flex items-baseline gap-3">
              {course.pricingType === "free" ? (
                <span className="text-headline-md font-bold text-foreground">FREE</span>
              ) : (
                <>
                  <span className="text-headline-md font-bold text-foreground">
                    {formatCurrency(course.price || 0)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-body-md text-muted-foreground line-through">
                        {formatCurrency(course.originalPrice || 0)}
                      </span>
                      <span className="text-body-sm text-emerald-600 font-bold uppercase tracking-wider">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {isEnrolled ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-foreground" /> You are enrolled in this course
                </p>
                <Link
                  href={`/learn/watch/${enrollment?.progress.lastLessonId ?? "first"}`}
                  className="w-full block py-3.5 bg-foreground text-background text-center text-label-md uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
                >
                  Go to Classroom
                </Link>
              </div>
            ) : (
              <Link
                href={`/checkout/${course.id}`}
                className="w-full block py-3.5 bg-foreground text-background text-center text-label-md uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
              >
                {course.pricingType === "free" ? "Enroll Now" : "Buy Course"}
              </Link>
            )}

            <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider pt-2 border-t border-border">
              <div className="py-2 border-r border-border">
                <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-foreground" />
                {Math.round(course.totalDuration / 3600)} Hours Content
              </div>
              <div className="py-2">
                <Award className="w-3.5 h-3.5 mx-auto mb-1 text-foreground" />
                {course.certificate ? "Certificate Included" : "No Certificate"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border bg-card">
        {[
          { id: "overview", label: "Overview" },
          { id: "curriculum", label: `Curriculum (${course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons)` },
          { id: "instructors", label: "Instructors" },
          { id: "reviews", label: `Reviews (${course.reviewCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 text-label-sm uppercase tracking-widest font-bold border-r border-border transition-colors ${
              activeTab === tab.id
                ? "bg-surface-container text-foreground border-b-2 border-b-foreground"
                : "text-muted-foreground hover:bg-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main content info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-headline-sm font-bold uppercase tracking-tight">About this course</h3>
                <p className="text-body-md text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {course.description}
                </p>
              </div>

              {/* What you'll learn */}
              {course.outcomes.length > 0 && (
                <div className="border border-border p-6 bg-card space-y-4">
                  <h3 className="text-label-md font-bold uppercase tracking-wider text-foreground">
                    What you will learn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.outcomes.map((outcome, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-body-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements & Target Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {course.requirements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Requirements</h3>
                    <ul className="list-disc pl-5 space-y-2 text-body-sm text-muted-foreground">
                      {course.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.targetAudience.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Target Audience</h3>
                    <ul className="list-disc pl-5 space-y-2 text-body-sm text-muted-foreground">
                      {course.targetAudience.map((audience, idx) => (
                        <li key={idx}>{audience}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Curriculum Tab */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-body-sm text-muted-foreground">
                  {course.totalModules} modules • {course.totalLessons} lessons
                </span>
                <div className="flex gap-4">
                  <button onClick={expandAll} className="text-xs font-bold text-foreground uppercase tracking-widest hover:underline">
                    Expand All
                  </button>
                  <button onClick={collapseAll} className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:underline">
                    Collapse All
                  </button>
                </div>
              </div>

              {course.modules.length === 0 ? (
                <div className="border border-border p-12 text-center text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Curriculum is still being planned. Check back soon!</p>
                </div>
              ) : (
                <div className="border border-border divide-y divide-border">
                  {course.modules.map((mod) => {
                    const isExpanded = expandedModules.includes(mod.id);
                    return (
                      <div key={mod.id} className="flex flex-col bg-card">
                        {/* Header */}
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-container transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                              Module {mod.order}
                            </span>
                            <h4 className="text-body-sm font-bold text-foreground mt-0.5">{mod.title}</h4>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0 text-muted-foreground">
                            <span className="text-xs font-mono">{mod.lessons.length} Lessons</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {/* Lessons List */}
                        {isExpanded && (
                          <div className="bg-surface divide-y divide-border/60 border-t border-border">
                            {mod.lessons.map((les) => (
                              <div key={les.id} className="flex items-center justify-between p-4 pl-6 text-sm">
                                <div className="flex items-start gap-3 min-w-0">
                                  <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-body-sm font-semibold text-foreground leading-snug">{les.title}</p>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{les.type}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                  {les.duration && (
                                    <span className="text-xs text-muted-foreground font-mono">{formatDuration(les.duration)}</span>
                                  )}
                                  {les.isPreview ? (
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                      <Play className="w-3 h-3 fill-current" /> Preview
                                    </span>
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Instructors Tab */}
          {activeTab === "instructors" && (
            <div className="space-y-6">
              {course.instructors.map((ins) => (
                <div key={ins.id} className="border border-border bg-card p-6 flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-container border border-border flex items-center justify-center text-headline-sm font-bold uppercase text-muted-foreground flex-shrink-0">
                    {ins.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="text-body-lg font-bold text-foreground">{ins.name}</h4>
                      <p className="text-body-sm text-muted-foreground font-medium">{ins.title}</p>
                    </div>
                    <p className="text-body-sm text-muted-foreground leading-relaxed">
                      Lead instructor at {course.institutionName}. Dr. Sharma is a senior researcher with a decade of engineering experience building and deploying machine learning applications at scale.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-8 justify-center">
                <div className="text-center space-y-1">
                  <p className="text-display-sm font-bold text-foreground">{course.rating.toFixed(1)}</p>
                  <div className="flex justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(course.rating) ? "text-foreground fill-foreground" : "text-muted-foreground opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold pt-1">
                    Course Rating
                  </p>
                </div>

                <div className="flex-1 w-full max-w-xs space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const percent = stars === 5 ? 85 : stars === 4 ? 12 : stars === 3 ? 2 : stars === 2 ? 1 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-mono">{stars}</span>
                        <Star className="w-3 h-3 fill-foreground text-foreground" />
                        <div className="flex-1 bg-surface-container h-2 border border-border">
                          <div className="bg-foreground h-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-8 text-right text-muted-foreground font-mono">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {MOCK_COURSE_REVIEWS.filter((r) => r.courseId === course.id).length === 0 ? (
                  <div className="border border-border p-8 text-center text-muted-foreground">
                    <p className="text-sm">No reviews posted yet for this course.</p>
                  </div>
                ) : (
                  MOCK_COURSE_REVIEWS.filter((r) => r.courseId === course.id).map((rev) => (
                    <div key={rev.id} className="border border-border p-5 bg-card space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-body-sm font-bold text-foreground">{rev.userName}</p>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? "text-foreground fill-foreground" : "text-muted-foreground opacity-30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-body-sm text-muted-foreground leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Institution Card / B2B panel */}
        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h4 className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">
              Offered By
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-border bg-surface-container flex items-center justify-center font-bold text-sm text-muted-foreground">
                AC
              </div>
              <div>
                <h5 className="text-body-md font-bold text-foreground">{course.institutionName}</h5>
                <p className="text-xs text-muted-foreground">Coaching Institution</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trusted training provider in professional engineering education. Learn directly with live support and graded tests.
            </p>
            <Link
              href={`/c/${course.institutionSlug}`}
              className="w-full text-center block border border-border hover:border-foreground py-2 text-label-sm uppercase tracking-wider font-bold transition-colors"
            >
              Visit Institution Profile
            </Link>
          </div>

          <div className="border border-border bg-card p-5 space-y-4">
            <h4 className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">
              Institutional License
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you looking to enroll 5 or more students from your academy or organization? Get corporate license discount options.
            </p>
            <button className="w-full border border-border hover:border-foreground py-2 text-label-sm uppercase tracking-wider font-bold transition-colors">
              Contact Licensing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
