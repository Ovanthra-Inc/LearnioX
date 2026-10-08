'use client';

import React from 'react';
import { useAssessmentTask } from '@/hooks/useAssessments';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface AssessmentTaskProgressProps {
  taskId: string;
  onComplete?: (result: any) => void;
  className?: string;
}

export function AssessmentTaskProgress({
  taskId,
  onComplete,
  className = '',
}: AssessmentTaskProgressProps) {
  const { task, isQueued, isProcessing, isCompleted, isFailed, progress, result, error } =
    useAssessmentTask(taskId);

  React.useEffect(() => {
    if (isCompleted && result && onComplete) {
      onComplete(result);
    }
  }, [isCompleted, result, onComplete]);

  if (!task) return null;

  return (
    <div
      className={`border border-border/80 bg-card p-4 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : isFailed ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">
            {isQueued && 'Queued for AI Evaluation'}
            {isProcessing && 'AI Evaluation In Progress...'}
            {isCompleted && 'Evaluation Complete'}
            {isFailed && 'Evaluation Failed'}
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isCompleted
              ? 'bg-emerald-500'
              : isFailed
              ? 'bg-destructive'
              : 'bg-primary'
          }`}
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      {/* Detailed Status or Error */}
      <div className="mt-2 text-xs text-muted-foreground">
        {isQueued && (
          <p className="flex items-center gap-1.5 text-muted-foreground/80">
            <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            Queued in assessment worker queue. Evaluating against standard rubric...
          </p>
        )}
        {isProcessing && (
          <p className="flex items-center gap-1.5 text-primary/90">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" />
            Analyzing code syntax, test criteria, and architectural style...
          </p>
        )}
        {isCompleted && (
          <p className="text-emerald-500 font-medium">
            Score: {result?.score ?? 0} / {result?.total_marks ?? 100} ({result?.percentage ?? 0}%)
          </p>
        )}
        {isFailed && (
          <p className="text-destructive font-medium">
            Error: {String(error || 'Failed to process AI task')}
          </p>
        )}
      </div>
    </div>
  );
}
