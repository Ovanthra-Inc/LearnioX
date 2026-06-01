"use client";

import { useState, useEffect } from "react";
import { Radio, Plus, Check, Calendar, Clock, Video, Sparkles, Bot, MessageSquare, ShieldAlert } from "lucide-react";

export default function StudioLiveClassesPage() {
  const [classes, setClasses] = useState([
    { id: "c1", topic: "Electrostatics Advanced Problem Solving", time: "10:00 AM", date: "Saturday, June 6", zoomId: "852 9631 7410" },
    { id: "c2", topic: "React Components Live Code Review", time: "04:00 PM", date: "Sunday, June 7", zoomId: "987 6543 2100" }
  ]);
  const [topic, setTopic] = useState("");
  const [time, setTime] = useState("10:00 AM");
  const [date, setDate] = useState("Saturday, June 13");
  const [isSaved, setIsSaved] = useState(false);

  // Live Chat Monitor states
  const [monitorTopic, setMonitorTopic] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<{ user: string; msg: string; type: "chat" | "spam" | "question" }[]>([]);
  const [qaQueue, setQaQueue] = useState<string[]>([]);
  const [spamCount, setSpamCount] = useState(0);

  // Simulate scrolling chat log
  useEffect(() => {
    if (!monitorTopic) return;

    // Reset simulator states
    setChatLog([
      { user: "System", msg: "🟢 Live chat room initialized. AI Moderator is active.", type: "chat" }
    ]);
    setQaQueue([]);
    setSpamCount(0);

    const chatFlow = [
      { user: "Rohan S.", msg: "Hello sir! Excited for the session.", type: "chat" as const },
      { user: "Alice L.", msg: "Will the superposition physics formula slides be shared after?", type: "question" as const },
      { user: "CryptoBot", msg: "FREE COUPONS! Visit cryptorich.net for free token allocations!", type: "spam" as const },
      { user: "Dev K.", msg: "Sir, does CPython use reference cycles to release memory or tracing collectors?", type: "question" as const },
      { user: "Vikram P.", msg: "Awesome vector calculations inside the Python notebooks.", type: "chat" as const },
      { user: "AdSpam", msg: "Get followers fast! Cheap prices at fastboosters.com", type: "spam" as const },
      { user: "Nisha M.", msg: "Is there a limit to how many decorators we can nest in CPython?", type: "question" as const },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step >= chatFlow.length) {
        clearInterval(interval);
        return;
      }
      const item = chatFlow[step];
      
      // Update chat logs
      setChatLog((prev) => [...prev, item]);

      if (item.type === "spam") {
        setSpamCount((prev) => prev + 1);
      } else if (item.type === "question") {
        setQaQueue((prev) => [...prev, item.msg]);
      }
      
      step++;
    }, 1800);

    return () => clearInterval(interval);
  }, [monitorTopic]);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setClasses([
      ...classes,
      { id: `cls-${Date.now()}`, topic, time, date, zoomId: "854 3629 1845" }
    ]);
    setTopic("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Live Classes</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Schedule and manage live lectures for your program batches
        </p>
      </div>

      {isSaved && (
        <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Live lecture batch scheduled successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Classes list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Scheduled Live Batches</h3>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div key={cls.id} className="border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center flex-shrink-0">
                    <Radio className="w-5 h-5 text-foreground animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground leading-snug">{cls.topic}</h4>
                    <div className="flex gap-4 text-xs text-muted-foreground font-mono mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {cls.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {cls.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-4 flex-shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setMonitorTopic(cls.topic)}
                    className="px-2.5 py-1 border border-border hover:border-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-surface hover:bg-surface-container transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/10" />
                    Monitor Chat
                  </button>
                  <p className="text-xs font-mono font-bold text-foreground flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {cls.zoomId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule form */}
        <form onSubmit={handleSchedule} className="border border-border bg-card p-5 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">Schedule Lecture</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Class Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Intro to Electrostatics..."
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Class Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Class Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!topic.trim()}
            className="w-full py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Schedule Batch
          </button>
        </form>
      </div>

      {/* AI Live Chat Co-Pilot Moderation panel */}
      {monitorTopic && (
        <div className="border border-border p-6 bg-surface-container/60 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest font-mono">Live Session Workspace</span>
              <h3 className="text-headline-sm font-bold text-foreground mt-0.5">{monitorTopic}</h3>
            </div>
            <button
              onClick={() => setMonitorTopic(null)}
              className="px-3 py-1.5 border border-border text-[10px] uppercase font-bold tracking-widest hover:bg-surface-container transition-colors bg-background"
            >
              Stop Monitoring
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Live Chat Stream (Spam-Filtered) */}
            <div className="lg:col-span-2 border border-border bg-background flex flex-col h-80 overflow-hidden">
              <div className="p-3 bg-surface-container border-b border-border flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase">
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-foreground" /> Chat Feed</span>
                <span className="text-rose-600 font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Blocked Spam: {spamCount}</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-3 font-sans text-xs">
                {chatLog.map((chat, idx) => (
                  <div key={idx} className={`p-2.5 border transition-all ${
                    chat.type === "spam"
                      ? "border-rose-100 bg-rose-50/50 text-rose-500 line-through dark:border-rose-950/20 dark:bg-rose-950/10"
                      : chat.type === "question"
                      ? "border-amber-200 bg-amber-50/20 text-foreground dark:border-amber-900/30"
                      : "border-border bg-card text-foreground"
                  }`}>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>{chat.user}</span>
                      <span className="font-mono font-normal uppercase text-[8px] text-muted-foreground">{chat.type}</span>
                    </div>
                    <p className="leading-snug">{chat.type === "spam" ? "[BLOCKED SPAM LINK] " + chat.msg : chat.msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Aggregated Q&A Queue */}
            <div className="border border-border bg-background flex flex-col h-80 overflow-hidden">
              <div className="p-3 bg-surface-container border-b border-border flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase">
                <span className="flex items-center gap-1 font-bold text-foreground"><Bot className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" /> AI Q&A Queue</span>
                <span>{qaQueue.length} Questions</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-2.5 font-sans text-xs">
                {qaQueue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Sparkles className="w-8 h-8 opacity-40 text-foreground" />
                    <p className="text-[10px] uppercase font-bold tracking-wider mt-2">Listening Chat Stream</p>
                    <p className="text-[9px] max-w-[150px] mx-auto mt-1">AI will automatically pool clean questions here.</p>
                  </div>
                ) : (
                  qaQueue.map((q, idx) => (
                    <div key={idx} className="p-3 border border-border bg-surface-container flex items-start gap-2.5">
                      <span className="font-bold text-[10px] font-mono bg-foreground text-background w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="leading-snug">
                        <p className="font-medium text-foreground">{q}</p>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Response marked: 'I will address this live right now!'`);
                            setQaQueue(qaQueue.filter((item) => item !== q));
                          }}
                          className="mt-2 text-[9px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Mark Addressed
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
