"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Check, Plus, FileText, Trash2, Upload } from "lucide-react";

interface CourseResourcesProps {
  params: Promise<{ id: string }>;
}

export default function CourseResourcesPage({ params }: CourseResourcesProps) {
  const { id } = use(params);
  const course = MOCK_COURSES.find((c) => c.id === id) || MOCK_COURSES[0];

  const [files, setFiles] = useState([
    { id: "r1", name: "optimization_lab_numpy.py", size: "12 KB", date: "3 days ago" },
    { id: "r2", name: "syllabus_cpython_details.pdf", size: "1.2 MB", date: "1 week ago" }
  ]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setFiles([
      ...files,
      { id: `res-${Date.now()}`, name: selectedFile, size: "2.4 MB", date: "Just now" }
    ]);
    setSelectedFile(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  const handleDelete = (resId: string) => {
    setFiles(files.filter((f) => f.id !== resId));
  };

  return (
    <div className="max-w-[800px] mx-auto py-6 font-sans space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/studio/courses"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>

      {/* Resources Manager */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Asset Workspace</span>
          <h1 className="text-headline-sm font-bold text-foreground mt-0.5">{course.title} — Course Resources</h1>
        </div>

        {isSaved && (
          <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Resource file uploaded and registered!
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="border border-border p-5 bg-surface space-y-4 text-center">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground text-left">Upload Resource File</h3>
          <div className="border border-dashed border-border bg-card p-6 flex flex-col items-center gap-2 relative cursor-pointer hover:bg-surface-container transition-colors">
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {selectedFile ? `File: ${selectedFile}` : "Drag and drop or click to upload PDF/txt/py"}
            </p>
          </div>
          <button
            type="submit"
            disabled={!selectedFile}
            className="w-full py-2 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Attach File Resource
          </button>
        </form>

        {/* Resources list */}
        <div className="space-y-4 pt-2">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Attached Resources</h3>
          <div className="divide-y divide-border border border-border bg-card">
            {files.map((file) => (
              <div key={file.id} className="p-4 flex gap-4 items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{file.size} • Uploaded {file.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 border border-transparent hover:border-border hover:bg-surface text-muted-foreground hover:text-rose-600 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
