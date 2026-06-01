"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  CheckCircle, 
  Lock, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  HelpCircle, 
  FileText, 
  ExternalLink,
  Check,
  Circle
} from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { MOCK_NOTES, MOCK_DOUBTS } from "@/lib/mock-data/learner";
import { formatDuration, cn } from "@/lib/utils";
import type { Lesson, CourseModule } from "@/types/course";
import type { Note, Doubt } from "@/types/enrollment";

interface WatchPageProps {
  params: Promise<{ lessonId: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
  const { lessonId } = use(params);
  const router = useRouter();

  // Find the course and lesson
  // For safety in mock data, let's search across all mock courses to find where this lessonId belongs
  let activeCourse = MOCK_COURSES[0]; // fallback
  let activeModule: CourseModule | undefined;
  let activeLesson: Lesson | undefined;

  for (const course of MOCK_COURSES) {
    for (const mod of course.modules) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) {
        activeCourse = course;
        activeModule = mod;
        activeLesson = found;
        break;
      }
    }
    if (activeLesson) break;
  }

  // If not found (e.g. lessonId is "first"), resolve to first lesson of first course
  if (!activeLesson && activeCourse.modules.length > 0 && activeCourse.modules[0].lessons.length > 0) {
    activeLesson = activeCourse.modules[0].lessons[0];
    activeModule = activeCourse.modules[0];
  }

  // Fallback values if data is empty
  const lesson = activeLesson ?? {
    id: "lesson-1",
    moduleId: "mod-1",
    title: "1.1 Introduction to Advanced Python",
    description: "An overview of what we will cover in this course and why Python memory model matters.",
    type: "video" as const,
    duration: 900,
    order: 1,
    isPreview: true,
    isLocked: false,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  };

  const course = activeCourse;

  // State
  const [activeTab, setActiveTab] = useState<"about" | "notes" | "doubts" | "resources" | "compiler">("about");
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES.filter((n) => n.courseId === course.id));
  const [doubts, setDoubts] = useState<Doubt[]>(MOCK_DOUBTS.filter((d) => d.courseId === course.id));
  const [completedLessons, setCompletedLessons] = useState<string[]>(["lesson-1"]); // mock progress
  const [cinemaMode, setCinemaMode] = useState(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);

  // Compiler Sandbox States
  const [sandboxCode, setSandboxCode] = useState(
    `def reverse_list(lst):\n    # Write your solution here\n    pass`
  );
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [isCompilingSandbox, setIsCompilingSandbox] = useState(false);

  // Live Broadcast Interaction States
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showLiveInteraction, setShowLiveInteraction] = useState(false);
  const [submittedLiveAnswer, setSubmittedLiveAnswer] = useState<string | null>(null);
  const [selectedLiveOption, setSelectedLiveOption] = useState<string | null>(null);
  
  // Note inputs
  const [newNoteContent, setNewNoteContent] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState<number | null>(null);

  // Doubt inputs
  const [newDoubtQuestion, setNewDoubtQuestion] = useState("");
  const [newDoubtDesc, setNewDoubtDesc] = useState("");

  // Video Ref & custom state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Trigger loading shimmer on lessonId change
  useEffect(() => {
    setIsLoadingLesson(true);
    const timer = setTimeout(() => {
      setIsLoadingLesson(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [lessonId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if focused in input/textarea
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ": // Space to play/pause
          e.preventDefault();
          handlePlayPause();
          break;
        case "arrowleft": // Left Arrow (seek back 10s)
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case "arrowright": // Right Arrow (seek forward 10s)
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              duration || videoRef.current.duration || 1,
              videoRef.current.currentTime + 10
            );
          }
          break;
        case "c": // 'C' key toggles cinema/theater mode
          e.preventDefault();
          setCinemaMode((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration, isPlaying]);

  // Handle video events
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.log(err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(cur);
      setProgressPercent((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = clickX / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log(err));
      setIsPlaying(true);
    }
  };

  // Compiler sandbox runner simulation
  const handleRunCodeSandbox = () => {
    setIsCompilingSandbox(true);
    setSandboxLogs([
      "🐍 Python Sandbox executing solution.py...",
      "⚙️ Running unit test cases against inputs..."
    ]);

    setTimeout(() => {
      // Analyze code simply to determine outcome
      const hasLoopOrReverse = sandboxCode.includes("for") || sandboxCode.includes("while") || sandboxCode.includes("reverse");
      const hasPass = sandboxCode.includes("pass");

      if (hasPass) {
        setSandboxLogs((prev) => [
          ...prev,
          "❌ Test Case 1: Input: [1, 2, 3] -> Expected: [3, 2, 1] -> Output: None [FAILED]",
          "❌ Test Case 2: Input: [] -> Expected: [] -> Output: None [FAILED]",
          "\n🔴 VERIFICATION FAILED: 0/2 test cases passed. Ensure the function returns the reversed array."
        ]);
      } else if (!hasLoopOrReverse && !sandboxCode.includes("return")) {
        setSandboxLogs((prev) => [
          ...prev,
          "❌ Test Case 1: Input: [1, 2, 3] -> Expected: [3, 2, 1] -> Output: None [FAILED]",
          "\n🔴 VERIFICATION FAILED: Function didn't return any outputs."
        ]);
      } else {
        setSandboxLogs((prev) => [
          ...prev,
          "✅ Test Case 1: Input: [1, 2, 3] -> Expected: [3, 2, 1] -> Output: [3, 2, 1] [PASSED]",
          "✅ Test Case 2: Input: [] -> Expected: [] -> Output: [] [PASSED]",
          "\n🟢 VERIFICATION SUCCESSFUL: 2/2 test cases passed. Code is type-sound and optimized!"
        ]);
      }
      setIsCompilingSandbox(false);
    }, 1500);
  };

  // Add Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      userId: "user-learner-1",
      courseId: course.id,
      courseTitle: course.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      content: newNoteContent,
      timestamp: isPlaying || currentTime > 0 ? Math.floor(currentTime) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setNewNoteContent("");
    setNoteTimestamp(null);
  };

  // Add Doubt
  const handleAddDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtQuestion.trim()) return;

    const newDoubt: Doubt = {
      id: `doubt-${Date.now()}`,
      userId: "user-learner-1",
      userName: "Alex Johnson",
      courseId: course.id,
      courseTitle: course.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      question: newDoubtQuestion,
      description: newDoubtDesc,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
    };

    setDoubts([newDoubt, ...doubts]);
    setNewDoubtQuestion("");
    setNewDoubtDesc("");
  };

  // Toggle lesson completed
  const handleToggleCompleted = (lId: string) => {
    if (completedLessons.includes(lId)) {
      setCompletedLessons(completedLessons.filter((id) => id !== lId));
    } else {
      setCompletedLessons([...completedLessons, lId]);
    }
  };

  // Get next and previous lessons
  const allLessons: Lesson[] = course.modules.flatMap((m) => m.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className={cn("flex gap-6 min-h-[calc(100vh-140px)]", cinemaMode ? "flex-col" : "flex-col xl:flex-row")}>
      {/* Left Column: Player and Tabs */}
      <div className="flex-1 flex flex-col space-y-6">
        {/* Watch Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-border bg-card p-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/learn/courses" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 inline" /> Courses
              </Link>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold">
                {course.institutionName}
              </span>
            </div>
            <h1 className="text-headline-sm font-bold text-foreground mt-1">
              {course.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`px-4 py-2 border transition-colors text-label-md uppercase tracking-wider font-bold ${
                isLiveMode
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
                  : "border-border hover:border-foreground text-foreground"
              }`}
            >
              🔴 {isLiveMode ? "Leave Live Mode" : "Switch to Live"}
            </button>
            <button
              onClick={() => handleToggleCompleted(lesson.id)}
              className={`flex items-center gap-2 px-4 py-2 border transition-colors text-label-md uppercase tracking-wider ${
                completedLessons.includes(lesson.id)
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                  : "border-border hover:border-foreground"
              }`}
            >
              <Check className="w-4 h-4" />
              {completedLessons.includes(lesson.id) ? "Completed" : "Mark Complete"}
            </button>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="border border-border bg-black relative aspect-video flex flex-col group overflow-hidden">
          {/* Live broadcast pulsing label */}
          {isLiveMode && (
            <div className="absolute top-4 left-4 z-20 bg-rose-600 text-white font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider font-mono animate-pulse">
              🔴 Live Broadcast
            </div>
          )}

          {/* Simulated Live Interaction Overlay */}
          {showLiveInteraction && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-40 font-sans">
              <div className="border border-zinc-800 bg-zinc-950 p-6 max-w-sm w-full space-y-4 text-white text-left">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold">🔴 Live Question Alert</span>
                  <button 
                    onClick={() => {
                      setShowLiveInteraction(false);
                      setSubmittedLiveAnswer(null);
                      setSelectedLiveOption(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  Teacher has triggered a live interactive query:
                  <br />
                  <strong className="text-white">"Which method is preferred to create deep copies of reference graphs?"</strong>
                </p>

                {!submittedLiveAnswer ? (
                  <div className="space-y-2">
                    {[
                      { key: "A", text: "copy.copy()" },
                      { key: "B", text: "copy.deepcopy() [Correct]" },
                      { key: "C", text: "JSON serialization splits" },
                      { key: "D", text: "Manual loop assignment" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSelectedLiveOption(opt.key)}
                        className={`w-full p-2.5 border text-left text-[11px] uppercase font-bold tracking-wide transition-colors ${
                          selectedLiveOption === opt.key
                            ? "border-white bg-white text-black"
                            : "border-zinc-800 hover:border-zinc-600 text-zinc-300"
                        }`}
                      >
                        {opt.key}) {opt.text}
                      </button>
                    ))}
                    <button
                      onClick={() => setSubmittedLiveAnswer(selectedLiveOption)}
                      disabled={!selectedLiveOption}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Submit Response
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">Real-time Peer Responses</p>
                    <div className="space-y-2 text-[10px] font-mono">
                      {[
                        { label: "A (copy.copy)", val: 12, correct: false },
                        { label: "B (copy.deepcopy)", val: 78, correct: true },
                        { label: "C (JSON split)", val: 8, correct: false },
                        { label: "D (Manual loop)", val: 2, correct: false }
                      ].map((peer) => (
                        <div key={peer.label} className="space-y-1">
                          <div className="flex justify-between font-bold text-zinc-300">
                            <span>{peer.label} {peer.correct && "✓"}</span>
                            <span>{peer.val}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 border border-zinc-800 w-full">
                            <div 
                              className={`h-full ${peer.correct ? "bg-emerald-500" : "bg-zinc-600"}`} 
                              style={{ width: `${peer.val}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowLiveInteraction(false);
                        setSubmittedLiveAnswer(null);
                        setSelectedLiveOption(null);
                      }}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-[10px] uppercase tracking-wider transition-colors mt-2"
                    >
                      Continue Live Stream
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Skeleton Shimmer Loader */}
          {isLoadingLesson && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center z-30">
              <div className="w-full h-full flex flex-col space-y-4 p-8 animate-pulse">
                <div className="flex-1 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Play className="w-12 h-12 text-zinc-700 fill-zinc-700 animate-spin" />
                </div>
                <div className="h-6 bg-zinc-900 border border-zinc-800 w-1/3" />
                <div className="h-4 bg-zinc-900 border border-zinc-800 w-2/3" />
              </div>
            </div>
          )}

          {lesson.type === "video" && lesson.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={lesson.videoUrl}
                className="w-full h-full object-contain"
                onClick={handlePlayPause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />

              {/* Black overlay controller */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Timeline */}
                <div
                  className="h-1.5 bg-zinc-800 hover:h-2 transition-all cursor-pointer relative"
                  onClick={handleSeek}
                >
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-white"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-4">
                    <button onClick={handlePlayPause} className="hover:text-zinc-300">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                    </button>
                    <button onClick={handleRestart} className="hover:text-zinc-300">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={handleToggleMute} className="hover:text-zinc-300">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setCinemaMode(!cinemaMode)} 
                      className="hover:text-zinc-300 hidden sm:inline-flex items-center gap-1 text-[10px] border border-zinc-700 hover:border-zinc-500 px-1.5 py-0.5 uppercase tracking-wider font-mono transition-colors"
                      title="Toggle Theater Mode (C)"
                    >
                      {cinemaMode ? "Default View" : "Theater Mode"}
                    </button>
                    <span>
                      {formatTime(currentTime)} / {formatTime(duration || lesson.duration || 0)}
                    </span>
                  </div>

                  <div className="text-zinc-400 font-medium">
                    {lesson.title}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center space-y-4">
              {lesson.type === "quiz" && <HelpCircle className="w-16 h-16 text-zinc-600" />}
              {lesson.type === "assignment" && <FileText className="w-16 h-16 text-zinc-600" />}
              {lesson.type === "live" && <Clock className="w-16 h-16 text-zinc-600" />}
              
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{lesson.type} LESSON</h3>
                <p className="text-sm max-w-md mx-auto mt-2 text-zinc-500">{lesson.title}</p>
              </div>

              {lesson.type === "quiz" && (
                <Link
                  href={`/learn/quiz/${lesson.quizId ?? "1"}`}
                  className="px-6 py-3 bg-white text-black font-bold text-label-md uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Start Quiz
                </Link>
              )}

              {lesson.type === "assignment" && (
                <Link
                  href={`/learn/assignments`}
                  className="px-6 py-3 bg-white text-black font-bold text-label-md uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  View Assignment Details
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Live Simulation Controls (from Feature Expansion Report 2.2) */}
        {isLiveMode && (
          <div className="p-3.5 border border-border bg-surface-container/60 flex justify-between items-center text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5 animate-pulse uppercase tracking-wide">
              <span className="w-2 h-2 bg-rose-600 inline-block rounded-full" />
              Live interactive classroom is broadcasting
            </span>
            <button
              onClick={() => {
                setShowLiveInteraction(true);
                setSubmittedLiveAnswer(null);
                setSelectedLiveOption(null);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded-none"
            >
              Simulate Teacher Quiz Prompt
            </button>
          </div>
        )}

        {/* Video Nav bar */}
        <div className="flex justify-between items-center bg-card border border-border p-3">
          {prevLesson ? (
            <Link
              href={`/learn/watch/${prevLesson.id}`}
              className="flex items-center gap-2 text-label-md uppercase tracking-wider border border-border hover:border-foreground px-4 py-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev Lesson
            </Link>
          ) : (
            <div className="opacity-40 flex items-center gap-2 text-label-md uppercase tracking-wider border border-border px-4 py-2 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Prev Lesson
            </div>
          )}

          <span className="text-muted-foreground text-sm font-medium">
            Lesson {currentIdx + 1} of {allLessons.length}
          </span>

          {nextLesson ? (
            <Link
              href={`/learn/watch/${nextLesson.id}`}
              className="flex items-center gap-2 text-label-md uppercase tracking-wider border border-border hover:border-foreground px-4 py-2 transition-colors"
            >
              Next Lesson <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="opacity-40 flex items-center gap-2 text-label-md uppercase tracking-wider border border-border px-4 py-2 cursor-not-allowed">
              Next Lesson <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Tab Interface */}
        <div className="border border-border bg-card flex flex-col">
          <div className="flex border-b border-border bg-surface">
            {[
              { id: "about", label: "About Lesson" },
              { id: "notes", label: `Notes (${notes.filter(n => n.lessonId === lesson.id).length})` },
              { id: "doubts", label: `Doubts (${doubts.length})` },
              { id: "resources", label: `Resources (${lesson.resources?.length || 0})` },
              { id: "compiler", label: "Code Sandbox" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-4 text-label-sm uppercase tracking-widest font-bold border-r border-border transition-colors ${
                  activeTab === tab.id
                    ? "bg-card text-foreground border-b-2 border-b-foreground"
                    : "text-muted-foreground hover:bg-surface-container"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-4">
                <h3 className="text-body-lg font-bold text-foreground">{lesson.title}</h3>
                <p className="text-body-md text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {lesson.description || "No description provided for this lesson."}
                </p>
                <div className="pt-4 border-t border-border mt-6">
                  <h4 className="text-label-md font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Instructors
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {course.instructors.map((ins) => (
                      <div key={ins.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-container border border-border flex items-center justify-center uppercase font-bold text-sm">
                          {ins.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-body-sm font-bold">{ins.name}</p>
                          <p className="text-xs text-muted-foreground">{ins.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-6">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Add a new note. You can sync it to current video time..."
                      className="w-full p-4 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground min-h-[100px] resize-none"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-card px-2 py-1 border border-border text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(currentTime)}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNoteContent.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-95 disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" /> Save Note
                    </button>
                  </div>
                </form>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-body-md font-bold text-foreground">My Notes for this Lesson</h4>
                  {notes.filter((n) => n.lessonId === lesson.id).length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes captured for this lesson yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes
                        .filter((n) => n.lessonId === lesson.id)
                        .map((note) => (
                          <div key={note.id} className="p-4 border border-border bg-surface flex gap-3 items-start">
                            {note.timestamp !== undefined && (
                              <button
                                onClick={() => {
                                  if (videoRef.current) {
                                    videoRef.current.currentTime = note.timestamp!;
                                    videoRef.current.play().catch(e => console.log(e));
                                    setIsPlaying(true);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-foreground text-background hover:opacity-90 font-mono text-xs font-bold transition-opacity"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                {formatTime(note.timestamp)}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-body-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {note.content}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase mt-2">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Doubts Tab */}
            {activeTab === "doubts" && (
              <div className="space-y-6">
                <form onSubmit={handleAddDoubt} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Doubt Question
                    </label>
                    <input
                      type="text"
                      value={newDoubtQuestion}
                      onChange={(e) => setNewDoubtQuestion(e.target.value)}
                      placeholder="What is your doubt? Be specific..."
                      className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Elaborate (Optional)
                    </label>
                    <textarea
                      value={newDoubtDesc}
                      onChange={(e) => setNewDoubtDesc(e.target.value)}
                      placeholder="Provide additional details or code snippets..."
                      className="w-full p-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newDoubtQuestion.trim()}
                      className="px-5 py-2.5 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-95 disabled:opacity-40"
                    >
                      Ask Doubt
                    </button>
                  </div>
                </form>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-body-md font-bold text-foreground">Doubts for this Course</h4>
                  {doubts.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No doubts asked yet. Be the first to ask!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {doubts.map((doubt) => (
                        <div key={doubt.id} className="p-4 border border-border bg-surface space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                {doubt.userName} • {doubt.lessonTitle ?? "General"}
                              </p>
                              <h5 className="text-body-md font-bold text-foreground mt-1">
                                {doubt.question}
                              </h5>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] uppercase font-bold border ${
                                doubt.status === "answered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                              }`}
                            >
                              {doubt.status}
                            </span>
                          </div>

                          {doubt.description && (
                            <p className="text-body-sm text-muted-foreground whitespace-pre-wrap">
                              {doubt.description}
                            </p>
                          )}

                          {doubt.answer && (
                            <div className="p-3 bg-card border-l-2 border-l-foreground border border-border mt-2 space-y-1">
                              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Answer from {doubt.answeredByName}
                              </p>
                              <p className="text-body-sm text-muted-foreground leading-relaxed">
                                {doubt.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === "resources" && (
              <div className="space-y-4">
                <h3 className="text-body-md font-bold text-foreground">Downloadable Resources</h3>
                {!lesson.resources || lesson.resources.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No external resources available for this lesson.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 border border-border bg-surface hover:bg-surface-container flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-card border border-border flex items-center justify-center font-bold text-xs uppercase">
                            {res.type}
                          </div>
                          <div>
                            <p className="text-body-sm font-bold text-foreground group-hover:underline">
                              {res.title}
                            </p>
                            {res.sizeKb && (
                              <p className="text-xs text-muted-foreground">{res.sizeKb} KB</p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Compiler Tab Panel (from Feature Expansion Report 2.4) */}
            {activeTab === "compiler" && (
              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-body-md font-bold text-foreground">Interactive Code Compiler Sandbox</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Write and test code matching your programming lessons. Runs mock evaluation checks in B&W console.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSandboxCode(`def reverse_list(lst):\n    # Write your solution here\n    pass`);
                      setSandboxLogs([]);
                    }}
                    className="px-3 py-1.5 border border-border text-[10px] uppercase font-bold tracking-widest hover:bg-surface-container transition-colors bg-background"
                  >
                    Reset Template
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: Monospace Editor Textarea */}
                  <div className="flex flex-col border border-border bg-surface">
                    <div className="p-2.5 bg-surface-container border-b border-border flex justify-between items-center font-mono text-[10px] text-muted-foreground">
                      <span>solution.py</span>
                      <span>Python 3.10</span>
                    </div>
                    <div className="flex font-mono text-xs">
                      {/* Simulating line numbers */}
                      <div className="bg-surface-container-high border-r border-border p-3 text-right text-muted-foreground select-none w-10 flex flex-col gap-0.5">
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <textarea
                        value={sandboxCode}
                        onChange={(e) => setSandboxCode(e.target.value)}
                        className="flex-1 p-3 bg-background text-foreground outline-none resize-none font-mono text-xs leading-normal h-64 rounded-none"
                      />
                    </div>
                  </div>

                  {/* Right Column: Console terminal logs */}
                  <div className="flex flex-col border border-border bg-black text-lime-400 font-mono text-[11px] min-h-[304px]">
                    <div className="p-2.5 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center text-zinc-500 text-[10px]">
                      <span>sandbox terminal console</span>
                      <button
                        onClick={handleRunCodeSandbox}
                        disabled={isCompilingSandbox}
                        className="px-2.5 py-1 bg-white text-black font-bold uppercase tracking-wider text-[9px] hover:bg-zinc-200 transition-colors disabled:opacity-50"
                      >
                        {isCompilingSandbox ? "Compiling..." : "Run Tests"}
                      </button>
                    </div>
                    <div className="p-4 space-y-1.5 overflow-y-auto flex-1 h-64">
                      {sandboxLogs.length === 0 ? (
                        <p className="text-zinc-600">Terminal ready. Write your solution and click "Run Tests" to execute.</p>
                      ) : (
                        sandboxLogs.map((log, idx) => (
                          <p key={idx} className="animate-fade-in whitespace-pre-wrap">{log}</p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Course Curriculum Sidebar */}
      <div className={cn("flex flex-col space-y-4 flex-shrink-0", cinemaMode ? "w-full" : "w-full xl:w-96")}>
        <div className="border border-border bg-card p-4">
          <h3 className="text-label-md font-bold uppercase tracking-wider text-muted-foreground">
            Course Content
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {completedLessons.length} / {allLessons.length} lessons completed
          </p>
          <div className="w-full bg-surface-container h-1 mt-3">
            <div
              className="bg-foreground h-1 transition-all"
              style={{ width: `${(completedLessons.length / allLessons.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="border border-border bg-card divide-y divide-border">
          {course.modules.map((mod) => (
            <div key={mod.id} className="flex flex-col">
              <div className="bg-surface p-4 flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  Module {mod.order}
                </span>
                <h4 className="text-body-sm font-bold text-foreground mt-0.5">{mod.title}</h4>
                {mod.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{mod.description}</p>
                )}
              </div>

              <div className="divide-y divide-border/60">
                {mod.lessons.map((les) => {
                  const isActive = les.id === lesson.id;
                  const isCompleted = completedLessons.includes(les.id);

                  return (
                    <button
                      key={les.id}
                      onClick={() => router.push(`/learn/watch/${les.id}`)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                        isActive
                          ? "bg-foreground/5 font-bold"
                          : "hover:bg-surface-container"
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-foreground fill-foreground text-background" />
                        ) : les.isLocked ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-sm leading-snug ${isActive ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                          {les.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {les.type}
                          </span>
                          {les.duration && (
                            <>
                              <span className="text-[10px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatDuration(les.duration)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
