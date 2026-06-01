"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Shield, 
  HelpCircle, 
  Check, 
  Globe, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  User, 
  Calendar, 
  Network 
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateInstitutionType } from "@/store/slices/institution.slice";
import type { InstitutionType } from "@/types/institution";

export default function StudioSettingsPage() {
  const institution = useAppSelector((s) => s.institution.selectedInstitution);
  const dispatch = useAppDispatch();

  const [profile, setProfile] = useState({
    name: "Design Institute",
    tagline: "Premier Academy for UI/UX Professionals",
    description: "LearnioX's flagship design division focusing on grids, layout, systems, and frontend frameworks.",
    subdomain: "design-institute",
    supportEmail: "support@designinstitute.in",
  });

  const [instType, setInstType] = useState<InstitutionType>("general");

  useEffect(() => {
    if (institution) {
      setProfile({
        name: institution.name,
        tagline: institution.tagline,
        description: institution.description,
        subdomain: institution.slug,
        supportEmail: institution.contactEmail || "support@designinstitute.in",
      });
      setInstType(institution.institutionType || "general");
    }
  }, [institution]);

  const [toggles, setToggles] = useState({
    enableCommunity: true,
    autoApproveReviews: false,
    allowStudentNotes: true,
    enableAiCopilot: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      dispatch(updateInstitutionType(instType));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Academy Settings</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Manage your institution profile, custom domain configurations, and platform settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Settings */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Academy Profile</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Public information about your school</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Academy Name
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Short Tagline
              </label>
              <input
                type="text"
                required
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                About / Biography
              </label>
              <textarea
                rows={4}
                required
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Institution Type Selector */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Institution Specialization Format</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Customize the dashboards, features, and terminology of your academy</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "general",
                label: "General Platform",
                description: "Multi-purpose layout for generic courses, video channels, and flexible community resources.",
                icon: <Sparkles className="w-5 h-5" />
              },
              {
                id: "college_university",
                label: "College / University",
                description: "Optimized for academic semesters, credit allocation, degree structures, and enrollment portals.",
                icon: <GraduationCap className="w-5 h-5" />
              },
              {
                id: "corporate_training",
                label: "Corporate Training Center",
                description: "Focuses on corporate compliance tracks, department skill mapping, and external HR links.",
                icon: <Briefcase className="w-5 h-5" />
              },
              {
                id: "edtech_startup",
                label: "EdTech Startup",
                description: "Ideal for multi-instructor marketplaces, payment subscription billing, and lockable cohorts.",
                icon: <Globe className="w-5 h-5" />
              },
              {
                id: "k12_school",
                label: "K-12 School",
                description: "Tailored for young pupils, featuring parent portals, safety filters, and gamified badges.",
                icon: <User className="w-5 h-5" />
              },
              {
                id: "workshop_seminar",
                label: "Workshop / Seminar",
                description: "Perfect for virtual events, ticketing levels, session schedules, and live Q&A pools.",
                icon: <Calendar className="w-5 h-5" />
              },
              {
                id: "organization",
                label: "Organization / NGO",
                description: "Broad layouts designed for non-profit fundraising campaigns, grant reporting, and localization.",
                icon: <Network className="w-5 h-5" />
              }
            ].map((type) => (
              <div
                key={type.id}
                onClick={() => setInstType(type.id as any)}
                className={`p-4 border cursor-pointer transition-all flex items-start gap-3 rounded-none relative
                  ${instType === type.id 
                    ? "border-foreground bg-surface-container shadow-xs font-bold" 
                    : "border-border hover:border-foreground"
                  }`}
              >
                <div className={`p-2 border border-border flex items-center justify-center shrink-0
                  ${instType === type.id ? "bg-foreground text-background" : "bg-card text-foreground"}`}>
                  {type.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-foreground">{type.label}</p>
                  <p className="text-[11px] font-normal leading-normal text-muted-foreground">{type.description}</p>
                </div>
                {instType === type.id && (
                  <span className="absolute top-2 right-2 text-[8px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 bg-foreground text-background">
                    active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Domain Settings */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Routing & Subdomain</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Manage links and URLs</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Subdomain slug
              </label>
              <div className="flex items-center">
                <span className="p-2.5 bg-surface-container border border-r-0 border-border text-body-sm text-muted-foreground select-none">
                  learniox.com/c/
                </span>
                <input
                  type="text"
                  required
                  value={profile.subdomain}
                  onChange={(e) => setProfile({ ...profile, subdomain: e.target.value })}
                  className="flex-1 p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none font-mono"
                />
              </div>
              <p className="text-label-xs text-muted-foreground mt-1">
                This corresponds to your public academy route channel: <strong>learniox.com/c/{profile.subdomain}</strong>
              </p>
            </div>

            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                required
                value={profile.supportEmail}
                onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Global Feature Toggles */}
        <div className="border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Global Settings</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Enable or disable core features</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-3 border border-border">
              <div className="space-y-1 pr-4">
                <label className="text-label-md font-bold uppercase text-foreground">
                  Enable Community Discussions
                </label>
                <p className="text-body-sm text-muted-foreground">
                  Allow students to write posts and message in the institution channel feed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={toggles.enableCommunity}
                onChange={(e) => setToggles({ ...toggles, enableCommunity: e.target.checked })}
                className="w-5 h-5 accent-foreground mt-1 flex-shrink-0 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between p-3 border border-border">
              <div className="space-y-1 pr-4">
                <label className="text-label-md font-bold uppercase text-foreground">
                  Auto-approve Reviews
                </label>
                <p className="text-body-sm text-muted-foreground">
                  Publish student feedback scores automatically without placing them in the moderation audit queue.
                </p>
              </div>
              <input
                type="checkbox"
                checked={toggles.autoApproveReviews}
                onChange={(e) => setToggles({ ...toggles, autoApproveReviews: e.target.checked })}
                className="w-5 h-5 accent-foreground mt-1 flex-shrink-0 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between p-3 border border-border">
              <div className="space-y-1 pr-4">
                <label className="text-label-md font-bold uppercase text-foreground">
                  Enable AI Copilot Workspace
                </label>
                <p className="text-body-sm text-muted-foreground">
                  Allow team instructors to trigger mock-AI course outlines and question set generators.
                </p>
              </div>
              <input
                type="checkbox"
                checked={toggles.enableAiCopilot}
                onChange={(e) => setToggles({ ...toggles, enableAiCopilot: e.target.checked })}
                className="w-5 h-5 accent-foreground mt-1 flex-shrink-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          {saveSuccess && (
            <span className="text-label-md uppercase font-bold text-foreground flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings Saved Successfully
            </span>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Settings..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
