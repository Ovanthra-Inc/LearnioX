'use client';

import React, { useState } from 'react';
import { HelpCircle, ThumbsUp, CheckCircle, MessageSquare, Send } from 'lucide-react';
import { QnAQuestion } from '@/types/live';

interface QnAPanelProps {
  questions: QnAQuestion[];
  role: string;
  onAskQuestion: (question: string) => void;
  onUpvoteQuestion: (questionId: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
}

export function QnAPanel({
  questions,
  role,
  onAskQuestion,
  onUpvoteQuestion,
  onAnswerQuestion,
}: QnAPanelProps) {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const isHost = role === 'HOST' || role === 'INSTRUCTOR' || role === 'CO_HOST';

  const filtered = questions.filter((q) => {
    if (filter === 'unanswered') return !q.is_answered;
    if (filter === 'answered') return q.is_answered;
    return true;
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    onAskQuestion(newQuestionText.trim());
    setNewQuestionText('');
  };

  const handleSendReply = (questionId: string) => {
    if (!replyText.trim()) return;
    onAnswerQuestion(questionId, replyText.trim());
    setReplyText('');
    setReplyingToId(null);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      {/* Header & Filters */}
      <div className="p-3 border-b border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            Classroom Q&A
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            {questions.length} questions
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-800 text-[10px] font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 text-center transition-colors ${
              filter === 'all' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`flex-1 py-1 text-center transition-colors ${
              filter === 'unanswered' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Unanswered ({questions.filter((q) => !q.is_answered).length})
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`flex-1 py-1 text-center transition-colors ${
              filter === 'answered' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Answered ({questions.filter((q) => q.is_answered).length})
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono">
            No questions in this view yet.
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className={`p-3 border text-xs font-mono space-y-2 ${
                q.is_answered
                  ? 'bg-neutral-950/80 border-neutral-800'
                  : 'bg-neutral-950 border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-neutral-200 font-medium leading-snug">{q.question}</p>
                {/* Upvote Button */}
                <button
                  onClick={() => onUpvoteQuestion(q.id)}
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-300 transition-colors"
                  title="Upvote question"
                >
                  <ThumbsUp className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-bold">{q.upvotes}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span>Asked by {q.asker_name}</span>
                {q.is_answered && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle className="w-3 h-3" /> Answered
                  </span>
                )}
              </div>

              {/* Answer Box if answered */}
              {q.is_answered && q.answer_text && (
                <div className="mt-2 p-2 bg-neutral-900 border-l-2 border-emerald-500 text-neutral-300 text-xs">
                  <div className="text-[10px] text-emerald-400 font-bold mb-0.5">
                    {q.answered_by_name || 'Instructor'} Answer:
                  </div>
                  <p className="whitespace-pre-wrap">{q.answer_text}</p>
                </div>
              )}

              {/* Instructor Reply Trigger */}
              {isHost && !q.is_answered && (
                <div className="pt-1">
                  {replyingToId === q.id ? (
                    <div className="space-y-1.5 pt-1">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write instructor answer..."
                        rows={2}
                        className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:outline-none focus:border-neutral-500 font-mono"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-2 py-1 text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(q.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          Submit Answer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingToId(q.id)}
                      type="button"
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-2.5 h-2.5" /> Answer Question
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ask Question Form */}
      <form onSubmit={handleAsk} className="p-3 border-t border-neutral-800 space-y-2">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="Ask a question to the class..."
            className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
          <button
            type="submit"
            disabled={!newQuestionText.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
