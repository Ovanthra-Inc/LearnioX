'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  Smile,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Users,
  PenTool,
  PhoneOff,
  ShieldAlert,
  VolumeX,
} from 'lucide-react';

interface ControlDockProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  activePanel: 'chat' | 'qna' | 'polls' | 'people' | 'whiteboard' | null;
  unreadChatCount: number;
  waitingCount: number;
  role: string;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onSendReaction: (reaction: string) => void;
  onTogglePanel: (panel: 'chat' | 'qna' | 'polls' | 'people' | 'whiteboard') => void;
  onMuteAll?: () => void;
  onEndSession?: () => void;
  onLeave: () => void;
}

const REACTIONS = [
  { id: 'clap', emoji: '👏', label: 'Clap' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'thumbs_up', emoji: '👍', label: 'Thumbs Up' },
  { id: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { id: 'confused', emoji: '🤔', label: 'Confused' },
];

export function ControlDock({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  isHandRaised,
  activePanel,
  unreadChatCount,
  waitingCount,
  role,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHandRaise,
  onSendReaction,
  onTogglePanel,
  onMuteAll,
  onEndSession,
  onLeave,
}: ControlDockProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isHost = role === 'HOST' || role === 'INSTRUCTOR' || role === 'CO_HOST';

  return (
    <div className="relative flex items-center justify-center p-3">
      {/* Floating Reaction Popover */}
      {showReactions && (
        <div className="absolute bottom-16 bg-neutral-900 border border-neutral-700 p-2 shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
          {REACTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSendReaction(r.id);
                setShowReactions(false);
              }}
              className="p-2 hover:bg-neutral-800 text-lg rounded-sm transition-transform active:scale-125"
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Control Strip */}
      <div className="flex items-center gap-1.5 md:gap-2 px-3 py-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-2xl">
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            isMicOn
              ? 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-700'
              : 'bg-rose-950/90 border-rose-800 text-rose-300 hover:bg-rose-900'
          }`}
          title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            isCameraOn
              ? 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-700'
              : 'bg-rose-950/90 border-rose-800 text-rose-300 hover:bg-rose-900'
          }`}
          title={isCameraOn ? 'Turn off Camera' : 'Turn on Camera'}
        >
          {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            isScreenSharing
              ? 'bg-blue-950 border-blue-700 text-blue-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <ScreenShare className="w-4 h-4" />
        </button>

        {/* Hand Raise */}
        <button
          onClick={onToggleHandRaise}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            isHandRaised
              ? 'bg-amber-950 border-amber-600 text-amber-300 ring-1 ring-amber-500'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Reaction Popover Toggle */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            showReactions
              ? 'bg-neutral-700 border-neutral-600 text-white'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title="Reactions"
        >
          <Smile className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {/* Whiteboard Toggle */}
        <button
          onClick={() => onTogglePanel('whiteboard')}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            activePanel === 'whiteboard'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title="Interactive Whiteboard"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Chat Toggle */}
        <button
          onClick={() => onTogglePanel('chat')}
          type="button"
          className={`relative p-2.5 border text-xs font-mono transition-colors ${
            activePanel === 'chat'
              ? 'bg-neutral-700 border-neutral-600 text-white'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title="Classroom Chat"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadChatCount > 0 && activePanel !== 'chat' && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-bold rounded-full">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Q&A Toggle */}
        <button
          onClick={() => onTogglePanel('qna')}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            activePanel === 'qna'
              ? 'bg-neutral-700 border-neutral-600 text-white'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title="Questions & Answers"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Polls Toggle */}
        <button
          onClick={() => onTogglePanel('polls')}
          type="button"
          className={`p-2.5 border text-xs font-mono transition-colors ${
            activePanel === 'polls'
              ? 'bg-neutral-700 border-neutral-600 text-white'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title="Live Polls"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* People / Waiting Room Toggle */}
        <button
          onClick={() => onTogglePanel('people')}
          type="button"
          className={`relative p-2.5 border text-xs font-mono transition-colors ${
            activePanel === 'people'
              ? 'bg-neutral-700 border-neutral-600 text-white'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
          title="Participants"
        >
          <Users className="w-4 h-4" />
          {waitingCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-bold rounded-full">
              {waitingCount}
            </span>
          )}
        </button>

        {/* Host Operations */}
        {isHost && onMuteAll && (
          <button
            onClick={onMuteAll}
            type="button"
            className="p-2.5 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
            title="Mute All Participants"
          >
            <VolumeX className="w-4 h-4 text-amber-400" />
          </button>
        )}

        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {/* End Class (Host) or Leave */}
        {isHost && onEndSession ? (
          <button
            onClick={onEndSession}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase tracking-wider font-bold transition-colors"
            title="End Class for Everyone"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Class</span>
          </button>
        ) : (
          <button
            onClick={onLeave}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-200 font-mono text-xs uppercase tracking-wider font-bold transition-colors"
            title="Leave Class"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </div>
  );
}
