"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Square, ChevronRight, PlayCircle, ShieldCheck, Award } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  status: "completed" | "pending";
  actionText: string;
  actionUrl: string;
}

function getOnboardingDetails(type: string | undefined) {
  switch (type) {
    case "college_university":
      return {
        profileDesc: "Define degree pathways, credit hours requirements, and register academic support emails.",
        courseDesc: "Upload your initial syllabus modules, lecture notes, video recordings, and allocate credits.",
        verificationDesc: "Submit official university registration, state board license, or course accreditation papers."
      };
    case "corporate_training":
      return {
        profileDesc: "Specify corporate divisions, compliance frameworks, and configure corporate contact addresses.",
        courseDesc: "Build your mandatory training paths, compliance modules, skill surveys, and corporate guides.",
        verificationDesc: "Submit business registry certificate, data safety compliance audits, or HR security guidelines."
      };
    case "k12_school":
      return {
        profileDesc: "Define grade levels (K-12), parent notification rules, and primary school support contacts.",
        courseDesc: "Publish grade curriculum guides, interactive homework sets, educational quizzes, and gamified reward lists.",
        verificationDesc: "Submit school accreditation proof, child safety policy documents, and data privacy agreements."
      };
    case "workshop_seminar":
      return {
        profileDesc: "Create event landing page metadata, speaker biographies, and primary ticketing contact desks.",
        courseDesc: "Assemble your seminar event streams, live breakout configurations, handouts, and audience feedback logs.",
        verificationDesc: "Submit tax verification documentation, payment processor details, and event coordinator credentials."
      };
    case "organization":
      return {
        profileDesc: "Define NGO/government scope, regional target demographics, and community help contact mailboxes.",
        courseDesc: "Publish outreach program paths, vocational summaries, localized multi-lingual lessons, and certifications.",
        verificationDesc: "Submit non-profit registration (e.g. 501c3/80G), government grant approvals, or funding verification sheets."
      };
    case "edtech_startup":
    case "general":
    default:
      return {
        profileDesc: "Define institution description, support contacts, and custom subdomain slug.",
        courseDesc: "Build a lesson structure, record lectures, upload media assets, and set a pricing plan.",
        verificationDesc: "Verify your academy registry, business license, or accreditation papers."
      };
  }
}

export default function StudioOnboardingPage() {
  const institution = useAppSelector((s) => s.institution.selectedInstitution);
  const instType = institution?.institutionType || "general";
  const details = getOnboardingDetails(instType);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Complete Academy Profile",
      description: details.profileDesc,
      status: "completed",
      actionText: "Edit Profile Info",
      actionUrl: "/studio/settings",
    },
    {
      id: 2,
      title: "Publish Your First Course",
      description: details.courseDesc,
      status: "completed",
      actionText: "Manage Courses",
      actionUrl: "/studio/courses",
    },
    {
      id: 3,
      title: "Configure Payout Gateway",
      description: "Connect a bank account or Razorpay/Stripe details to automatically receive earnings.",
      status: "pending",
      actionText: "Setup Payments Gateway",
      actionUrl: "/studio/payments",
    },
    {
      id: 4,
      title: "Submit Verification Documents",
      description: details.verificationDesc,
      status: "pending",
      actionText: "Upload Documentation",
      actionUrl: "/studio/verification",
    },
  ];

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-[700px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Academy Setup Onboarding</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Complete the required steps below to publish your academy on the marketplace.
        </p>
      </div>

      {/* Progress Bar Panel */}
      <div className="border border-border p-6 space-y-3">
        <div className="flex justify-between items-center text-label-sm font-bold uppercase text-foreground">
          <span>Profile configuration progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full bg-surface-container border border-border h-4 rounded-none overflow-hidden p-0.5">
          <div
            className="bg-foreground h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-body-sm text-muted-foreground">
          You have completed <strong>{completedCount}</strong> of <strong>{steps.length}</strong> setup tasks.
        </p>
      </div>

      {/* Stepper Checklist */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all
              ${
                step.status === "completed"
                  ? "border-border bg-surface-container/50 opacity-80"
                  : "border-foreground bg-surface shadow-xs"
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                {step.status === "completed" ? (
                  <CheckSquare className="w-6 h-6 text-foreground" />
                ) : (
                  <Square className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-label-md font-bold uppercase text-foreground flex items-center gap-2">
                  <span>Step {step.id}: {step.title}</span>
                  {step.status === "completed" && (
                    <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 bg-foreground text-background">
                      done
                    </span>
                  )}
                </h3>
                <p className="text-body-sm text-muted-foreground mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 md:text-right">
              <Link
                href={step.actionUrl}
                className={`inline-flex items-center gap-1 text-label-md uppercase tracking-wider font-bold hover:underline
                  ${step.status === "completed" ? "text-muted-foreground" : "text-foreground"}`}
              >
                {step.actionText}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Launch Box */}
      {progressPercent === 100 ? (
        <div className="border border-foreground p-6 bg-surface-container text-center space-y-4">
          <Award className="w-12 h-12 text-foreground mx-auto" />
          <h3 className="text-headline-sm font-bold text-foreground">Academy Ready for Launch!</h3>
          <p className="text-body-sm text-muted-foreground">
            All configuration criteria have been met. Your academy is live on LearnioX.
          </p>
          <Link
            href="/studio/dashboard"
            className="inline-block px-6 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-widest hover:opacity-85 transition-opacity"
          >
            Enter Dashboard
          </Link>
        </div>
      ) : (
        <div className="border border-border p-5 text-center text-body-sm text-muted-foreground">
          Finish the remaining setup checklist tasks to submit your academy for review and verification.
        </div>
      )}
    </div>
  );
}
