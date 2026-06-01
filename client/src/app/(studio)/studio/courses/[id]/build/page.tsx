"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import type { CourseStructureType } from "@/types/course";

interface CourseBuildPageProps {
  params: Promise<{ id: string }>;
}

export default function CourseBuildPage({ params }: CourseBuildPageProps) {
  const { id } = use(params);
  const course = MOCK_COURSES.find((c) => c.id === id) || MOCK_COURSES[0];

  const [title, setTitle] = useState(course.title);
  const [slug, setSlug] = useState(course.slug);
  const [desc, setDesc] = useState(course.description);
  const [level, setLevel] = useState(course.level);
  const [price, setPrice] = useState(course.price || 0);
  const [pricingType, setPricingType] = useState(course.pricingType);
  const [structureType, setStructureType] = useState<CourseStructureType>(
    course.structureType || "modular"
  );
  const [directUrl, setDirectUrl] = useState(course.directUrl || "");
  const [directId, setDirectId] = useState(course.directId || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist changes directly into the mock course object memory reference
    course.title = title;
    course.slug = slug;
    course.description = desc;
    course.level = level;
    course.pricingType = pricingType;
    course.price = price;
    course.structureType = structureType;
    course.directUrl = structureType !== "modular" && (structureType === "video" || structureType === "notes") ? directUrl : undefined;
    course.directId = structureType !== "modular" && (structureType !== "video" && structureType !== "notes") ? directId : undefined;
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-[800px] mx-auto py-6 font-sans space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/studio/courses"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>

      {/* Editor Card */}
      <form onSubmit={handleSave} className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Academy Studio</span>
            <h1 className="text-headline-sm font-bold text-foreground mt-0.5">Course Build Settings</h1>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>

        {isSaved && (
          <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Course parameters saved successfully!
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Course Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground resize-none"
            />
          </div>

          {/* Course Content Structure */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Course Content Structure</label>
            <select
              value={structureType}
              onChange={(e) => setStructureType(e.target.value as CourseStructureType)}
              className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground rounded-none"
            >
              <option value="modular">Modular Curriculum (Sections, Modules, Lessons)</option>
              <option value="video">Direct Video Broadcast</option>
              <option value="quiz">Direct Quiz Assessment</option>
              <option value="assignment">Direct Assignment Submission</option>
              <option value="exam">Direct Proctored Exam</option>
              <option value="notes">Direct Study Notes / PDF Document</option>
              <option value="sandbox">Direct Code Sandbox</option>
              <option value="lab">Direct Interactive Laboratory</option>
            </select>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
              Select if this course is modular (has sections/modules) or represents a single direct learning asset.
            </p>
          </div>

          {/* Direct Asset Parameters */}
          {structureType !== "modular" && (
            <div className="border border-border p-4 bg-surface space-y-4 rounded-none">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-foreground" />
                <span className="text-[10px] text-foreground uppercase font-bold tracking-widest">
                  Direct Asset Mapping ({structureType})
                </span>
              </div>
              
              {(structureType === "video" || structureType === "notes") && (
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Resource URL / File Path
                  </label>
                  <input
                    type="text"
                    required
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder={
                      structureType === "video"
                        ? "e.g., /videos/sample-lecture.mp4"
                        : "e.g., /docs/study-guide.pdf"
                    }
                    className="w-full p-3 border border-border bg-card text-foreground font-sans text-sm focus:outline-none focus:border-foreground rounded-none"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Provide the relative or absolute URL for the single hosted direct asset.
                  </p>
                </div>
              )}

              {structureType !== "video" && structureType !== "notes" && (
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Asset ID / Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    value={directId}
                    onChange={(e) => setDirectId(e.target.value)}
                    placeholder={`e.g., ref-${structureType}-123`}
                    className="w-full p-3 border border-border bg-card text-foreground font-sans text-sm focus:outline-none focus:border-foreground rounded-none"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Provide the database or system identifier mapping to this interactive module.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Level & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Difficulty Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Pricing Model</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as any)}
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground"
              >
                <option value="free">Free</option>
                <option value="paid">One-time Paid</option>
              </select>
            </div>
          </div>

          {pricingType === "paid" && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Price (INR)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground"
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
