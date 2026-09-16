'use client';

import React, { useState } from 'react';
import { Users, Search, Hand, Mic, MicOff, Check, X, Shield, UserCheck, VolumeX } from 'lucide-react';
import { ClassroomParticipant } from '@/types/live';

interface ParticipantsPanelProps {
  participants: ClassroomParticipant[];
  role: string;
  onAdmit?: (userIds: string[]) => void;
  onDeny?: (userIds: string[]) => void;
  onMuteAll?: () => void;
}

export function ParticipantsPanel({
  participants,
  role,
  onAdmit,
  onDeny,
  onMuteAll,
}: ParticipantsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const isHost = role === 'HOST' || role === 'INSTRUCTOR' || role === 'CO_HOST';

  const waitingParticipants = participants.filter((p) => p.admission_status === 'WAITING');
  const admittedParticipants = participants.filter(
    (p) => p.admission_status === 'ADMITTED' || !p.admission_status
  );

  const filtered = admittedParticipants.filter((p) =>
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      {/* Panel Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          Participants ({admittedParticipants.length})
        </span>

        {isHost && onMuteAll && (
          <button
            onClick={onMuteAll}
            type="button"
            className="flex items-center gap-1 px-2 py-1 bg-neutral-800 border border-neutral-700 hover:text-white text-neutral-300 text-[10px] font-mono uppercase tracking-wider transition-colors"
            title="Mute all students"
          >
            <VolumeX className="w-3 h-3 text-amber-400" /> Mute All
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 text-xs font-mono">
          <Search className="w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter participants..."
            className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Waiting Room Section (Host Only) */}
        {isHost && waitingParticipants.length > 0 && (
          <div className="space-y-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Waiting Room ({waitingParticipants.length})
              </span>
              {onAdmit && (
                <button
                  onClick={() =>
                    onAdmit(
                      waitingParticipants
                        .map((p) => p.user_id)
                        .filter(Boolean) as string[]
                    )
                  }
                  type="button"
                  className="text-[10px] font-mono text-emerald-400 hover:underline uppercase font-bold"
                >
                  Admit All
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {waitingParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 bg-neutral-950 border border-amber-900/40 text-xs font-mono"
                >
                  <span className="text-neutral-200 truncate max-w-[140px]">
                    {p.display_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => p.user_id && onAdmit?.([p.user_id])}
                      type="button"
                      className="p-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-sm"
                      title="Admit student"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => p.user_id && onDeny?.([p.user_id])}
                      type="button"
                      className="p-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-sm"
                      title="Deny entry"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admitted Participants List */}
        <div className="space-y-1">
          {filtered.map((p) => {
            const isPLeader = p.role === 'HOST' || p.role === 'INSTRUCTOR' || p.role === 'CO_HOST';
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 hover:bg-neutral-950/60 rounded-sm transition-colors text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-300 uppercase">
                    {p.display_name.slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neutral-200 flex items-center gap-1 font-medium">
                      {p.display_name}
                      {isPLeader && <Shield className="w-2.5 h-2.5 text-emerald-400" />}
                    </span>
                    <span className="text-[9px] text-neutral-500 uppercase">{p.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {p.hand_raised && (
                    <span className="p-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-sm animate-bounce" title="Hand Raised">
                      <Hand className="w-3 h-3" />
                    </span>
                  )}
                  {p.is_muted ? (
                    <span title="Muted"><MicOff className="w-3.5 h-3.5 text-rose-400" /></span>
                  ) : (
                    <span title="Mic Available"><Mic className="w-3.5 h-3.5 text-neutral-500" /></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
