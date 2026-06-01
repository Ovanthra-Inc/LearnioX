"use client";

import { useState } from "react";
import { Bot, Sparkles, Send, Check, Copy } from "lucide-react";

export default function AICopilotPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationResult(null);

    // Simulate AI pipeline delay
    setTimeout(() => {
      setIsGenerating(false);
      if (prompt.toLowerCase().includes("quiz")) {
        setGenerationResult(
          `### Generated Assessment: React Component Lifecycle Quiz\n\n` +
          `**Q1. Which lifecycle method is invoked immediately after a component is inserted into the DOM?**\n` +
          `- A) componentDidUpdate()\n` +
          `- B) componentWillUnmount()\n` +
          `- C) componentDidMount()  *[Correct]*\n` +
          `- D) render()\n\n` +
          `**Q2. What hook is the direct equivalent of componentDidMount for functional components?**\n` +
          `- A) useState()\n` +
          `- B) useEffect(fn, [])  *[Correct]*\n` +
          `- C) useContext()\n` +
          `- D) useEffect(fn)`
        );
      } else if (prompt.toLowerCase().includes("physics") || prompt.toLowerCase().includes("jee")) {
        setGenerationResult(
          `### Generated Program Outline: JEE Physics — Electrostatics\n\n` +
          `**Module 1: Electric Charges and Fields**\n` +
          `- Lesson 1.1: Coulomb's Law & Vector Form (Duration: 30m, Video)\n` +
          `- Lesson 1.2: Superposition Principle in Action (Duration: 45m, Video)\n` +
          `- Lesson 1.3: Practice Quiz: Charge Distributions (5 Questions, Quiz)\n\n` +
          `**Module 2: Gauss's Law & Potentials**\n` +
          `- Lesson 2.1: Calculating Flux for Symmetric Surfaces (Duration: 40m, Video)\n` +
          `- Lesson 2.2: Electric Potential Energy of Systems (Duration: 35m, Video)\n` +
          `- Lesson 2.3: Assignment: Flux Integration Worksheet (Assignment)`
        );
      } else {
        setGenerationResult(
          `### Generated Program Outline: ${prompt}\n\n` +
          `**Module 1: Foundational Framework**\n` +
          `- Lesson 1.1: Core Terminology & Context (Duration: 20m, Video)\n` +
          `- Lesson 1.2: Basic Practical Exercises (Duration: 30m, Video)\n` +
          `- Lesson 1.3: Concept Review Quiz (5 Questions, Quiz)\n\n` +
          `**Module 2: Advanced Integrations**\n` +
          `- Lesson 2.1: Real-world Case Studies (Duration: 45m, Video)\n` +
          `- Lesson 2.2: Custom Build Implementation (Duration: 60m, Video)\n` +
          `- Lesson 2.3: Final Lab Worksheets (Assignment)`
        );
      }
    }, 2000);
  };

  const handleCopy = () => {
    if (!generationResult) return;
    navigator.clipboard.writeText(generationResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[900px] mx-auto py-6 font-sans space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">AI Copilot Workspace</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Augment your academy curriculum using simulated AI pipelines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Prompter */}
        <div className="border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Bot className="w-5 h-5 text-foreground" />
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Syllabus Prompter</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                Instruction
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Generate JEE Physics course outline or Create a React lifecycle quiz..."
                rows={6}
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 bg-foreground text-background text-label-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> {isGenerating ? "Generating draft..." : "Generate Draft"}
            </button>
          </form>

          {/* Quick presets */}
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Example Prompts</p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setPrompt("Generate outline for JEE Physics - Electrostatics")}
                className="w-full text-left p-2 border border-border bg-surface text-[10px] uppercase font-bold text-muted-foreground hover:bg-surface-container"
              >
                JEE Physics Outline
              </button>
              <button
                onClick={() => setPrompt("Create a React component lifecycle quiz")}
                className="w-full text-left p-2 border border-border bg-surface text-[10px] uppercase font-bold text-muted-foreground hover:bg-surface-container"
              >
                React Lifecycle Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Results */}
        <div className="lg:col-span-2 border border-border bg-card min-h-[420px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border bg-surface flex justify-between items-center flex-shrink-0">
            <span className="text-label-sm font-bold uppercase tracking-wider text-foreground">
              Generated Artifact
            </span>
            {generationResult && (
              <button
                onClick={handleCopy}
                className="p-1 border border-border bg-card text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto font-sans leading-relaxed">
            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                  Analyzing program directories...
                </p>
              </div>
            )}

            {!isGenerating && !generationResult && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                <Sparkles className="w-8 h-8 opacity-40 text-foreground" />
                <p className="text-xs uppercase font-bold tracking-wider">Workspace Empty</p>
                <p className="text-xs max-w-xs mx-auto">
                  Type a custom prompt on the left pane and generate a syllabus or quiz structure to start.
                </p>
              </div>
            )}

            {!isGenerating && generationResult && (
              <div className="text-body-sm text-foreground space-y-4 whitespace-pre-wrap">
                {generationResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
