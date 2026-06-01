"use client";

import { useState } from "react";
import { FileQuestion, Plus, Check } from "lucide-react";

export default function StudioQuizzesPage() {
  const [quizzes, setQuizzes] = useState([
    { id: "q1", title: "Core Python Syntax & Memory Internals", questions: 10, course: "Advanced Python for Data Science" },
    { id: "q2", title: "React Component Archetype & Lifecycle", questions: 5, course: "Design Systems in React" }
  ]);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("Advanced Python for Data Science");
  const [questions, setQuestions] = useState(5);
  const [isSaved, setIsSaved] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setQuizzes([
      ...quizzes,
      { id: `q-${Date.now()}`, title, questions, course }
    ]);
    setTitle("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Quiz Builder</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Assemble multiple-choice quizzes and exams for course programs
        </p>
      </div>

      {isSaved && (
        <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Quiz template created. Edit questions in curriculum builder.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Quizzes list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Configured Quizzes</h3>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="border border-border bg-card p-5 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground leading-snug">{quiz.title}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{quiz.course} • {quiz.questions} Questions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="border border-border bg-card p-5 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">Create Quiz</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Quiz Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Memory Internals..."
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Associated Program</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none"
              >
                <option value="Advanced Python for Data Science">Advanced Python for Data Science</option>
                <option value="Design Systems in React">Design Systems in React</option>
                <option value="Foundations of Structural UI Design">Foundations of Structural UI Design</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Number of Questions</label>
              <input
                type="number"
                value={questions}
                onChange={(e) => setQuestions(Number(e.target.value))}
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Quiz Template
          </button>
        </form>
      </div>
    </div>
  );
}
