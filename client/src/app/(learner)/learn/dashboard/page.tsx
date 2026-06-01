import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { ProgressBar } from "@/components/shared/ui-elements";
import { MOCK_CURRENT_USER } from "@/lib/mock-data/users";
import { MOCK_ENROLLMENTS, MOCK_CERTIFICATES, MOCK_NOTES, MOCK_DOUBTS } from "@/lib/mock-data/learner";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { ArrowRight, Play, Award, BookOpen, Clock } from "lucide-react";

export const metadata = {
  title: "My Dashboard — LearnioX",
};

export default function LearnerDashboardPage() {
  const user = MOCK_CURRENT_USER;
  const enrollments = MOCK_ENROLLMENTS;
  const inProgress = enrollments.filter((e) => e.progress.completionPercentage > 0 && e.progress.completionPercentage < 100);
  const recentNotes = MOCK_NOTES.slice(0, 3);
  const myDoubts = MOCK_DOUBTS.filter((d) => d.userId === user.id);

  return (
    <div className="space-y-8">
      {/* ── Greeting ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
            Continue where you left off
          </p>
        </div>
        <Link
          href="/search"
          className="hidden md:flex items-center gap-2 px-4 py-2 border border-border hover:border-foreground transition-colors text-label-md uppercase tracking-wider"
        >
          <BookOpen className="w-4 h-4" />
          Browse Courses
        </Link>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
        <div className="border-r border-border">
          <StatCard
            label="Enrolled Courses"
            value={user.enrollmentCount}
          />
        </div>
        <div className="border-r border-border">
          <StatCard
            label="Completed"
            value={user.completedCourseCount}
            inverted
          />
        </div>
        <div className="border-r border-border">
          <StatCard
            label="Certificates"
            value={user.certificateCount}
          />
        </div>
        <div>
          <StatCard
            label="Watch Time"
            value={`${user.watchTimeHours}h`}
          />
        </div>
      </div>

      {/* ── Continue Learning ─────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Continue Learning"
          subtitle={`${inProgress.length} courses in progress`}
          action={
            <Link href="/learn/courses" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              All Courses <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
          {inProgress.slice(0, 4).map((enroll) => (
            <Link
              key={enroll.id}
              href={`/learn/watch/${enroll.progress.lastLessonId ?? "first"}`}
              className="p-5 border-b md:border-r md:odd:border-r md:even:border-r-0 border-border hover:bg-surface-container transition-colors group flex gap-4"
            >
              <div className="w-16 h-16 bg-surface-container-high border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-surface-container-highest transition-colors">
                <Play className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-sm text-muted-foreground uppercase tracking-widest mb-1">
                  {enroll.institutionName}
                </p>
                <h3 className="text-body-md font-bold text-foreground line-clamp-1 mb-1">
                  {enroll.courseTitle}
                </h3>
                {enroll.progress.lastLessonTitle && (
                  <p className="text-label-sm text-muted-foreground line-clamp-1 mb-3">
                    Next: {enroll.progress.lastLessonTitle}
                  </p>
                )}
                <ProgressBar
                  value={enroll.progress.completionPercentage}
                  showLabel
                  label="Progress"
                  size="sm"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
        {/* My Notes */}
        <div className="p-6 border-r border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground">Recent Notes</h3>
            <Link href="/learn/notes" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {recentNotes.map((note) => (
              <div key={note.id} className="py-3 border-b last:border-b-0 border-border">
                <p className="text-label-sm uppercase text-muted-foreground tracking-widest mb-1">
                  {note.courseTitle.split(" ").slice(0, 2).join(" ")}
                </p>
                <p className="text-body-sm text-foreground line-clamp-2">{note.content}</p>
                <p className="text-label-sm text-muted-foreground mt-1">{formatRelativeTime(note.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My Doubts */}
        <div className="p-6 border-r border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground">My Doubts</h3>
            <Link href="/learn/doubts" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {myDoubts.slice(0, 3).map((doubt) => (
              <div key={doubt.id} className="py-3 border-b last:border-b-0 border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-body-sm font-semibold text-foreground line-clamp-1 flex-1">{doubt.question}</p>
                  <span className={`text-label-sm ml-2 flex-shrink-0 border px-1.5 py-0.5 ${doubt.status === "answered" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                    {doubt.status === "answered" ? "Answered" : "Pending"}
                  </span>
                </div>
                <p className="text-label-sm text-muted-foreground uppercase">{formatRelativeTime(doubt.createdAt)}</p>
              </div>
            ))}
            {myDoubts.length === 0 && (
              <p className="text-body-sm text-muted-foreground">No doubts yet. Ask your first question!</p>
            )}
          </div>
        </div>

        {/* My Certificates */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground">Certificates</h3>
            <Link href="/learn/certificates" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {MOCK_CERTIFICATES.map((cert) => (
              <div key={cert.id} className="py-3 border-b last:border-b-0 border-border flex items-start gap-3">
                <div className="w-8 h-8 bg-foreground flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-background" />
                </div>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-foreground line-clamp-1">{cert.courseTitle}</p>
                  <p className="text-label-sm text-muted-foreground uppercase">{cert.institutionName}</p>
                  <p className="text-label-sm text-muted-foreground">{new Date(cert.issuedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
