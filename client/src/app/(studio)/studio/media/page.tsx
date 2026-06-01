"use client";

import { useState } from "react";
import { Library, Upload, Play, Trash2, Check } from "lucide-react";

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([
    { id: "m1", name: "cpython_memory_model_deepdive.mp4", duration: "30:00", size: "142 MB", date: "3 days ago" },
    { id: "m2", name: "storybook_layout_tokens.mp4", duration: "45:00", size: "210 MB", date: "1 week ago" },
    { id: "m3", name: "flux_integration_methods.mp4", duration: "40:00", size: "185 MB", date: "2 weeks ago" }
  ]);
  const [isSaved, setIsSaved] = useState(false);

  const handleUpload = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setMedia([
        { id: `med-${Date.now()}`, name: "new_lecture_uploaded_clip.mp4", duration: "25:00", size: "115 MB", date: "Just now" },
        ...media
      ]);
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setMedia(media.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Media Library</h1>
          <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
            Manage your raw video uploads and CDN storage parameters
          </p>
        </div>
        <button
          onClick={handleUpload}
          className="px-5 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" /> Upload Video
        </button>
      </div>

      {isSaved && (
        <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Video file uploaded and transcoded via Cloudflare Stream!
        </div>
      )}

      {/* Grid of videos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {media.map((file) => (
          <div key={file.id} className="border border-border bg-card group flex flex-col justify-between">
            {/* Mock Player poster */}
            <div className="relative aspect-video bg-zinc-950 flex items-center justify-center border-b border-border overflow-hidden">
              <div className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors">
                <Play className="w-4 h-4 text-white fill-current" />
              </div>
              <div className="absolute bottom-3 right-3 bg-black/85 px-1.5 py-0.5 text-[9px] font-mono text-white">
                {file.duration}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div>
                <p className="font-semibold text-foreground text-sm truncate leading-snug">{file.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{file.size} • {file.date}</p>
              </div>
              <div className="pt-2.5 border-t border-border/60 flex justify-between">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Transcoded</span>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-xs text-muted-foreground hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
