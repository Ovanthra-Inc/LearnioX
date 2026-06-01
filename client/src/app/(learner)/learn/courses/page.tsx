import Link from "next/link";
import { ProgressBar } from "@/components/shared/ui-elements";
import { MOCK_ENROLLMENTS } from "@/lib/mock-data/learner";
import { formatRelativeTime } from "@/lib/utils";
import { Play, BookOpen } from "lucide-react";

export const metadata = {
  title: "My Courses — LearnioX",
};

export default function MyCoursesPage() {
  const enrollments = MOCK_ENROLLMENTS;
  const inProgress = enrollments.filter((e) => e.progress.completionPercentage > 0 && e.progress.completionPercentage < 100);
  const notStarted = enrollments.filter((e) => e.progress.completionPercentage === 0);
  const completed = enrollments.filter((e) => e.progress.completionPercentage === 100);

  const CourseRow = ({ enroll }: { enroll: typeof MOCK_ENROLLMENTS[0] }) => (
    <div className="flex gap-4 p-5 border-b border-border hover:bg-surface-container transition-colors group items-center">
      <div className="w-14 h-14 bg-surface-container border border-border flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-sm text-muted-foreground uppercase tracking-widest mb-0.5">
          {enroll.institutionName}
        </p>
        <h3 className="text-body-md font-bold text-foreground line-clamp-1 mb-2">{enroll.courseTitle}</h3>
        <ProgressBar value={enroll.progress.completionPercentage} showLabel size="sm" />
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0 pl-4">
        <p className="text-label-sm text-muted-foreground uppercase">
          {enroll.lastAccessedAt ? `Last: ${formatRelativeTime(enroll.lastAccessedAt)}` : "Not started"}
        </p>
        <Link
          href={`/learn/watch/${enroll.progress.lastLessonId ?? "first"}`}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          <Play className="w-3 h-3" />
          {enroll.progress.completionPercentage === 0 ? "Start" : "Continue"}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-bold text-foreground">My Courses</h1>
        <Link href="/search" className="flex items-center gap-2 px-4 py-2 border border-border hover:border-foreground transition-colors text-label-md uppercase tracking-wider">
          Browse More
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0 border border-border text-center">
        {[
          { label: "In Progress", value: inProgress.length, color: "text-foreground" },
          { label: "Not Started", value: notStarted.length, color: "text-muted-foreground" },
          { label: "Completed", value: completed.length, color: "text-foreground" },
        ].map((stat, idx) => (
          <div key={stat.label} className={`py-5 ${idx < 2 ? "border-r border-border" : ""}`}>
            <p className={`text-headline-md font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-label-sm text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-headline-sm font-bold mb-4 pb-3 border-b border-border">In Progress</h2>
          <div className="border border-border">
            {inProgress.map((e) => <CourseRow key={e.id} enroll={e} />)}
          </div>
        </div>
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <div>
          <h2 className="text-headline-sm font-bold mb-4 pb-3 border-b border-border text-muted-foreground">Not Started</h2>
          <div className="border border-border">
            {notStarted.map((e) => <CourseRow key={e.id} enroll={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}
