import { MOCK_NOTES } from "@/lib/mock-data/learner";
import { formatDate } from "@/lib/utils";
import { StickyNote, Plus, Clock } from "lucide-react";

export const metadata = { title: "My Notes — LearnioX" };

export default function NotesPage() {
  const courseGroups = MOCK_NOTES.reduce((acc, note) => {
    if (!acc[note.courseId]) acc[note.courseId] = { courseTitle: note.courseTitle, notes: [] };
    acc[note.courseId].notes.push(note);
    return acc;
  }, {} as Record<string, { courseTitle: string; notes: typeof MOCK_NOTES }>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">My Notes</h1>
          <p className="text-body-sm text-muted-foreground mt-1">{MOCK_NOTES.length} notes across {Object.keys(courseGroups).length} courses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity font-bold">
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      <input
        type="search"
        placeholder="Search notes..."
        className="w-full max-w-md h-10 px-4 border border-border bg-surface hover:border-foreground focus:border-foreground outline-none transition-colors text-body-sm placeholder:text-muted-foreground"
      />

      {Object.entries(courseGroups).map(([courseId, group]) => (
        <div key={courseId}>
          <h2 className="text-headline-sm font-bold mb-4 pb-3 border-b border-border flex items-center gap-2">
            <StickyNote className="w-4 h-4" /> {group.courseTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
            {group.notes.map((note, idx) => (
              <div
                key={note.id}
                className={`p-5 hover:bg-surface-container transition-colors cursor-pointer
                  ${idx % 2 === 0 ? "md:border-r border-border" : ""}
                  ${idx < group.notes.length - 2 ? "border-b border-border" : ""}
                  ${idx === group.notes.length - 1 && group.notes.length % 2 !== 0 ? "md:border-r-0" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label-sm text-muted-foreground uppercase tracking-widest border border-border px-2 py-0.5">
                    {note.lessonTitle}
                  </p>
                  {note.timestamp && (
                    <span className="flex items-center gap-1 text-label-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-foreground whitespace-pre-line line-clamp-4">{note.content}</p>
                <p className="text-label-sm text-muted-foreground mt-3">{formatDate(note.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
