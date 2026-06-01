"use client";

import { useState } from "react";
import { User, Check, Settings } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function LearnerProfileSettingsPage() {
  const user = useAppSelector((s) => s.auth.user) || {
    name: "Alex Johnson",
    email: "alex@example.com",
  };

  const [profile, setProfile] = useState({
    fullName: user.name,
    username: user.name.toLowerCase().replace(/\s+/g, "_") + "_lx",
    bio: "Senior Developer focusing on structural design systems.",
    country: "India",
    language: "English (IN)",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [whatsappAlert, setWhatsappAlert] = useState<{ title: string; msg: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Settings</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase text-label-md tracking-wider">
          Student Profile & Preferences
        </p>
      </div>

      {/* Main settings grid */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sub nav tabs sidebar */}
        <aside className="w-full md:w-56 flex-shrink-0">
          <ul className="space-y-1">
            {[
              { label: "Profile", active: true },
              { label: "Account Settings", active: false },
              { label: "Preferences", active: false },
              { label: "Security & 2FA", active: false },
              { label: "Billing & Passes", active: false },
            ].map((tab) => (
              <li key={tab.label}>
                <button
                  className={`w-full text-left px-4 py-2 text-label-md uppercase tracking-wider font-bold border transition-colors
                    ${
                      tab.active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-surface-container border-border text-foreground hover:border-foreground"
                    }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Settings form container */}
        <div className="flex-grow max-w-3xl space-y-6">
          <form onSubmit={handleSave} className="border border-border p-6 bg-background space-y-6">
            <h2 className="text-headline-sm font-bold text-foreground border-b border-border pb-2 mb-4">
              Profile Details
            </h2>

            {/* Avatar Row */}
            <div className="flex gap-6 items-start">
              <div className="w-20 h-20 border border-border bg-surface-container flex items-center justify-center flex-shrink-0 rounded-none text-muted-foreground">
                <User className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold transition-all bg-background"
                >
                  Upload Avatar
                </button>
                <p className="text-label-xs text-muted-foreground uppercase">
                  JPG, PNG only. Max size 2MB.
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={profile.username}
                  className="w-full p-2.5 bg-surface-container border border-border text-body-sm outline-none rounded-none text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Bio Description
              </label>
              <textarea
                rows={4}
                required
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Country
                </label>
                <select
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Display Language
                </label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="English (IN)">English (IN)</option>
                  <option value="English (US)">English (US)</option>
                  <option value="German">German</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            {/* WhatsApp Integration Block (from Feature Expansion Report 2.2) */}
            <div className="border border-border p-6 bg-surface-container/60 space-y-4 relative">
              <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">
                WhatsApp Communication Bridge
              </h3>
              <p className="text-body-sm text-muted-foreground leading-relaxed">
                Get real-time updates for live class schedules, mock test reports, and doubt solver resolutions sent directly to your registered mobile number.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="whatsappEnabled"
                    className="w-4 h-4 border-border rounded-none focus:ring-0 cursor-pointer accent-foreground"
                    defaultChecked
                  />
                  <label htmlFor="whatsappEnabled" className="text-label-sm uppercase font-bold text-foreground cursor-pointer select-none">
                    Enable WhatsApp alerts & test reports
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const alerts = [
                      {
                        title: "🟢 LIVE CLASS REMINDER",
                        msg: "Class starting in 10 minutes: 'CPython Memory Models' is now live! Tap to join Watch Room: http://localhost:3000/learn/watch/lesson-1"
                      },
                      {
                        title: "📝 GRADED TEST REPORT",
                        msg: "Assessment results: You scored 87% in 'Core Python Syntax Exam'. View breakdown & proctor log details: http://localhost:3000/learn/quiz/q1"
                      },
                      {
                        title: "💡 DOUBT RESOLVED",
                        msg: "Lead Instructor answered your query about 'functools.wraps': 'Without @wraps, decorators overwrite metadata...'. Tap to read: http://localhost:3000/learn/watch/lesson-1"
                      }
                    ];
                    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
                    setWhatsappAlert(randomAlert);
                    setTimeout(() => setWhatsappAlert(null), 6000);
                  }}
                  className="px-3 py-1.5 border border-foreground hover:bg-foreground hover:text-background text-[10px] uppercase font-bold tracking-widest transition-colors bg-background"
                >
                  Send Test Alert
                </button>
              </div>

              {/* Simulated Phone WhatsApp Notification Mockup */}
              {whatsappAlert && (
                <div className="fixed bottom-6 right-6 z-[100] w-80 bg-zinc-950 text-white border border-zinc-800 p-4 shadow-2xl animate-fade-in font-sans">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        W
                      </div>
                      <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">WhatsApp • LearnioX</span>
                    </div>
                    <button 
                      onClick={() => setWhatsappAlert(null)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-zinc-300 tracking-wide">{whatsappAlert.title}</p>
                    <p className="text-[11px] text-zinc-400 leading-snug">{whatsappAlert.msg}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-6 flex justify-between items-center">
              {saveSuccess && (
                <span className="text-label-sm font-bold uppercase text-foreground flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Profile settings saved!
                </span>
              )}
              <div className="flex-grow" />
              <div className="flex gap-4">
                <button
                  type="button"
                  className="px-6 py-2.5 border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold transition-all bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-foreground text-background hover:opacity-85 text-label-md uppercase tracking-wider font-bold transition-opacity disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

