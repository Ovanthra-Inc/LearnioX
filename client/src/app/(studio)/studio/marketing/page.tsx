"use client";

import { useState } from "react";
import { Megaphone, Users, UserPlus, Gift, ArrowUpRight, Search, Plus, Mail, Sparkles } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function StudioMarketingPage() {
  const [searchLeads, setSearchLeads] = useState("");
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [marketingBundle, setMarketingBundle] = useState(false);
  const [marketingTab, setMarketingTab] = useState<"email" | "social" | "blog">("email");

  const handleGenerateMarketingBundle = () => {
    setIsGeneratingMarketing(true);
    setTimeout(() => {
      setMarketingBundle(true);
      setIsGeneratingMarketing(false);
    }, 1200);
  };

  // Mock leads captured from free content/newsletter
  const [leads] = useState([
    { id: "lead-1", email: "jeff@uxdesign.com", source: "Free Video: Grid Systems", capturedAt: "2024-05-28T09:00:00Z", status: "subscribed" },
    { id: "lead-2", email: "nisha@kapoor.me", source: "Free Video: Typography", capturedAt: "2024-05-28T08:30:00Z", status: "subscribed" },
    { id: "lead-3", email: "daniel@architecture.io", source: "Newsletter Popup", capturedAt: "2024-05-27T18:15:00Z", status: "unsubscribed" },
    { id: "lead-4", email: "priya.sharma@gmail.com", source: "Free Video: Grid Systems", capturedAt: "2024-05-26T12:00:00Z", status: "subscribed" },
    { id: "lead-5", email: "steve@codespace.dev", source: "Newsletter Popup", capturedAt: "2024-05-25T14:40:00Z", status: "subscribed" },
  ]);

  // Mock referrals tracking
  const [referrals] = useState([
    { id: "ref-1", referrerName: "Alex Johnson", referrerEmail: "alex@example.com", refereeEmail: "friend1@example.com", status: "completed", rewardIssued: "10% Coupon" },
    { id: "ref-2", referrerName: "Sarah J.", referrerEmail: "sarah.j@example.com", refereeEmail: "friend2@example.com", status: "pending", rewardIssued: "Pending Sale" },
    { id: "ref-3", referrerName: "Mike T.", referrerEmail: "mike@example.com", refereeEmail: "colleague@office.com", status: "completed", rewardIssued: "10% Coupon" },
  ]);

  // Referral settings state
  const [referralReward, setReferralReward] = useState("10% discount on next purchase");

  const filteredLeads = leads.filter(
    (l) =>
      l.email.toLowerCase().includes(searchLeads.toLowerCase()) ||
      l.source.toLowerCase().includes(searchLeads.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Marketing & Leads</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Grow your audience, track referral signups, and monitor lead capture programs.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity">
          <Mail className="w-4 h-4" />
          Broadcast Email to Leads
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Marketing Leads</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +14%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">{formatNumber(1840)}</p>
        </div>

        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Referral Signups</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +8%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">{formatNumber(342)}</p>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Lead Conversion Rate</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5">
              Avg 12.4%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">12.4%</p>
        </div>
      </div>

      {/* One-Click Marketing Distribution Engine (from Feature Expansion Report 2.2) */}
      <div className="border border-border p-6 bg-surface-container/60 space-y-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h2 className="text-headline-sm font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              One-Click Marketing Distribution Engine
            </h2>
            <p className="text-label-sm text-muted-foreground uppercase mt-0.5">
              Auto-generate newsletters, blogs, and social campaigns from course transcripts
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateMarketingBundle}
            disabled={isGeneratingMarketing}
            className="px-4 py-2 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
            {isGeneratingMarketing ? "Generating Campaigns..." : "Generate Marketing Bundle"}
          </button>
        </div>

        {isGeneratingMarketing && (
          <div className="py-6 flex flex-col items-center justify-center space-y-2 border border-dashed border-border bg-background">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
            <p className="text-xs uppercase font-mono tracking-widest text-muted-foreground">Scanning curriculum transcripts & compiling copy...</p>
          </div>
        )}

        {marketingBundle && !isGeneratingMarketing && (
          <div className="border border-border bg-background flex flex-col overflow-hidden animate-fade-in">
            {/* Tab selector */}
            <div className="flex border-b border-border bg-surface">
              {[
                { id: "email", label: "Email Newsletter" },
                { id: "social", label: "Twitter/X Thread" },
                { id: "blog", label: "Blog Summary" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMarketingTab(tab.id as any)}
                  className={`px-4 py-3 text-[10px] uppercase tracking-wider font-bold border-r border-border transition-colors ${
                    marketingTab === tab.id
                      ? "bg-card text-foreground border-b-2 border-b-foreground"
                      : "text-muted-foreground hover:bg-surface-container"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content box */}
            <div className="p-5 font-sans text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-card">
              {marketingTab === "email" && (
                <div className="space-y-2 text-left">
                  <p className="font-bold text-foreground">Subject: Master CPython Memory Internals in 15 Minutes 🐍</p>
                  <p className="text-muted-foreground">
                    "Hey there learner,
                    {"\n"}Have you ever wondered how CPython allocates objects under the hood? Or why reference cycles can silently degrade performance?
                    {"\n"}In our latest advanced lecture, we break down CPython generational garbage collection, custom reference tracking, and debugging cycles.
                    {"\n"}Tap here to watch the previews and unlock advanced loops: http://localhost:3000/learn/watch/lesson-1"
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Broadcast sent successfully to 1,840 subscribed leads!");
                    }}
                    className="mt-3 px-3 py-1.5 bg-foreground text-background text-[9px] uppercase font-bold tracking-widest hover:opacity-90"
                  >
                    Broadcast to 1,840 Leads Now
                  </button>
                </div>
              )}

              {marketingTab === "social" && (
                <div className="space-y-2 text-left">
                  <p className="text-muted-foreground font-mono">
                    1/ How does CPython manage memory? It's not just basic generational tracing.
                    {"\n"}Here is a quick breakdown of reference counting and generational cycles. 🧵...
                    {"\n"}{"\n"}2/ CPython relies on Reference Counting as its primary reclamation. But cycles (A references B, B references A) require the generational collector.
                    {"\n"}{"\n"}3/ Learn how to vectorize loops with NumPy meshgrids to bypass python loop latency. Read the full post here: http://localhost:3000/learn/watch/lesson-1
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("How does CPython manage memory?...");
                      alert("Copied Twitter thread to clipboard!");
                    }}
                    className="mt-3 px-3 py-1.5 bg-foreground text-background text-[9px] uppercase font-bold tracking-widest hover:opacity-90"
                  >
                    Copy Thread Pack
                  </button>
                </div>
              )}

              {marketingTab === "blog" && (
                <div className="space-y-2 text-left">
                  <p className="font-bold text-foreground">Title: Vectorizing Python Nested Loops with NumPy Broadcasting</p>
                  <p className="text-muted-foreground">
                    "In nested coordinate calculations, standard python loops suffer from interpreter overhead. By utilizing NumPy's `meshgrid` and vector broadcasting, we can map calculations across array coordinates in a single C-level vector step, achieving up to 42x latencies reduction. Here is the implementation..."
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Blog post draft published to your white-label academy domain!");
                    }}
                    className="mt-3 px-3 py-1.5 bg-foreground text-background text-[9px] uppercase font-bold tracking-widest hover:opacity-90"
                  >
                    Publish to Blog Drafts
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Leads Capture List & Referral Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Settings Panel */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold">Referral Program</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Reward students for inviting colleagues</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Referral Reward
              </label>
              <input
                type="text"
                value={referralReward}
                onChange={(e) => setReferralReward(e.target.value)}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoApprove" defaultChecked className="w-4 h-4 accent-foreground" />
              <label htmlFor="autoApprove" className="text-label-sm uppercase font-bold cursor-pointer">
                Auto-approve coupon rewards
              </label>
            </div>

            <button className="w-full py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity">
              Save Program Settings
            </button>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="text-label-sm font-bold uppercase">Recent Referral Signups</h4>
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div key={ref.id} className="p-3 border border-border space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-body-sm font-bold text-foreground truncate max-w-[150px]">
                      {ref.referrerName}
                    </p>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 border
                        ${
                          ref.status === "completed"
                            ? "bg-foreground text-background border-foreground"
                            : "bg-surface-container text-muted-foreground border-border"
                        }`}
                    >
                      {ref.status}
                    </span>
                  </div>
                  <p className="text-label-xs text-muted-foreground">Invited: {ref.refereeEmail}</p>
                  <p className="text-label-xs font-semibold text-foreground">Reward: {ref.rewardIssued}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Capture Directory */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-headline-sm font-bold">Leads Directory</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Email leads captured from opt-ins</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchLeads}
                onChange={(e) => setSearchLeads(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground bg-surface-container">
                  <th className="p-3 text-label-xs uppercase font-bold">Email Address</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Acquisition Source</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Captured At</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-body-sm text-muted-foreground">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3 font-semibold text-foreground">{lead.email}</td>
                      <td className="p-3 text-muted-foreground">{lead.source}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(lead.capturedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                            ${
                              lead.status === "subscribed"
                                ? "bg-foreground text-background"
                                : "bg-muted-foreground/20 text-muted-foreground line-through"
                            }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
