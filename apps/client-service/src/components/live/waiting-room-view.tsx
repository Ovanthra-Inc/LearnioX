'use client';

import React from 'react';
import { Clock, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface WaitingRoomViewProps {
  classroomTitle: string;
  courseTitle?: string;
  displayName: string;
  onLeave: () => void;
}

export function WaitingRoomView({
  classroomTitle,
  courseTitle,
  displayName,
  onLeave,
}: WaitingRoomViewProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-6 space-y-6 text-center shadow-2xl">
        {/* Animated Pulse Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          {courseTitle && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-neutral-800 bg-neutral-950 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {courseTitle}
            </div>
          )}
          <h2 className="text-xl font-bold font-mono uppercase text-white tracking-tight">
            Waiting Room
          </h2>
          <p className="text-xs text-neutral-400 font-mono">
            Welcome, <span className="text-white font-bold">{displayName}</span>. The host has been notified and will admit you into the live classroom shortly.
          </p>
        </div>

        {/* Classroom Notice */}
        <div className="p-3 bg-neutral-950 border border-neutral-800 text-left space-y-1.5 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-1.5 text-neutral-300 font-bold uppercase text-[10px]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Classroom Guidelines
          </div>
          <ul className="list-disc list-inside space-y-1 text-neutral-400">
            <li>Keep your microphone muted until invited to speak.</li>
            <li>Use the Raise Hand button for questions.</li>
            <li>Attendance is automatically tracked upon admission.</li>
          </ul>
        </div>

        <button
          onClick={onLeave}
          type="button"
          className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs uppercase tracking-wider transition-colors"
        >
          Leave Waiting Room
        </button>
      </div>
    </div>
  );
}
