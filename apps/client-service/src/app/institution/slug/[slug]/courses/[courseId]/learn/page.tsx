'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import { useCourseDetail } from '@/hooks/useCourses';
import {
  Building2,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  ThumbsUp,
  Code,
  Radio,
  Bookmark,
  ChevronDown,
  Download,
  Terminal,
  Layers,
  BookOpen,
  Share2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  readTime: string;
  completed: boolean;
  description?: string;
  transcript?: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

const DEFAULT_PLAYLIST: {
  tag: string;
  title: string;
  subtitle: string;
  modules: Module[];
} = {
  tag: 'INSTITUTIONAL CURRICULUM',
  title: 'Quantum Computing: From Theory to Implementation',
  subtitle: 'Master the principles of quantum mechanics and learn to program real quantum hardware using Qiskit, Cirq, and cloud compilers.',
  modules: [
    {
      id: 'mod-1',
      title: 'MODULE 1: INTRODUCTION TO QUANTUM MECHANICS',
      lessons: [
        {
          id: 'l-1',
          title: 'The Quantum Revolution & Classical Limits',
          duration: '18:30',
          readTime: '4 min read',
          completed: true,
          description:
            'Exploring the computational limits of classical Turing machines and the mathematical necessity of quantum superposition.',
          transcript:
            'Welcome to the Quantum Computing Masterclass. Today, we delve into foundational quantum phenomena and how state vectors transform computation from binary registers to high-dimensional Hilbert spaces...',
        },
        {
          id: 'l-2',
          title: 'Wave-Particle Duality & State Vector Superposition',
          duration: '24:15',
          readTime: '6 min read',
          completed: false,
          description:
            'Formalizing qubits on the Bloch sphere, unitary transformations, and complex probability amplitudes.',
        },
        {
          id: 'l-3',
          title: 'Quantum Entanglement, Bell States & Non-Locality',
          duration: '21:00',
          readTime: '5 min read',
          completed: false,
          description:
            'Constructing the four canonical Bell states using Hadamard and CNOT gates to demonstrate non-local correlations.',
        },
      ],
    },
    {
      id: 'mod-2',
      title: 'MODULE 2: QUBITS, QUANTUM GATES & CIRCUIT ARCHITECTURES',
      lessons: [
        {
          id: 'l-4',
          title: 'Single-Qubit Rotations: Pauli X, Y, Z, and Phase Gates',
          duration: '22:40',
          readTime: '5 min read',
          completed: false,
          description:
            'Analyzing unitary matrix representations of single-qubit gates and visualizing arbitrary state rotations.',
        },
        {
          id: 'l-5',
          title: 'Multi-Qubit Entangling Gates & Hamiltonian Simulation',
          duration: '28:10',
          readTime: '7 min read',
          completed: false,
          description:
            'Synthesizing multi-qubit interactions, swap networks, and Trotterized Hamiltonian evolution.',
        },
      ],
    },
    {
      id: 'mod-3',
      title: 'MODULE 3: PYTHON QISKIT COMPILERS & HARDWARE TELEMETRY',
      lessons: [
        {
          id: 'l-6',
          title: 'Writing Quantum Circuits with Python & Qiskit',
          duration: '26:50',
          readTime: '5 min read',
          completed: false,
          description:
            'Setting up IBM Quantum providers, creating QuantumCircuit objects, and executing noisy simulations.',
        },
        {
          id: 'l-7',
          title: 'Compiling & Optimizing Transpiler Pipelines for Real Chips',
          duration: '32:00',
          readTime: '8 min read',
          completed: false,
          description:
            'Mapping virtual qubits to physical coupling graphs and mitigating decoherence errors.',
        },
      ],
    },
  ],
};

export default function InstitutionCoursePlayPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const courseId = (params?.courseId as string) || 'default';

  // 1. Fetch institution data
  const { data: instData } = useQuery({
    queryKey: ['institution-by-slug', slug],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/slug/${slug}`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(slug),
  });

  const institutionName = instData?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // 2. Fetch course details
  const { data: apiCourse } = useCourseDetail(courseId);

  // Active Lesson State
  const [activeLessonId, setActiveLessonId] = useState<string>('l-1');
  const [activeTab, setActiveTab] = useState<'overview' | 'sandbox' | 'qa' | 'notes' | 'resources'>('overview');

  // Player controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [sandboxCode, setSandboxCode] = useState(`import qiskit
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# Initialize 2-qubit Bell State circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

# Simulate on Aer backend
simulator = AerSimulator()
compiled_circuit = transpile(qc, simulator)
job = simulator.run(compiled_circuit, shots=1000)
result = job.result()
counts = result.get_counts(qc)

print("Measurement Counts:", counts)`);
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Notes state
  const [notesList, setNotesList] = useState<{ id: string; time: string; text: string }[]>([
    {
      id: 'n-1',
      time: '04:12',
      text: 'State superposition transforms binary registers to continuous Hilbert vectors.',
    },
    {
      id: 'n-2',
      time: '12:45',
      text: 'CNOT gate creates maximal entanglement between control and target qubits.',
    },
  ]);
  const [newNote, setNewNote] = useState('');

  // Q&A state
  const [questionsList, setQuestionsList] = useState<
    { id: string; author: string; question: string; votes: number; answers: number; time: string }[]
  >([
    {
      id: 'q-1',
      author: 'David K.',
      question: 'How do decoherence times affect two-qubit gate fidelities on superconducting hardware?',
      votes: 12,
      answers: 2,
      time: '05:12',
    },
    {
      id: 'q-2',
      author: 'Elena Rostova',
      question: 'What transpiler optimization level is recommended when targeting heavy noise environments?',
      votes: 8,
      answers: 1,
      time: '14:20',
    },
  ]);
  const [newQuestion, setNewQuestion] = useState('');

  // All lessons flat list
  const playlist = DEFAULT_PLAYLIST;
  const allLessons = useMemo(() => {
    return playlist.modules.flatMap((mod) => mod.lessons);
  }, [playlist]);

  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const currentLesson = allLessons[currentLessonIndex] || allLessons[0];

  const completedCount = allLessons.filter((l) => l.completed).length;
  const totalCount = allLessons.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setActiveLessonId(allLessons[currentLessonIndex + 1].id);
      setIsPlaying(true);
      toast.info(`Playing: ${allLessons[currentLessonIndex + 1].title}`);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setActiveLessonId(allLessons[currentLessonIndex - 1].id);
      setIsPlaying(true);
      toast.info(`Playing: ${allLessons[currentLessonIndex - 1].title}`);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotesList((prev) => [
      ...prev,
      {
        id: `n-${Date.now()}`,
        time: '08:30',
        text: newNote.trim(),
      },
    ]);
    setNewNote('');
    toast.success('Timestamped note saved!');
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setQuestionsList((prev) => [
      {
        id: `q-${Date.now()}`,
        author: 'You',
        question: newQuestion.trim(),
        votes: 1,
        answers: 0,
        time: 'Just now',
      },
      ...prev,
    ]);
    setNewQuestion('');
    toast.success('Question submitted to faculty instructors!');
  };

  const handleRunSandbox = () => {
    setIsRunningCode(true);
    setSandboxOutput(null);
    setTimeout(() => {
      setIsRunningCode(false);
      setSandboxOutput(`[Quantum Sandbox - Aer Backend Transpiler]
Transpilation Target: 2-Qubit Superconducting Lattice
Gate Count: 3 (H: 1, CNOT: 1, Measure: 2)
Simulation Shots: 1000

Execution Output:
Measurement Counts: {'00': 494, '11': 506}
State Fidelity: 99.82% (Entanglement Verified)
Execution time: 42ms`);
      toast.success('Quantum circuit simulated successfully!');
    }, 1200);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        
        {/* Top Learning Navigation Bar */}
        <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/80">
        <div className="flex justify-between items-center px-4 sm:px-8 py-3 max-w-7xl mx-auto w-full">
          
          {/* Breadcrumbs Back to Institution Catalog */}
          <div className="flex items-center gap-3">
            <Link
              href={`/institution/slug/${slug}/courses/${courseId}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pr-3 border-r border-border"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Course Details</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                <Building2 className="size-3.5" />
              </div>
              <span className="font-bold text-xs sm:text-sm tracking-tight text-foreground font-sans truncate max-w-[200px] sm:max-w-xs">
                {institutionName} / {apiCourse?.title || playlist.title}
              </span>
            </div>
          </div>

          {/* Quick Progress Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-card/60 border border-border/80 px-3 py-1 rounded-lg">
              <Sparkles className="size-3.5 text-primary" />
              <span>Progress: <strong>{progressPercent}%</strong> ({completedCount}/{totalCount})</span>
            </div>

            <Link
              href={`/institution/slug/${slug}/courses`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              All Courses
            </Link>
          </div>

        </div>
      </header>

      {/* Main Learning Workspace (Video Player + Sidebar Playlist) */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT/CENTER: Video Player & Interactive Work Tabs */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* 1. CINEMATIC VIDEO PLAYER */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-neutral-950 shadow-2xl flex flex-col justify-between group">
            
            {/* Ambient Background & Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

            {/* Top Bar inside Video Player */}
            <div className="relative z-10 p-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-md text-[11px] font-bold text-primary border border-border/60">
                <Radio className="size-3 text-emerald-400 animate-pulse" />
                <span>INSTITUTIONAL SANDBOX ACTIVE</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-md bg-background/60 backdrop-blur-md text-foreground hover:bg-background transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </div>
            </div>

            {/* Center Play Button Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="size-16 sm:size-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30 transition-transform duration-200 hover:scale-110 cursor-pointer"
              >
                {isPlaying ? <Pause className="size-8 fill-current" /> : <Play className="size-8 fill-current ml-1" />}
              </button>
              <span className="text-xs sm:text-sm font-semibold text-white/90 drop-shadow-md">
                {isPlaying ? 'Playing Lesson Video Stream' : 'Click to Resume Lecture'}
              </span>
            </div>

            {/* Bottom Scrubber & Controls Bar */}
            <div className="relative z-10 p-4 sm:p-5 space-y-2 bg-gradient-to-t from-black/95 to-transparent">
              {/* Progress Timeline Scrubber */}
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
                <div className="bg-primary h-full rounded-full w-2/5 transition-all duration-300" />
              </div>

              <div className="flex items-center justify-between text-xs text-white/80 pt-1">
                <div className="flex items-center gap-3">
                  <span>07:24 / {currentLesson.duration}</span>
                  <span className="text-white/40">•</span>
                  <span className="font-semibold text-white">{currentLesson.title}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-[11px]">
                    {['1x', '1.25x', '1.5x'].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setPlaybackSpeed(spd)}
                        className={cn(
                          'px-1 rounded cursor-pointer transition-colors',
                          playbackSpeed === spd ? 'font-bold text-primary bg-white/20' : 'text-white/60 hover:text-white'
                        )}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.info('Fullscreen toggled')}
                    className="hover:text-white cursor-pointer"
                  >
                    <Maximize2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* 2. LESSON TITLE & NAVIGATION BAR */}
          <div className="rounded-2xl border border-border/80 bg-card/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                {playlist.tag}
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
                {currentLesson.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                className="text-xs cursor-pointer"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                <span>Prev</span>
              </Button>

              <Button
                size="sm"
                onClick={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
                className="text-xs font-bold cursor-pointer"
              >
                <span>Next Lesson</span>
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* 3. INTERACTIVE TABS (OVERVIEW, LIVE SANDBOX, Q&A, NOTES, RESOURCES) */}
          <div className="space-y-4">
            
            {/* Tab Navigation Buttons */}
            <div className="flex items-center gap-2 border-b border-border/80 overflow-x-auto pb-1">
              {[
                { id: 'overview', label: 'Overview & Transcript', icon: FileText },
                { id: 'sandbox', label: 'Interactive Sandbox IDE', icon: Terminal },
                { id: 'qa', label: 'Q&A Discussions', icon: MessageSquare },
                { id: 'notes', label: 'Lecture Notes', icon: Bookmark },
                { id: 'resources', label: 'Resources & Code', icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap',
                      isActive
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content 1: Overview & Transcript */}
            {activeTab === 'overview' && (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-5 shadow-xs">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground font-sans">Lesson Overview</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {currentLesson.description || 'In this lecture, students discover practical quantum hardware synthesis and circuit transpilations with production-ready telemetry.'}
                  </p>
                </div>

                <div className="h-px bg-border/60" />

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground font-sans">Lecture Transcript</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed italic bg-background/50 p-4 rounded-xl border border-border/60">
                    "{currentLesson.transcript || 'Welcome to this lesson module. In the following interactive session, we examine mathematical foundations, verify circuit state amplitudes, and explore multi-tenant execution bounds...'}"
                  </p>
                </div>
              </div>
            )}

            {/* Tab Content 2: Interactive Sandbox IDE */}
            {activeTab === 'sandbox' && (
              <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground font-sans">Browser Python Quantum Compiler Sandbox</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRunSandbox}
                    disabled={isRunningCode}
                    className="text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isRunningCode ? (
                      <>
                        <RotateCcw className="size-3 animate-spin mr-1.5" />
                        <span>Compiling...</span>
                      </>
                    ) : (
                      <>
                        <Play className="size-3 mr-1.5 fill-current" />
                        <span>Run Code</span>
                      </>
                    )}
                  </Button>
                </div>

                <textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl bg-neutral-950 border border-border p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-primary leading-relaxed"
                />

                {sandboxOutput && (
                  <div className="p-4 rounded-xl bg-black border border-emerald-500/30 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
                    {sandboxOutput}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 3: Q&A Discussions */}
            {activeTab === 'qa' && (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-6 shadow-xs">
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground font-sans">Ask a Question</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ask instructors and peers about this lecture..."
                      className="flex-grow rounded-xl bg-background border border-border px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <Button type="submit" size="sm" className="text-xs font-bold cursor-pointer">
                      <Send className="size-3.5 mr-1" />
                      <span>Post</span>
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  {questionsList.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl border border-border/70 bg-card/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-bold text-foreground">{q.author}</span>
                        <span>{q.time}</span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{q.question}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <button
                          type="button"
                          onClick={() => toast.success('Upvoted question')}
                          className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                        >
                          <ThumbsUp className="size-3.5" />
                          <span>{q.votes}</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3.5" />
                          <span>{q.answers} Answers</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content 4: Lecture Notes */}
            {activeTab === 'notes' && (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-5 shadow-xs">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground font-sans">Add Timestamped Note</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type a key takeaway for this timestamp..."
                      className="flex-grow rounded-xl bg-background border border-border px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <Button type="submit" size="sm" className="text-xs font-bold cursor-pointer">
                      <span>Save Note</span>
                    </Button>
                  </div>
                </form>

                <div className="space-y-2.5">
                  {notesList.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-xl border border-border/70 bg-card/80 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono text-[10px] font-bold">
                        {note.time}
                      </span>
                      <p className="text-xs text-foreground leading-relaxed flex-grow">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content 5: Resources */}
            {activeTab === 'resources' && (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-foreground font-sans">Downloadable Assets</h3>
                <div className="space-y-2.5">
                  {[
                    { title: 'Lecture 1 Starter Jupyter Notebook (.ipynb)', size: '2.4 MB' },
                    { title: 'Qiskit Transpiler Architecture Diagram (.pdf)', size: '5.1 MB' },
                    { title: 'Quantum Noise Mitigation Reference Sheet', size: '1.2 MB' },
                  ].map((res, i) => (
                    <div
                      key={i}
                      onClick={() => toast.success(`Downloading ${res.title}...`)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card/80 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="size-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">{res.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{res.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN (1/3 Width): Course Playlist Sidebar */}
        <aside className="w-full lg:w-1/3 shrink-0">
          <div className="sticky top-20 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Playlist Header with Progress */}
            <div className="p-5 border-b border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground font-sans">Course Curriculum</h3>
                <span className="text-xs font-bold text-primary">{progressPercent}% Completed</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Modules & Lessons List */}
            <div className="divide-y divide-border/60 max-h-[580px] overflow-y-auto">
              {playlist.modules.map((mod) => (
                <div key={mod.id} className="p-3 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 block">
                    {mod.title}
                  </span>

                  <div className="space-y-1">
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => {
                            setActiveLessonId(lesson.id);
                            setIsPlaying(true);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer text-xs',
                            isActive
                              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2.5 pr-2">
                            {isActive ? (
                              <Play className="size-3.5 fill-current shrink-0" />
                            ) : lesson.completed ? (
                              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <div className="size-3.5 rounded-full border border-border shrink-0" />
                            )}
                            <span className="line-clamp-1">{lesson.title}</span>
                          </div>
                          <span className={cn('text-[10px] shrink-0 font-mono', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                            {lesson.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </aside>

      </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
