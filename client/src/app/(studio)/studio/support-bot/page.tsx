"use client";

import { useState } from "react";
import { 
  Bot, 
  MessageSquare, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  User, 
  HelpCircle, 
  ArrowRight, 
  Check, 
  X, 
  Upload,
  AlertCircle,
  FileText,
  Clock,
  ThumbsUp,
  Sparkles
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Ticket {
  id: string;
  studentName: string;
  studentEmail: string;
  category: "Refund Request" | "Certificate Issue" | "Billing Query" | "Course Access";
  status: "pending_review" | "auto_resolved" | "manual_resolved";
  createdAt: string;
  query: string;
  conversation: { sender: "student" | "bot"; text: string; time: string }[];
  aiResolutionDraft: {
    action: string;
    description: string;
    requiresApproval: boolean;
    approved?: boolean;
    reasoning: string;
  };
}

export default function StudioSupportBotPage() {
  // Mock support tickets resolved/pending review by the AI Support Agent
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "tkt-101",
      studentName: "Aarav Sharma",
      studentEmail: "aarav.sharma@example.com",
      category: "Refund Request",
      status: "pending_review",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      query: "I bought the React Masterclass 4 days ago, but the content is too basic for my experience. I want a refund please.",
      conversation: [
        { sender: "student", text: "I bought the React Masterclass 4 days ago, but the content is too basic for my experience. I want a refund please.", time: "10:30 AM" },
        { sender: "bot", text: "Hi Aarav, I've received your refund request. I am checking our refund policy parameters: 1) Purchased within 7 days, 2) Completed less than 10% of course content. Let me calculate your progress...", time: "10:30 AM" },
        { sender: "bot", text: "According to our records, you purchased the course 4 days ago and have completed 4% of the lessons. This is within the eligibility threshold! Since this requires instructor approval, I have queued it for review.", time: "10:31 AM" }
      ],
      aiResolutionDraft: {
        action: "Approve Full Refund",
        description: "Refund $99.00 to Visa ending in 4242. Student is eligible under the 7-day, <10% progress threshold.",
        requiresApproval: true,
        reasoning: "Purchase date: May 27 (4 days ago). Course progress: 4.2% completed. Refund policy: 7 days, 10% max progress. Automates refund checkout trigger."
      }
    },
    {
      id: "tkt-102",
      studentName: "Esha Patel",
      studentEmail: "esha.patel@gmail.com",
      category: "Certificate Issue",
      status: "pending_review",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
      query: "I finished all the lectures in the Python course, but when I click the claim certificate button, it says I haven't completed the requirements. Please help, I need this for my LinkedIn resume update today.",
      conversation: [
        { sender: "student", text: "I finished all the lectures in the Python course, but when I click the claim certificate button, it says I haven't completed the requirements. Please help, I need this today.", time: "7:15 AM" },
        { sender: "bot", text: "Hello Esha, checking certificate status for Python Deep Dive. Our policy requires: 1) 100% video lectures watched, 2) Passing all quizzes with >70%. Let me run account diagnostics...", time: "7:15 AM" },
        { sender: "bot", text: "Diagnostics: Video progress is 100%. However, Quiz 3 (Generators) score is 60% (fails passing threshold of 70%). However, you have completed all other criteria. Let me queue this for the instructor to override.", time: "7:16 AM" }
      ],
      aiResolutionDraft: {
        action: "Manual Certificate Override",
        description: "Issue 'Python Deep Dive' completion certificate to Esha Patel despite 60% score on Quiz 3.",
        requiresApproval: true,
        reasoning: "Student completed 100% of lectures and passed 4 out of 5 quizzes with >80%. The single fail was by a narrow margin. Creator can override to boost student experience."
      }
    },
    {
      id: "tkt-103",
      studentName: "John Doe",
      studentEmail: "john.doe@codespace.dev",
      category: "Billing Query",
      status: "auto_resolved",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
      query: "Why was I charged $29 yesterday? I thought I cancelled my subscription last month.",
      conversation: [
        { sender: "student", text: "Why was I charged $29 yesterday? I thought I cancelled my subscription last month.", time: "Yesterday" },
        { sender: "bot", text: "Hi John, checking billing logs for email john.doe@codespace.dev...", time: "Yesterday" },
        { sender: "bot", text: "I found that your active membership (Design Pro Monthly) renewed yesterday because the cancellation request was submitted after the billing cycle cut-off. However, since you haven't watched any videos since the renewal, you can self-cancel now and I will submit a prorated credit. Would you like me to process that?", time: "Yesterday" },
        { sender: "student", text: "Yes, please cancel it completely.", time: "Yesterday" },
        { sender: "bot", text: "Success! I have: 1) Terminated membership renewal, 2) Voided the invoice, 3) Emailed you invoice credit note confirmation. Your access remains active until the end of this billing cycle. The ticket is marked resolved.", time: "Yesterday" }
      ],
      aiResolutionDraft: {
        action: "Auto-Cancelled & Credited",
        description: "Terminated subscription and issued standard system credit. Zero manual action required.",
        requiresApproval: false,
        reasoning: "Aligned with self-serve billing policies. Triggered Stripe webhook for subscription cancellation."
      }
    },
    {
      id: "tkt-104",
      studentName: "Kabir Mehta",
      studentEmail: "kabir.m@designstudio.in",
      category: "Course Access",
      status: "auto_resolved",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      query: "I enrolled in the UI UX Figma track, but it is not showing up in my dashboard. I have the invoice copy here.",
      conversation: [
        { sender: "student", text: "I enrolled in the UI UX Figma track, but it is not showing up in my dashboard. I have the invoice copy here.", time: "1 day ago" },
        { sender: "bot", text: "Hi Kabir, checking payment reference in database...", time: "1 day ago" },
        { sender: "bot", text: "I found your payment (#PAY-99382) under email kabir.mehta@designstudio.in. However, your dashboard login is associated with kabir.m@designstudio.in (a secondary email address). I have linked both accounts and synced your course access. Please refresh your dashboard!", time: "1 day ago" },
        { sender: "student", text: "Ah, that worked! I see it now. Thank you so much!", time: "1 day ago" },
        { sender: "bot", text: "Glad to help! Safe learning, Kabir. I am closing this ticket now.", time: "1 day ago" }
      ],
      aiResolutionDraft: {
        action: "Linked Multi-Email Accounts",
        description: "Synced Figma Track enrollment from secondary account to active learner session.",
        requiresApproval: false,
        reasoning: "Payment verified on database. Account mapping guidelines followed automatically."
      }
    }
  ]);

  const [selectedTicketId, setSelectedTicketId] = useState<string>("tkt-101");
  const [filter, setFilter] = useState<"all" | "pending_review" | "auto_resolved">("pending_review");

  // Refund rules & certificate policies configuration state
  const [refundWindowDays, setRefundWindowDays] = useState(7);
  const [refundMaxProgress, setRefundMaxProgress] = useState(10);
  const [requirePassingQuizzes, setRequirePassingQuizzes] = useState(true);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const filteredTickets = tickets.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const handleApproveAction = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: "manual_resolved",
              aiResolutionDraft: { ...t.aiResolutionDraft, approved: true }
            }
          : t
      )
    );
    alert(`Resolution approved and executed successfully! Notification sent to student.`);
  };

  const handleRejectAction = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: "manual_resolved",
              aiResolutionDraft: { ...t.aiResolutionDraft, approved: false }
            }
          : t
      )
    );
    alert(`Resolution rejected. Ticket transferred to instructor email support.`);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicies(true);
    setTimeout(() => {
      setIsSavingPolicies(false);
      alert("AI Support Agent Guidelines & Policies updated successfully!");
    }, 800);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-foreground" />
            AI Support Copilot
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Configure policy boundaries and approve drafts from your automated customer support resolver.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-2.5 py-1">
            ● Agent Online
          </span>
          <span className="text-[10px] uppercase font-bold text-foreground border border-border px-2.5 py-1">
            91% Auto-Resolution
          </span>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
        <div className="p-5 border-r border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Tickets Today</p>
          <p className="text-headline-lg font-bold mt-1">84</p>
        </div>
        <div className="p-5 border-r border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Resolved by AI</p>
          <p className="text-headline-lg font-bold mt-1 text-green-600">76</p>
        </div>
        <div className="p-5 border-r border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pending Approval</p>
          <p className="text-headline-lg font-bold mt-1 text-amber-600">
            {tickets.filter((t) => t.status === "pending_review").length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Avg. Response Time</p>
          <p className="text-headline-lg font-bold mt-1">4.2s</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-1 border border-border bg-card">
          <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Support Queue</span>
            <div className="flex gap-1.5">
              {(["pending_review", "auto_resolved", "all"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`text-[9px] uppercase font-bold px-2 py-1 border transition-colors ${
                    filter === opt
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {opt.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border max-h-[550px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No tickets found in this queue.</p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full p-4 text-left transition-colors flex flex-col gap-1.5 border-b last:border-b-0 border-border ${
                    selectedTicketId === t.id ? "bg-surface-container" : "hover:bg-surface-container/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{t.id}</span>
                    <span
                      className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                        t.status === "pending_review"
                          ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                          : t.status === "auto_resolved"
                          ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
                          : "bg-foreground text-background border-foreground"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-body-sm font-bold text-foreground line-clamp-1">{t.studentName}</h4>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">{t.category}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.query}</p>
                  <p className="text-[9px] text-muted-foreground font-mono text-right mt-1">
                    {formatRelativeTime(t.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Middle Column: Selected Ticket detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTicket ? (
            <div className="border border-border bg-card">
              {/* Ticket Header */}
              <div className="p-5 border-b border-border bg-surface flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-muted-foreground">{selectedTicket.id}</span>
                    <span className="text-xs font-bold text-foreground">·</span>
                    <span className="text-xs uppercase font-bold text-foreground">{selectedTicket.category}</span>
                  </div>
                  <h3 className="text-headline-sm font-bold text-foreground mt-1">
                    {selectedTicket.studentName}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedTicket.studentEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Captured</p>
                  <p className="text-xs text-foreground font-semibold">
                    {new Date(selectedTicket.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Chat Transcript */}
              <div className="p-5 bg-background border-b border-border space-y-4 max-h-[300px] overflow-y-auto">
                <div className="text-center">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground bg-surface border border-border px-2 py-0.5">
                    Live Dialogue Logs
                  </span>
                </div>

                {selectedTicket.conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[80%] ${
                      msg.sender === "student" ? "mr-auto" : "ml-auto flex-row-reverse"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold border border-border
                          ${msg.sender === "student" ? "bg-surface-container text-foreground" : "bg-foreground text-background"}`}
                      >
                        {msg.sender === "student" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <div
                      className={`p-3 border border-border text-xs leading-relaxed
                        ${msg.sender === "student" ? "bg-card text-foreground" : "bg-surface-container text-foreground"}`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="text-[8px] text-muted-foreground block text-right mt-1 font-mono">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Proposed Resolution Detail */}
              <div className="p-5 bg-surface-container/60 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/10 animate-pulse" />
                    AI Copilot Resolution Proposal
                  </span>
                  <span className="text-[9px] uppercase font-mono tracking-wide text-muted-foreground">
                    Confidence: 98%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Proposed Action</p>
                      <p className="text-body-md font-bold text-foreground">{selectedTicket.aiResolutionDraft.action}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Action Summary</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{selectedTicket.aiResolutionDraft.description}</p>
                    </div>
                    <div className="p-3 bg-card border border-border text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground uppercase text-[9px] block mb-1">AI Rationale:</strong>
                      {selectedTicket.aiResolutionDraft.reasoning}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2.5 border-l border-border pl-4">
                    {selectedTicket.status === "pending_review" ? (
                      <>
                        <button
                          onClick={() => handleApproveAction(selectedTicket.id)}
                          className="w-full py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:opacity-90"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Resolution
                        </button>
                        <button
                          onClick={() => handleRejectAction(selectedTicket.id)}
                          className="w-full py-2 border border-border text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-surface-container flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject Resolution
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4 space-y-2">
                        <ShieldCheck className="w-8 h-8 text-green-600 mx-auto" />
                        <p className="text-[10px] uppercase font-bold text-foreground">Executed</p>
                        {selectedTicket.aiResolutionDraft.approved !== undefined && (
                          <p className="text-[9px] text-muted-foreground">
                            Resolution: {selectedTicket.aiResolutionDraft.approved ? "Approved" : "Rejected"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[450px] border border-border border-dashed flex flex-col items-center justify-center text-center text-muted-foreground bg-card">
              <Bot className="w-12 h-12 opacity-30 text-foreground mb-2" />
              <h4 className="text-sm font-bold uppercase">No Ticket Selected</h4>
              <p className="text-xs max-w-xs mt-1">Select an active ticket from the support queue to view logs and trigger resolutions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines & Policy Settings Workspace */}
      <div className="border border-border p-6 bg-surface-container/60 space-y-6">
        <div>
          <h2 className="text-headline-sm font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            AI Support Policies & Guidelines
          </h2>
          <p className="text-label-sm text-muted-foreground uppercase mt-0.5">
            Configure the boundary constraints within which the bot operates automatically without your intervention.
          </p>
        </div>

        <form onSubmit={handleSavePolicies} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Box: Refund Rules */}
            <div className="border border-border p-5 bg-card space-y-4">
              <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Automatic Refund Window
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Refund Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    value={refundWindowDays}
                    onChange={(e) => setRefundWindowDays(Number(e.target.value))}
                    className="w-full p-2 bg-background border border-border text-xs outline-none focus:border-foreground rounded-none font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Max Content Watched (%)
                  </label>
                  <input
                    type="number"
                    value={refundMaxProgress}
                    onChange={(e) => setRefundMaxProgress(Number(e.target.value))}
                    className="w-full p-2 bg-background border border-border text-xs outline-none focus:border-foreground rounded-none font-semibold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                If a refund request meets these rules, the AI generates a pending invoice rollback. If progress is above the limit or the purchase is older, it automatically drafting a gentle rejection message explaining guidelines.
              </p>
            </div>

            {/* Right Box: Certificate Rules */}
            <div className="border border-border p-5 bg-card space-y-4">
              <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                Certification Policies
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requirePassQuizzes"
                    checked={requirePassingQuizzes}
                    onChange={(e) => setRequirePassingQuizzes(e.target.checked)}
                    className="w-4 h-4 accent-foreground"
                  />
                  <label htmlFor="requirePassQuizzes" className="text-[10px] uppercase font-bold text-foreground cursor-pointer">
                    Require passing scores on all quizzes
                  </label>
                </div>

                {requirePassingQuizzes && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Min Passing Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                      className="w-24 p-2 bg-background border border-border text-xs outline-none focus:border-foreground rounded-none font-semibold"
                    />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Controls automatic certificate releases. If requirements are not met, the bot details missing requirements and suggests exactly which quizzes or videos are pending review.
              </p>
            </div>
          </div>

          {/* Document Upload / RAG Injection */}
          <div className="border border-border p-5 bg-card space-y-4">
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-muted-foreground" />
              Upload Academy Policy Knowledge Base (PDF, TXT, MD)
            </h3>
            
            <div className="border-2 border-dashed border-border p-6 text-center bg-background hover:bg-surface-container/30 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold uppercase text-foreground">Click or Drag Guidelines Document Here</p>
              <p className="text-[9px] text-muted-foreground uppercase mt-1">Upload refund policies, course schedules, or Terms of Service</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-surface border border-border text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-foreground flex-shrink-0" />
              <span>
                Uploaded policies are automatically embedded in the AI Support semantic search database, so the bot answers questions like <em>"How do I cancel?"</em> using your exact wording.
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingPolicies}
              className="px-6 py-3 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 disabled:opacity-40"
            >
              {isSavingPolicies ? "Saving policies..." : "Save AI Policies & Guidelines"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
