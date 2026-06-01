"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Edit, ArrowRight, Check, Trash2, Map, ShieldAlert } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import type { Program } from "@/types/course";

export default function StudioProgramsPage() {
  // Mock programs list matching public learning paths
  const [programs, setPrograms] = useState<Program[]>([
    {
      id: "path-1",
      slug: "ml-engineer",
      title: "Production Machine Learning Engineer",
      description: "From beginner Python core foundations to complete model deployment and drift metrics tracking in MLOps.",
      institutionId: "inst-3",
      courseIds: ["course-1", "course-5"],
      isPublished: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-05-01T00:00:00Z"
    },
    {
      id: "path-2",
      slug: "frontend-designer",
      title: "Senior Frontend Engineer & Designer",
      description: "Master React component architectures, custom design systems, and visual design layouts.",
      institutionId: "inst-3",
      courseIds: ["course-4", "course-3"],
      isPublished: true,
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-04-20T00:00:00Z"
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProg: Program = {
      id: `path-${Date.now()}`,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: newTitle,
      description: newDesc,
      institutionId: "inst-3",
      courseIds: selectedCourseIds,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPrograms([...programs, newProg]);
    setNewTitle("");
    setNewDesc("");
    setSelectedCourseIds([]);
    setIsCreating(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId) 
        : [...prev, courseId]
    );
  };

  const handleDeleteProgram = (id: string) => {
    if (confirm("Are you sure you want to delete this Career Program? Courses mapped inside won't be deleted.")) {
      setPrograms(programs.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-foreground flex items-center gap-2">
            <Map className="w-6 h-6 text-foreground" /> Career Programs
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Bundle multiple courses together into structured career paths and degree curriculums.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity font-bold rounded-none"
          >
            <Plus className="w-4 h-4" /> New Program
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 border border-foreground bg-foreground text-background text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" /> Career Program created successfully!
        </div>
      )}

      {isCreating ? (
        <form onSubmit={handleCreateProgram} className="border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4 flex justify-between items-center">
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Create Career Program</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs uppercase font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Program Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer Certification"
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Program Description</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary explaining career goals and milestones..."
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground resize-none rounded-none"
              />
            </div>

            {/* Courses mapping checklist */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold block">Map Syllabus Courses</label>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Select courses to group in this roadmap path (ordered sequentially):</p>
              <div className="border border-border divide-y divide-border/60 max-h-40 overflow-y-auto bg-surface">
                {MOCK_COURSES.map(course => {
                  const isChecked = selectedCourseIds.includes(course.id);
                  return (
                    <div
                      key={course.id}
                      onClick={() => handleToggleCourse(course.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-xs
                        ${isChecked ? "bg-surface-container font-bold" : "hover:bg-surface-container/30"}`}
                    >
                      <span className="text-foreground">{course.title}</span>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border
                        ${isChecked ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                        {isChecked ? "mapped" : "select"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-foreground text-background text-label-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity rounded-none"
          >
            Create Program Path
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map(prog => (
            <div key={prog.id} className="border border-border bg-card p-6 flex flex-col justify-between gap-6 hover:border-foreground transition-colors">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground bg-surface-container border border-border px-2 py-0.5">
                    {prog.courseIds.length} Mapped Courses
                  </span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 border
                    ${prog.isPublished ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-surface-container text-muted-foreground border-border"}`}>
                    {prog.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <h3 className="text-body-lg font-bold text-foreground">{prog.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{prog.description}</p>
              </div>

              {/* Mapped courses list previews */}
              {prog.courseIds.length > 0 && (
                <div className="space-y-1.5 border-t border-border pt-4">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Syllabus Sequence</p>
                  <div className="space-y-1">
                    {prog.courseIds.map((cid, idx) => {
                      const c = MOCK_COURSES.find(item => item.id === cid);
                      return (
                        <div key={cid} className="flex items-center gap-2 text-xs text-foreground">
                          <span className="font-mono font-bold text-[9px] text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="truncate">{c ? c.title : "Unknown Course"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => handleDeleteProgram(prog.id)}
                  className="text-xs uppercase font-bold text-muted-foreground hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  type="button"
                  onClick={() => alert("Simulating Program Editor workspace...")}
                  className="px-3 py-1.5 bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-85 transition-opacity flex items-center gap-1 rounded-none"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Track
                </button>
              </div>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="md:col-span-2 py-12 text-center text-muted-foreground border border-dashed border-border bg-card">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold uppercase">No Career Programs Registered</p>
              <p className="text-xs mt-1">Create your first degree pathway or career track by clicking the button above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
