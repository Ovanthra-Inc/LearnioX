'use client';

import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Hand, User, Sparkles, Shield, Wifi } from 'lucide-react';
import { ClassroomParticipant } from '@/types/live';

interface VideoGridProps {
  participants: ClassroomParticipant[];
  localUserId?: string | null;
  localStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  currentUserId?: string | null;
}

export function VideoGrid({
  participants,
  localUserId,
  localStream,
  isCameraOn,
  isMicOn,
  currentUserId,
}: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream && isCameraOn) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn]);

  // Determine grid layout columns
  const count = Math.max(1, participants.length);
  let gridCols = 'grid-cols-1';
  if (count === 2) gridCols = 'grid-cols-1 md:grid-cols-2';
  else if (count <= 4) gridCols = 'grid-cols-2';
  else if (count <= 9) gridCols = 'grid-cols-2 lg:grid-cols-3';
  else gridCols = 'grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`w-full h-full p-3 grid ${gridCols} gap-3 auto-rows-fr bg-neutral-950 overflow-y-auto`}>
      {participants.map((p) => {
        const isSelf = p.user_id && currentUserId && String(p.user_id) === String(currentUserId);
        const isSpeaking = p.is_speaking || false;
        const isLeader = p.role === 'HOST' || p.role === 'INSTRUCTOR' || p.role === 'CO_HOST';

        return (
          <div
            key={p.id}
            className={`relative rounded-sm bg-neutral-900 border overflow-hidden flex items-center justify-center transition-all ${
              isSpeaking
                ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500'
                : 'border-neutral-800'
            }`}
          >
            {/* Video or Avatar Placeholder */}
            {isSelf && isCameraOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-500">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold uppercase font-mono ${
                    isLeader
                      ? 'bg-neutral-800 border border-emerald-600/60 text-emerald-400'
                      : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                  }`}
                >
                  {p.display_name.slice(0, 2)}
                </div>
              </div>
            )}

            {/* Top Left: Hand Raised Badge */}
            {p.hand_raised && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-mono font-bold uppercase rounded-sm shadow-md animate-bounce">
                <Hand className="w-3 h-3" /> Hand Raised
              </div>
            )}

            {/* Bottom Overlay: Participant Name & Badges */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 text-xs font-mono text-neutral-200">
                {isLeader && <Shield className="w-3 h-3 text-emerald-400" />}
                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                  {p.display_name} {isSelf && '(You)'}
                </span>
              </div>

              <div className="flex items-center gap-1 p-1 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800">
                {isSelf ? (
                  isMicOn ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  )
                ) : p.is_muted ? (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
