"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Plus, Check, Trash2, Video, FileQuestion, ClipboardList, Move, Sparkles, FileText, Terminal, Radio } from "lucide-react";

interface CurriculumPageProps {
  params: Promise<{ id: string }>;
}

export default function CurriculumPage({ params }: CurriculumPageProps) {
  const { id } = use(params);
  const course = MOCK_COURSES.find((c) => c.id === id) || MOCK_COURSES[0];

  const [modules, setModules] = useState(course.modules);
  const [newModuleName, setNewModuleName] = useState("");
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonType, setNewLessonType] = useState<"video" | "pdf" | "quiz" | "assignment" | "live" | "text" | "exam" | "notes" | "sandbox" | "lab">("video");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(modules[0]?.id || null);
  const [isSaved, setIsSaved] = useState(false);

  // AI Study Kit States
  const [isStudyKitOpen, setIsStudyKitOpen] = useState(false);
  const [selectedLessonForKit, setSelectedLessonForKit] = useState<any>(null);
  const [kitGenerationStep, setKitGenerationStep] = useState<"idle" | "running" | "done">("idle");
  const [pipelineLog, setPipelineLog] = useState<string[]>([]);
  const [kitTab, setKitTab] = useState<"notes" | "timeline" | "quiz" | "assignment">("notes");
  const [genNotes, setGenNotes] = useState(true);
  const [genTimeline, setGenTimeline] = useState(true);
  const [genQuiz, setGenQuiz] = useState(true);
  const [genAssignment, setGenAssignment] = useState(true);
  const [studyKitSuccessMessage, setStudyKitSuccessMessage] = useState("");

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;

    const newMod = {
      id: `mod-${Date.now()}`,
      courseId: course.id,
      title: newModuleName,
      description: "Added core curriculum topics",
      order: modules.length + 1,
      isPreview: false,
      totalDuration: 0,
      lessons: [],
    };

    setModules([...modules, newMod]);
    if (!activeModuleId) setActiveModuleId(newMod.id);
    setNewModuleName("");
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonName.trim() || !activeModuleId) return;

    setModules(
      modules.map((mod) => {
        if (mod.id === activeModuleId) {
          const newLes = {
            id: `lesson-${Date.now()}`,
            moduleId: mod.id,
            title: newLessonName,
            description: "Interactive learning segment",
            type: newLessonType,
            duration: newLessonType === "video" ? 1800 : undefined,
            order: mod.lessons.length + 1,
            isPreview: false,
            isLocked: false,
          };
          return {
            ...mod,
            lessons: [...mod.lessons, newLes],
          };
        }
        return mod;
      })
    );

    setNewLessonName("");
  };

  const handleDeleteLesson = (modId: string, lesId: string) => {
    setModules(
      modules.map((mod) => {
        if (mod.id === modId) {
          return {
            ...mod,
            lessons: mod.lessons.filter((l) => l.id !== lesId),
          };
        }
        return mod;
      })
    );
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // AI Pipeline Simulator
  const handleGenerateStudyKit = () => {
    if (!selectedLessonForKit) return;
    setKitGenerationStep("running");
    setPipelineLog([]);

    const steps = [
      "🟢 Extracting audio tracks & matching video frames...",
      "🟢 Running Whisper-v3 Speech-to-Text transcription...",
      "🟢 Building RAG vector space indices for document retrieval...",
      "🟢 Structuring lesson notes in Markdown layout...",
      "🟢 Identifying key timeline moments & checkpoints...",
      "🟢 Formulating 5 concepts review questions...",
      "🟢 Drafting hands-on homework programming task...",
      "✨ Study Kit generated successfully! Review below."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPipelineLog((prev) => [...prev, step]);
        if (index === steps.length - 1) {
          setKitGenerationStep("done");
        }
      }, (index + 1) * 450);
    });
  };

  // Commit simulation outputs into modules state
  const handleCommitStudyKit = () => {
    if (!selectedLessonForKit || !activeModuleId) return;

    setModules(
      modules.map((mod) => {
        if (mod.id === activeModuleId) {
          let updatedLessons = [...mod.lessons];
          
          // Add descriptions/resources to the selected video lesson
          updatedLessons = updatedLessons.map((l) => {
            if (l.id === selectedLessonForKit.id) {
              return {
                ...l,
                description: `${l.description || ""}\n\n[Study Notes Attached]: Generated automatically via solo creator AI pipeline. Includes comprehensive overview of key patterns.`,
                resources: [
                  ...(l.resources || []),
                  {
                    id: `res-${Date.now()}-1`,
                    title: `${l.title} - Complete Notes`,
                    type: "pdf" as const,
                    url: "#",
                    sizeKb: 245
                  },
                  {
                    id: `res-${Date.now()}-2`,
                    title: `${l.title} - Key Moments`,
                    type: "pdf" as const,
                    url: "#",
                    sizeKb: 18
                  }
                ]
              };
            }
            return l;
          });

          // Append quiz if checked
          if (genQuiz) {
            updatedLessons.push({
              id: `quiz-${Date.now()}`,
              moduleId: mod.id,
              title: `${selectedLessonForKit.title} - Concept Review Quiz`,
              description: "AI-Generated conceptual checkup for verification of video lecture objectives.",
              type: "quiz" as const,
              order: updatedLessons.length + 1,
              isPreview: false,
              isLocked: false,
              quizId: "quiz-rag-gen"
            });
          }

          // Append assignment if checked
          if (genAssignment) {
            updatedLessons.push({
              id: `assign-${Date.now()}`,
              moduleId: mod.id,
              title: `${selectedLessonForKit.title} - Coding Lab`,
              description: "AI-Generated practical assessment code challenges matching the lecture curriculum.",
              type: "assignment" as const,
              order: updatedLessons.length + 1,
              isPreview: false,
              isLocked: false,
              assignmentId: "assign-rag-gen"
            });
          }

          return {
            ...mod,
            lessons: updatedLessons
          };
        }
        return mod;
      })
    );

    setIsStudyKitOpen(false);
    setStudyKitSuccessMessage(`✨ AI Study Kit successfully attached to '${selectedLessonForKit.title}'! Added new resources/assessments.`);
    setTimeout(() => setStudyKitSuccessMessage(""), 5000);
  };

  return (
    <div className="max-w-[900px] mx-auto py-6 font-sans space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/studio/courses"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>

      {/* Editor block */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Syllabus Builder</span>
            <h1 className="text-headline-sm font-bold text-foreground mt-0.5">{course.title}</h1>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Save Curriculum
          </button>
        </div>

        {isSaved && (
          <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Syllabus changes registered successfully!
          </div>
        )}

        {studyKitSuccessMessage && (
          <div className="p-4 border border-foreground bg-foreground text-background text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 fill-current" /> {studyKitSuccessMessage}
          </div>
        )}

        {(!course.structureType || course.structureType === "modular") ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left panel: Modules List */}
            <div className="space-y-4">
              <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">1. Modules</h3>
              <div className="border border-border divide-y divide-border/60">
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleId(mod.id)}
                    className={`w-full p-3 text-left text-body-sm transition-colors block ${
                      activeModuleId === mod.id
                        ? "bg-surface-container font-bold border-l-2 border-foreground"
                        : "hover:bg-surface text-muted-foreground"
                    }`}
                  >
                    <p className="text-[9px] uppercase tracking-wider">Module {mod.order}</p>
                    <p className="truncate mt-0.5">{mod.title}</p>
                  </button>
                ))}
              </div>

              {/* Add Module form */}
              <form onSubmit={handleAddModule} className="space-y-2 pt-2">
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="New Module Name..."
                  className="w-full p-2 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-surface hover:bg-surface-container border border-border text-label-sm uppercase tracking-wider font-bold flex items-center justify-center gap-1 text-foreground"
                >
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </form>
            </div>

            {/* Right panel: Lessons inside selected Module */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">2. Lessons & Assessments</h3>
              
              {activeModuleId ? (
                <div className="space-y-4">
                  {/* Lessons list */}
                  <div className="border border-border divide-y divide-border">
                    {modules
                      .find((m) => m.id === activeModuleId)
                      ?.lessons.map((les) => (
                        <div key={les.id} className="p-4 flex items-center justify-between bg-card text-body-sm group">
                          <div className="flex items-center gap-3">
                            <Move className="w-4 h-4 text-muted-foreground cursor-move" />
                            <div className="w-8 h-8 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground">
                              {les.type === "video" && <Video className="w-4 h-4" />}
                              {les.type === "quiz" && <FileQuestion className="w-4 h-4" />}
                              {les.type === "assignment" && <ClipboardList className="w-4 h-4" />}
                              {les.type === "pdf" && <FileText className="w-4 h-4 text-rose-600" />}
                              {les.type === "live" && <Radio className="w-4 h-4 text-emerald-600" />}
                              {les.type === "text" && <FileText className="w-4 h-4" />}
                              {les.type === "exam" && <ClipboardList className="w-4 h-4 text-amber-600 font-bold" />}
                              {les.type === "notes" && <FileText className="w-4 h-4 text-sky-600" />}
                              {les.type === "sandbox" && <Terminal className="w-4 h-4 text-violet-600" />}
                              {les.type === "lab" && <Terminal className="w-4 h-4 text-fuchsia-600" />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground leading-snug">{les.title}</p>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold font-mono tracking-wider">{les.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {les.type === "video" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLessonForKit(les);
                                  setIsStudyKitOpen(true);
                                  setKitGenerationStep("idle");
                                  setPipelineLog([]);
                                }}
                                className="px-2.5 py-1 border border-border hover:border-foreground bg-surface text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-surface-container transition-colors flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/10" />
                                Study Kit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(activeModuleId, les.id)}
                              className="p-1.5 border border-transparent hover:border-border hover:bg-surface text-muted-foreground hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                    {modules.find((m) => m.id === activeModuleId)?.lessons.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground text-xs border-dashed border border-border bg-surface">
                        No lessons added to this module yet.
                      </div>
                    )}
                  </div>

                  {/* Add Lesson form */}
                  <form onSubmit={handleAddLesson} className="border border-border p-4 bg-surface space-y-3">
                    <h4 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Add Lesson Content</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newLessonName}
                        onChange={(e) => setNewLessonName(e.target.value)}
                        placeholder="Lesson Name..."
                        className="col-span-2 p-2 border border-border bg-card text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
                      />
                      <select
                        value={newLessonType}
                        onChange={(e) => setNewLessonType(e.target.value as any)}
                        className="p-2 border border-border bg-card text-foreground font-sans text-xs focus:outline-none"
                      >
                        <option value="video">Video Lecture</option>
                        <option value="pdf">PDF Document</option>
                        <option value="quiz">Concept Quiz</option>
                        <option value="assignment">Assignment Task</option>
                        <option value="live">Live Stream</option>
                        <option value="text">Rich Text / Article</option>
                        <option value="exam">Proctored Exam</option>
                        <option value="notes">Study Notes</option>
                        <option value="sandbox">Code Sandbox</option>
                        <option value="lab">Interactive Lab</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Append Lesson
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs border border-border bg-surface">
                  Create a module first to append learning lessons.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-border p-8 bg-surface text-center space-y-6 max-w-lg mx-auto py-12 rounded-none">
            <div className="w-16 h-16 border border-border bg-card mx-auto flex items-center justify-center text-foreground rounded-none">
              {course.structureType === "video" && <Video className="w-8 h-8 text-foreground" />}
              {course.structureType === "quiz" && <FileQuestion className="w-8 h-8 text-foreground" />}
              {course.structureType === "assignment" && <ClipboardList className="w-8 h-8 text-foreground" />}
              {course.structureType === "exam" && <ClipboardList className="w-8 h-8 text-amber-600 font-bold" />}
              {course.structureType === "notes" && <FileText className="w-8 h-8 text-sky-600" />}
              {course.structureType === "sandbox" && <Terminal className="w-8 h-8 text-violet-600" />}
              {course.structureType === "lab" && <Terminal className="w-8 h-8 text-fuchsia-600" />}
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground bg-surface-container border border-border px-2 py-0.5 rounded-none">
                Direct Asset Mode: {course.structureType}
              </span>
              <h2 className="text-body-lg font-bold text-foreground mt-2">Single Asset Course</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                This course is configured to directly host a single {course.structureType} learning asset rather than a multi-module nested curriculum syllabus.
              </p>
            </div>

            <div className="border-t border-border pt-4 text-left space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Mapped Resource</p>
              {course.directUrl && (
                <div className="p-3 border border-border bg-card font-mono break-all text-[11px] rounded-none">
                  <strong>URL:</strong> {course.directUrl}
                </div>
              )}
              {course.directId && (
                <div className="p-3 border border-border bg-card font-mono break-all text-[11px] rounded-none">
                  <strong>Asset ID:</strong> {course.directId}
                </div>
              )}
              {!course.directUrl && !course.directId && (
                <div className="p-3 border border-border bg-card text-muted-foreground text-center text-[10px] uppercase font-bold tracking-wider rounded-none">
                  No resource mapped. Please configure settings.
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href={`/studio/courses/${course.id}/build`}
                className="inline-block px-6 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity rounded-none"
              >
                Manage Build Settings
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* AI Study Kit Modal */}
      {isStudyKitOpen && selectedLessonForKit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-background border border-border w-full max-w-2xl rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-body-md font-bold uppercase tracking-wider text-foreground">AI Lecture-to-Study Kit</h3>
              </div>
              <button
                onClick={() => setIsStudyKitOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold uppercase"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-body-sm text-foreground">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold font-mono">Target Video Lecture</span>
                <p className="text-body-md font-bold text-foreground mt-0.5">{selectedLessonForKit.title}</p>
              </div>

              {kitGenerationStep === "idle" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Select which additional learning materials you want our AI Pipeline to generate. The system will auto-transcribe the video, extract concepts, and structure the selected resources automatically.
                  </p>

                  <div className="border border-border p-4 bg-surface space-y-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-foreground mb-2">Generation Configurations</h4>
                    
                    <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                      <input
                        type="checkbox"
                        checked={genNotes}
                        onChange={(e) => setGenNotes(e.target.checked)}
                        className="w-4 h-4 border-border rounded-none focus:ring-0 cursor-pointer accent-foreground"
                      />
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide">Generate Structured Notes PDF</p>
                        <p className="text-[10px] text-muted-foreground">Comprehensive markdown summary of lecture scripts and files.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                      <input
                        type="checkbox"
                        checked={genTimeline}
                        onChange={(e) => setGenTimeline(e.target.checked)}
                        className="w-4 h-4 border-border rounded-none focus:ring-0 cursor-pointer accent-foreground"
                      />
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide">Identify Key Moments Timeline</p>
                        <p className="text-[10px] text-muted-foreground">Detailed minute-by-minute index markers for quick jumps.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                      <input
                        type="checkbox"
                        checked={genQuiz}
                        onChange={(e) => setGenQuiz(e.target.checked)}
                        className="w-4 h-4 border-border rounded-none focus:ring-0 cursor-pointer accent-foreground"
                      />
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide">Formulate 5-Question Review Quiz</p>
                        <p className="text-[10px] text-muted-foreground">MCQ assessments appended dynamically to the current course module.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                      <input
                        type="checkbox"
                        checked={genAssignment}
                        onChange={(e) => setGenAssignment(e.target.checked)}
                        className="w-4 h-4 border-border rounded-none focus:ring-0 cursor-pointer accent-foreground"
                      />
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide">Draft Homework Programming Challenge</p>
                        <p className="text-[10px] text-muted-foreground">A graded assignment module with description guidelines.</p>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleGenerateStudyKit}
                    className="w-full py-3 bg-foreground text-background text-label-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 fill-current" /> Run AI Study Kit Pipeline
                  </button>
                </div>
              )}

              {kitGenerationStep === "running" && (
                <div className="space-y-4 py-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
                    <p className="text-xs uppercase font-bold tracking-widest font-mono">Running Solo Creator AI Pipeline...</p>
                  </div>
                  <div className="border border-border bg-black text-lime-400 p-4 font-mono text-[10px] space-y-1.5 h-48 overflow-y-auto">
                    {pipelineLog.map((log, index) => (
                      <p key={index} className="animate-fade-in">{log}</p>
                    ))}
                  </div>
                </div>
              )}

              {kitGenerationStep === "done" && (
                <div className="space-y-4 flex flex-col h-full min-h-0">
                  <div className="flex border-b border-border bg-surface">
                    {[
                      { id: "notes", label: "PDF Notes", show: genNotes },
                      { id: "timeline", label: "Timeline Index", show: genTimeline },
                      { id: "quiz", label: "Concept Quiz", show: genQuiz },
                      { id: "assignment", label: "Assignment", show: genAssignment }
                    ].filter(tab => tab.show).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setKitTab(tab.id as any)}
                        className={`px-4 py-3 text-[10px] uppercase tracking-wider font-bold border-r border-border transition-colors ${
                          kitTab === tab.id
                            ? "bg-card text-foreground border-b-2 border-b-foreground"
                            : "text-muted-foreground hover:bg-surface-container"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="border border-border p-4 bg-surface flex-1 overflow-y-auto max-h-64 font-sans text-xs">
                    {kitTab === "notes" && (
                      <div className="space-y-3 leading-relaxed">
                        <h4 className="font-bold text-sm uppercase tracking-wide text-foreground">Lecture Notes: {selectedLessonForKit.title}</h4>
                        <p className="text-muted-foreground">Below is the automatically generated summary based on audio transcript analysis:</p>
                        <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground">
                          <li><strong>Memory Layout Optimization:</strong> The lesson focuses heavily on generative structure patterns and Python's CPython memory allocation.</li>
                          <li><strong>Garbage Collection Details:</strong> Covers standard reference counts, cyclic lists, and tracing heuristics to debug memory spikes.</li>
                          <li><strong>Practical Code Refactoring:</strong> Implements custom wrapper functions to keep class variables clean during loop cycles.</li>
                        </ul>
                      </div>
                    )}

                    {kitTab === "timeline" && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm uppercase tracking-wide text-foreground">Moment Timeline Markers</h4>
                        <div className="divide-y divide-border/60">
                          <div className="py-2 flex gap-4"><span className="font-mono font-bold text-foreground">00:00</span> <span className="text-muted-foreground">Introduction to garbage collection internals</span></div>
                          <div className="py-2 flex gap-4"><span className="font-mono font-bold text-foreground">04:15</span> <span className="text-muted-foreground">Detailed reference count mechanics in CPython</span></div>
                          <div className="py-2 flex gap-4"><span className="font-mono font-bold text-foreground">10:30</span> <span className="text-muted-foreground">Analyzing reference cycle loops and gc.collect() usage</span></div>
                          <div className="py-2 flex gap-4"><span className="font-mono font-bold text-foreground">18:50</span> <span className="text-muted-foreground">Simulating garbage collection delays under high loads</span></div>
                        </div>
                      </div>
                    )}

                    {kitTab === "quiz" && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm uppercase tracking-wide text-foreground">Sample Quiz Review Questions</h4>
                        <div className="space-y-3">
                          <div className="p-3 border border-border bg-card">
                            <p className="font-bold text-foreground">Q1. Which of the following is the primary mechanism for memory management in CPython?</p>
                            <p className="text-muted-foreground pl-3 mt-1">• A) Reference Counting [Correct]</p>
                            <p className="text-muted-foreground pl-3">• B) Tracing collector</p>
                          </div>
                          <div className="p-3 border border-border bg-card">
                            <p className="font-bold text-foreground">Q2. What module helps control and inspect garbage collector diagnostics in Python?</p>
                            <p className="text-muted-foreground pl-3 mt-1">• A) sys</p>
                            <p className="text-muted-foreground pl-3">• B) gc [Correct]</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {kitTab === "assignment" && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm uppercase tracking-wide text-foreground">Lab Programming Exercise</h4>
                        <p className="font-bold text-foreground">Write a Python decorator that detects and logs memory leaks</p>
                        <p className="text-muted-foreground leading-relaxed">
                          Design a decorator called `@track_memory` that tracks object allocations within a function call. Raise a `MemoryWarning` if reference count increases by more than 10 during single invocations.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCommitStudyKit}
                    className="w-full py-3 bg-foreground text-background text-label-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
                  >
                    Commit & Append Study Kit resources
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

