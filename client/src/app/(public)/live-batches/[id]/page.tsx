"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Calendar, Clock, Hourglass, Users, ShieldAlert, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LiveBatchDetailProps {
  params: Promise<{ id: string }>;
}

export default function LiveBatchDetailPage({ params }: LiveBatchDetailProps) {
  const { id } = use(params);

  // Mock cohorts database
  const cohortsData: Record<string, {
    title: string;
    institution: string;
    instructor: string;
    price: number;
    startDate: string;
    duration: string;
    seatsLeft: number;
    description: string;
    syllabus: { date: string; time: string; topic: string; instructor: string; status: string }[];
  }> = {
    "python-arch": {
      title: "Advanced Python & Architecture",
      institution: "TechGlobal Institute",
      instructor: "Alan Turing",
      price: 24999,
      startDate: "Oct 15, 2026",
      duration: "12 Weeks",
      seatsLeft: 4,
      description: "Master advanced Python memory models, metaclasses, concurrency pipelines, and scalable microservices patterns. Built for developers transitioning into systems architects.",
      syllabus: [
        { date: "Oct 15", time: "18:00 - 20:00", topic: "Metaclasses & Custom Types", instructor: "Alan Turing", status: "Upcoming" },
        { date: "Oct 18", time: "18:00 - 20:00", topic: "Asyncio Concurrency Loops", instructor: "Alan Turing", status: "Upcoming" },
        { date: "Oct 22", time: "18:00 - 20:00", topic: "Microservices & gRPC Integration", instructor: "S. Patel", status: "Scheduled" },
      ],
    },
    "design-systems-mastery": {
      title: "UI/UX Design Systems Mastery",
      institution: "Design Institute",
      instructor: "Dieter Rams",
      price: 32500,
      startDate: "Oct 20, 2026",
      duration: "8 Weeks",
      seatsLeft: 12,
      description: "Master grids, typography metrics, color tokens, and advanced component states in Figma. Connect your layout files to React CSS variables for developer handover.",
      syllabus: [
        { date: "Oct 20", time: "10:00 - 13:00", topic: "Design Token Architecture", instructor: "Dieter Rams", status: "Upcoming" },
        { date: "Oct 23", time: "10:00 - 13:00", topic: "Grids, Gutters & Columns Rules", instructor: "Dieter Rams", status: "Upcoming" },
        { date: "Oct 27", time: "10:00 - 13:00", topic: "Component States & Auto Layout", instructor: "Dieter Rams", status: "Scheduled" },
      ],
    },
  };

  const cohort = cohortsData[id] || cohortsData["python-arch"];

  const [calendarAlert, setCalendarAlert] = useState(false);

  const handleAddToCalendar = () => {
    setCalendarAlert(true);
    setTimeout(() => setCalendarAlert(false), 3000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      {/* Navigation back */}
      <div className="mb-6">
        <Link
          href="/live-batches"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Batches
        </Link>
      </div>

      {/* Grid: Left Column Details & Right Column Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (col-span-8) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Header */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-label-sm font-bold uppercase text-muted-foreground">
              <span>{cohort.institution}</span>
              <span>•</span>
              <span>Advanced Cohort</span>
            </div>
            <h1 className="text-headline-lg md:text-headline-xl font-bold text-foreground leading-tight">
              {cohort.title}
            </h1>
            <p className="text-body-lg text-muted-foreground leading-relaxed">
              {cohort.description}
            </p>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-border mt-6 bg-surface">
              <div className="p-4 border-r border-border text-center sm:text-left">
                <span className="block text-[10px] text-muted-foreground uppercase font-bold">START DATE</span>
                <span className="block text-body-sm font-semibold text-foreground mt-1">{cohort.startDate}</span>
              </div>
              <div className="p-4 border-r border-border text-center sm:text-left">
                <span className="block text-[10px] text-muted-foreground uppercase font-bold">DURATION</span>
                <span className="block text-body-sm font-semibold text-foreground mt-1">{cohort.duration}</span>
              </div>
              <div className="p-4 border-r border-border text-center sm:text-left">
                <span className="block text-[10px] text-muted-foreground uppercase font-bold">LANGUAGE</span>
                <span className="block text-body-sm font-semibold text-foreground mt-1">English</span>
              </div>
              <div className="p-4 text-center sm:text-left">
                <span className="block text-[10px] text-muted-foreground uppercase font-bold">AVAILABILITY</span>
                <span className="block text-body-sm font-semibold text-foreground mt-1">
                  {cohort.seatsLeft} Seats Left
                </span>
              </div>
            </div>
          </section>

          {/* Curriculum checklist */}
          <section className="border-t border-border pt-8 space-y-4">
            <h2 className="text-headline-sm font-bold text-foreground">What you will learn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Master theoretical frameworks & practical applications from scratch.",
                "Build production-grade projects using best-practice frameworks.",
                "Configure pipeline layouts, codebases, and deployment patterns.",
                "Collaborate with classmates in interactive support forums.",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-body-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Batch Schedule Table */}
          <section className="border-t border-border pt-8 space-y-4">
            <h2 className="text-headline-sm font-bold text-foreground">Batch Schedule</h2>
            <div className="overflow-x-auto border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-border">
                    <th className="p-3 text-label-xs uppercase font-bold">Date</th>
                    <th className="p-3 text-label-xs uppercase font-bold">Time (IST)</th>
                    <th className="p-3 text-label-xs uppercase font-bold">Topic</th>
                    <th className="p-3 text-label-xs uppercase font-bold">Instructor</th>
                    <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cohort.syllabus.map((s, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3 font-semibold">{s.date}</td>
                      <td className="p-3 text-muted-foreground">{s.time}</td>
                      <td className="p-3 font-medium text-foreground">{s.topic}</td>
                      <td className="p-3 text-muted-foreground">{s.instructor}</td>
                      <td className="p-3">
                        <span className="inline-block border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Sticky Sidebar (col-span-4) */}
        <aside className="lg:col-span-4 border-2 border-foreground p-6 space-y-6 bg-background">
          <div className="border-b border-border pb-4">
            <p className="text-headline-lg font-extrabold text-foreground">{formatCurrency(cohort.price)}</p>
            <p className="text-label-sm text-muted-foreground uppercase mt-1">One-time payment • Lifetime access</p>
          </div>

          <div className="space-y-3 text-body-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Next Class:</span>
              <span className="font-semibold text-foreground">Oct 15, 18:00 IST</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Class Format:</span>
              <span className="font-semibold text-foreground">Live Interactive Zoom</span>
            </div>
          </div>

          {calendarAlert && (
            <div className="border border-border p-3 bg-surface-container text-label-xs uppercase font-semibold text-center">
              Calendar invite (.ics) download initialized!
            </div>
          )}

          <div className="space-y-3">
            <Link
              href={`/checkout/${id}`}
              className="w-full bg-foreground text-background text-label-md uppercase tracking-wider font-bold py-3 block text-center hover:opacity-85 transition-opacity"
            >
              Enroll in Batch
            </Link>
            <button
              onClick={handleAddToCalendar}
              className="w-full border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold py-3 transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" /> Add to Calendar
            </button>
          </div>

          <p className="text-label-xs text-muted-foreground text-center leading-normal">
            Secure checkout powered by Stripe. 14-day money-back guarantee.
          </p>
        </aside>
      </div>
    </div>
  );
}
