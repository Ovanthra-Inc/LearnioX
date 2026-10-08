'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';

export interface RubricCriterion {
  criterion_name: string;
  max_points: number;
  awarded_points: number;
  criterion_feedback: string;
}

export interface AIGradeResult {
  assessment_type: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  summary_feedback: string;
  rubric_breakdown?: RubricCriterion[];
  strengths?: string[];
  areas_for_improvement?: string[];
  suggested_correction?: string;
}

export interface AssessmentTask {
  task_id: string;
  task_type: 'EVALUATION' | 'GENERATION';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  result?: AIGradeResult | any;
  error?: string | null;
  created_at?: string;
  completed_at?: string | null;
}

/**
 * Hook to poll the async AI assessment task queue with a 2-second interval.
 * Automatically halts polling as soon as status reaches 'COMPLETED' or 'FAILED'.
 */
export function useAssessmentTask(taskId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['assessmentTask', taskId],
    queryFn: async (): Promise<AssessmentTask | null> => {
      if (!taskId) return null;
      const res = await apiClient.get<any, ApiResponse<AssessmentTask>>(
        `/assessments/tasks/${taskId}`
      );
      return res.data;
    },
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        return false; // Stop polling
      }
      return 2000; // Poll every 2 seconds while QUEUED or PROCESSING
    },
    refetchIntervalInBackground: true,
  });

  return {
    task: query.data,
    isLoading: query.isLoading,
    isQueued: query.data?.status === 'QUEUED',
    isProcessing: query.data?.status === 'PROCESSING',
    isCompleted: query.data?.status === 'COMPLETED',
    isFailed: query.data?.status === 'FAILED',
    progress: query.data?.progress ?? 0,
    result: query.data?.result,
    error: query.data?.error || query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to submit an assignment submission for async AI evaluation.
 * Returns an HTTP 202 response containing task_id to begin polling.
 */
export function useEvaluateSubmissionWithAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId }: { submissionId: string }): Promise<AssessmentTask> => {
      const res = await apiClient.post<any, ApiResponse<AssessmentTask>>(
        `/submissions/${submissionId}/evaluate-ai`
      );
      return res.data;
    },
    onSuccess: (task) => {
      if (task?.task_id) {
        queryClient.setQueryData(['assessmentTask', task.task_id], task);
      }
    },
  });
}

/**
 * Hook to generate an assignment or quiz using the AI engine across 14 types asynchronously.
 * Returns an HTTP 202 response containing task_id to begin polling.
 */
export function useGenerateAssignmentWithAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      topic,
      difficulty,
      assessmentType = 'CODING_QUESTION',
      totalMarks = 100,
      dueDate,
      allowLateSubmission = true,
    }: {
      lessonId: string;
      topic: string;
      difficulty: string;
      assessmentType?: string;
      totalMarks?: number;
      dueDate?: string;
      allowLateSubmission?: boolean;
    }): Promise<AssessmentTask> => {
      const res = await apiClient.post<any, ApiResponse<AssessmentTask>>(
        `/lessons/${lessonId}/assignments/generate-ai`,
        {
          topic,
          difficulty,
          assessment_type: assessmentType,
          total_marks: totalMarks,
          due_date: dueDate,
          allow_late_submission: allowLateSubmission,
        }
      );
      return res.data;
    },
    onSuccess: (task) => {
      if (task?.task_id) {
        queryClient.setQueryData(['assessmentTask', task.task_id], task);
      }
    },
  });
}
