'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Pin, Trash2, Megaphone } from 'lucide-react';
import { ChatMessage } from '@/types/live';

interface ChatPanelProps {
  messages: ChatMessage[];
  role: string;
  onSendMessage: (content: string, type?: 'PUBLIC' | 'ANNOUNCEMENT') => void;
  onDeleteMessage?: (id: string) => void;
}

export function ChatPanel({
  messages,
  role,
  onSendMessage,
  onDeleteMessage,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const isHost = role === 'HOST' || role === 'INSTRUCTOR' || role === 'CO_HOST';
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), isAnnouncement ? 'ANNOUNCEMENT' : 'PUBLIC');
    setInputText('');
    setIsAnnouncement(false);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      {/* Panel Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold">
          Classroom Chat
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => {
          const isAnnounce = m.message_type === 'ANNOUNCEMENT';
          return (
            <div
              key={m.id}
              className={`p-2.5 text-xs font-mono border transition-colors ${
                isAnnounce
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-100'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {isAnnounce && <Megaphone className="w-3 h-3 text-amber-400" />}
                  <span
                    className={`font-bold ${
                      m.sender_role === 'HOST' || m.sender_role === 'INSTRUCTOR'
                        ? 'text-emerald-400'
                        : 'text-neutral-300'
                    }`}
                  >
                    {m.sender_name}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 bg-neutral-800 text-neutral-400 uppercase">
                    {m.sender_role}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                  <span>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isHost && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(m.id)}
                      type="button"
                      className="hover:text-rose-400 p-0.5"
                      title="Delete message"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words leading-relaxed text-neutral-300">
                {m.content}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800 space-y-2">
        {isHost && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAnnouncement(!isAnnouncement)}
              className={`text-[10px] font-mono px-2 py-0.5 border flex items-center gap-1 transition-colors ${
                isAnnouncement
                  ? 'bg-amber-950 border-amber-600 text-amber-300 font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-2.5 h-2.5" />
              {isAnnouncement ? 'Broadcasting Announcement' : 'Make Announcement'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isAnnouncement ? 'Write pinned announcement...' : 'Send message to classroom...'
            }
            className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
