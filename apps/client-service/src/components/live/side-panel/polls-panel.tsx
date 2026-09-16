'use client';

import React, { useState } from 'react';
import { BarChart3, Plus, CheckCircle, Clock, Lock, Sparkles } from 'lucide-react';
import { Poll } from '@/types/live';

interface PollsPanelProps {
  polls: Poll[];
  role: string;
  onVote: (pollId: string, optionIds: string[]) => void;
  onCreatePoll?: (data: {
    question: string;
    options: { option_text: string }[];
    timerSeconds: number;
    pollType: string;
  }) => void;
  onClosePoll?: (pollId: string) => void;
}

export function PollsPanel({
  polls,
  role,
  onVote,
  onCreatePoll,
  onClosePoll,
}: PollsPanelProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const isHost = role === 'HOST' || role === 'INSTRUCTOR' || role === 'CO_HOST';

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const validOpts = options.filter((o) => o.trim().length > 0);
    if (validOpts.length < 2) return;

    onCreatePoll?.({
      question: question.trim(),
      options: validOpts.map((o) => ({ option_text: o.trim() })),
      timerSeconds,
      pollType: 'SINGLE_CHOICE',
    });

    setQuestion('');
    setOptions(['', '']);
    setIsCreating(false);
  };

  const addOptionField = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const updateOptionText = (idx: number, text: string) => {
    const next = [...options];
    next[idx] = text;
    setOptions(next);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          Live Polls
        </span>
        {isHost && onCreatePoll && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            type="button"
            className="flex items-center gap-1 px-2 py-1 bg-neutral-800 border border-neutral-700 hover:text-white text-neutral-300 text-[10px] font-mono uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3 h-3" /> {isCreating ? 'Cancel' : 'Create Poll'}
          </button>
        )}
      </div>

      {/* Poll Creation Form (Host) */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-3 bg-neutral-950 border-b border-neutral-800 space-y-3 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-neutral-400 uppercase text-[10px] tracking-wider">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which concurrency model does Node.js use?"
              className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 uppercase text-[10px] tracking-wider">Options</label>
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => updateOptionText(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="w-full bg-neutral-900 border border-neutral-800 p-1.5 text-white focus:outline-none focus:border-neutral-600"
              />
            ))}
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOptionField}
                className="text-[10px] text-amber-400 hover:underline pt-0.5"
              >
                + Add Another Option
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            Launch Poll to Classroom
          </button>
        </form>
      )}

      {/* Polls Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {polls.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono">
            No live polls running right now.
          </div>
        ) : (
          polls.map((poll) => {
            const isClosed = poll.status === 'CLOSED';
            const userHasVoted = poll.has_voted;

            return (
              <div key={poll.id} className="p-3 bg-neutral-950 border border-neutral-800 space-y-3 font-mono text-xs">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-neutral-100">{poll.question}</h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-bold ${
                      isClosed
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isClosed ? 'Closed' : 'Active'}
                  </span>
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const isSelected = poll.user_voted_option_ids?.includes(opt.id) || selectedOptionId === opt.id;
                    return (
                      <div key={opt.id} className="space-y-1">
                        {!userHasVoted && !isClosed ? (
                          <label className="flex items-center gap-2 p-2 border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 cursor-pointer">
                            <input
                              type="radio"
                              name={`poll-${poll.id}`}
                              checked={selectedOptionId === opt.id}
                              onChange={() => setSelectedOptionId(opt.id)}
                              className="accent-amber-400"
                            />
                            <span className="text-neutral-200">{opt.option_text}</span>
                          </label>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className={isSelected ? 'text-amber-400 font-bold' : 'text-neutral-300'}>
                                {opt.option_text} {isSelected && '✓'}
                              </span>
                              <span className="text-neutral-400 font-bold">
                                {opt.vote_percentage}% ({opt.vote_count})
                              </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-900 border border-neutral-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isSelected ? 'bg-amber-400' : 'bg-neutral-600'
                                }`}
                                style={{ width: `${opt.vote_percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {!userHasVoted && !isClosed && (
                  <button
                    onClick={() => {
                      if (selectedOptionId) {
                        onVote(poll.id, [selectedOptionId]);
                        setSelectedOptionId('');
                      }
                    }}
                    disabled={!selectedOptionId}
                    className="w-full py-1.5 bg-neutral-200 hover:bg-white text-black font-bold uppercase tracking-widest text-[10px] disabled:opacity-40 transition-colors"
                  >
                    Submit Vote
                  </button>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px] text-neutral-500">
                  <span>{poll.total_votes} total votes</span>
                  {isHost && !isClosed && onClosePoll && (
                    <button
                      onClick={() => onClosePoll(poll.id)}
                      className="text-rose-400 hover:underline"
                    >
                      Close Poll
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
