import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  LiveClassroom,
  MeetingSession,
  ClassroomParticipant,
  ChatMessage,
  Poll,
  QnAQuestion,
  AttendanceRecord,
  JoinTicketData,
  WhiteboardSnapshot,
} from '@/types/live';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export function useClassroom(classroomId: string) {
  return useQuery({
    queryKey: ['live-classroom', classroomId],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/live/classrooms/${classroomId}`
      )) as unknown as ApiResponse<LiveClassroom>;
      return res.data;
    },
    enabled: Boolean(classroomId),
    staleTime: 30000,
  });
}

export function useClassrooms(filters?: {
  institution_id?: string;
  course_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['live-classrooms', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.institution_id) params.append('institution_id', filters.institution_id);
      if (filters?.course_id) params.append('course_id', filters.course_id);
      if (filters?.status) params.append('status', filters.status);

      const res = (await apiClient.get(
        `/live/classrooms?${params.toString()}`
      )) as unknown as ApiResponse<{ total: number; items: LiveClassroom[] }>;
      return res.data;
    },
    staleTime: 15000,
  });
}

export function useSessionParticipants(sessionId: string) {
  return useQuery({
    queryKey: ['live-participants', sessionId],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/live/sessions/${sessionId}/participants`
      )) as unknown as ApiResponse<{ total: number; items: ClassroomParticipant[] }>;
      return res.data.items;
    },
    enabled: Boolean(sessionId),
    refetchInterval: 10000,
  });
}

export function useSessionChat(sessionId: string) {
  return useQuery({
    queryKey: ['live-chat', sessionId],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/live/sessions/${sessionId}/chat?limit=100`
      )) as unknown as ApiResponse<{ items: ChatMessage[] }>;
      return res.data.items;
    },
    enabled: Boolean(sessionId),
  });
}

export function useSessionPolls(sessionId: string) {
  return useQuery({
    queryKey: ['live-polls', sessionId],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/live/sessions/${sessionId}/polls`
      )) as unknown as ApiResponse<{ items: Poll[] }>;
      return res.data.items;
    },
    enabled: Boolean(sessionId),
    refetchInterval: 5000,
  });
}

export function useSessionQnA(sessionId: string) {
  return useQuery({
    queryKey: ['live-qna', sessionId],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/live/sessions/${sessionId}/qna`
      )) as unknown as ApiResponse<{ items: QnAQuestion[] }>;
      return res.data.items;
    },
    enabled: Boolean(sessionId),
  });
}

export function useSessionAttendance(sessionId: string) {
  return useQuery({
    queryKey: ['live-attendance', sessionId],
    queryFn: async () => {
      const res = (await apiClient.get(
        `/live/sessions/${sessionId}/attendance`
      )) as unknown as ApiResponse<{ total: number; items: AttendanceRecord[] }>;
      return res.data.items;
    },
    enabled: Boolean(sessionId),
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useLiveClassroomMutations() {
  const queryClient = useQueryClient();

  const createClassroom = useMutation({
    mutationFn: async (payload: {
      institution_id: string;
      course_id?: string;
      lesson_id?: string;
      title: string;
      description?: string;
      scheduled_start?: string;
      scheduled_end?: string;
      settings?: Record<string, any>;
    }) => {
      const res = (await apiClient.post(
        '/live/classrooms',
        payload
      )) as unknown as ApiResponse<LiveClassroom>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-classrooms'] });
    },
  });

  const startSession = useMutation({
    mutationFn: async (classroomId: string) => {
      const res = (await apiClient.post(
        `/live/classrooms/${classroomId}/start`
      )) as unknown as ApiResponse<MeetingSession>;
      return res.data;
    },
    onSuccess: (_, classroomId) => {
      queryClient.invalidateQueries({ queryKey: ['live-classroom', classroomId] });
      queryClient.invalidateQueries({ queryKey: ['live-classrooms'] });
    },
  });

  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = (await apiClient.post(
        `/live/sessions/${sessionId}/end`
      )) as unknown as ApiResponse<MeetingSession>;
      return res.data;
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['live-classroom'] });
      queryClient.invalidateQueries({ queryKey: ['live-attendance', sessionId] });
    },
  });

  const createJoinTicket = useMutation({
    mutationFn: async ({
      classroomId,
      displayName,
      avatarUrl,
    }: {
      classroomId: string;
      displayName?: string;
      avatarUrl?: string;
    }) => {
      const res = (await apiClient.post(
        `/live/classrooms/${classroomId}/join-ticket`,
        { display_name: displayName, avatar_url: avatarUrl }
      )) as unknown as ApiResponse<JoinTicketData>;
      return res.data;
    },
  });

  const admitDenyParticipants = useMutation({
    mutationFn: async ({
      sessionId,
      userIds,
      action,
    }: {
      sessionId: string;
      userIds: string[];
      action: 'ADMIT' | 'DENY';
    }) => {
      const res = (await apiClient.post(
        `/live/sessions/${sessionId}/admit`,
        { user_ids: userIds, action }
      )) as unknown as ApiResponse<{ count: number }>;
      return res.data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['live-participants', sessionId] });
    },
  });

  const sendChatMessage = useMutation({
    mutationFn: async ({
      sessionId,
      content,
      messageType = 'PUBLIC',
      recipientId,
    }: {
      sessionId: string;
      content: string;
      messageType?: string;
      recipientId?: string;
    }) => {
      const res = (await apiClient.post(
        `/live/sessions/${sessionId}/chat`,
        { content, message_type: messageType, recipient_id: recipientId }
      )) as unknown as ApiResponse<ChatMessage>;
      return res.data;
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.setQueryData(
        ['live-chat', sessionId],
        (old: ChatMessage[] | undefined) => (old ? [...old, data] : [data])
      );
    },
  });

  const createPoll = useMutation({
    mutationFn: async ({
      sessionId,
      question,
      pollType = 'SINGLE_CHOICE',
      isAnonymous = false,
      timerSeconds = 60,
      options,
    }: {
      sessionId: string;
      question: string;
      pollType?: string;
      isAnonymous?: boolean;
      timerSeconds?: number;
      options: { option_text: string; is_correct?: boolean }[];
    }) => {
      const res = (await apiClient.post(
        `/live/sessions/${sessionId}/polls`,
        {
          question,
          poll_type: pollType,
          is_anonymous: isAnonymous,
          timer_seconds: timerSeconds,
          options,
        }
      )) as unknown as ApiResponse<{ poll_id: string }>;
      return res.data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['live-polls', sessionId] });
    },
  });

  const votePoll = useMutation({
    mutationFn: async ({
      pollId,
      optionIds,
    }: {
      pollId: string;
      optionIds: string[];
    }) => {
      const res = (await apiClient.post(
        `/live/polls/${pollId}/vote`,
        { option_ids: optionIds }
      )) as unknown as ApiResponse<{ success: boolean }>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-polls'] });
    },
  });

  const closePoll = useMutation({
    mutationFn: async (pollId: string) => {
      const res = (await apiClient.post(
        `/live/polls/${pollId}/close`
      )) as unknown as ApiResponse<{ poll_id: string }>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-polls'] });
    },
  });

  const askQuestion = useMutation({
    mutationFn: async ({
      sessionId,
      question,
    }: {
      sessionId: string;
      question: string;
    }) => {
      const res = (await apiClient.post(
        `/live/sessions/${sessionId}/qna`,
        { question }
      )) as unknown as ApiResponse<QnAQuestion>;
      return res.data;
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.setQueryData(
        ['live-qna', sessionId],
        (old: QnAQuestion[] | undefined) => (old ? [data, ...old] : [data])
      );
    },
  });

  const upvoteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const res = (await apiClient.post(
        `/live/qna/${questionId}/upvote`
      )) as unknown as ApiResponse<QnAQuestion>;
      return res.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['live-qna'] });
      }
    },
  });

  const answerQuestion = useMutation({
    mutationFn: async ({
      questionId,
      answerText,
    }: {
      questionId: string;
      answerText: string;
    }) => {
      const res = (await apiClient.post(
        `/live/qna/${questionId}/answer`,
        { answer_text: answerText }
      )) as unknown as ApiResponse<QnAQuestion>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-qna'] });
    },
  });

  const saveWhiteboard = useMutation({
    mutationFn: async ({
      sessionId,
      pageNumber,
      canvasData,
    }: {
      sessionId: string;
      pageNumber: number;
      canvasData: Record<string, any>;
    }) => {
      const res = (await apiClient.put(
        `/live/sessions/${sessionId}/whiteboard/${pageNumber}`,
        canvasData
      )) as unknown as ApiResponse<{ page_number: number }>;
      return res.data;
    },
  });

  return {
    createClassroom,
    startSession,
    endSession,
    createJoinTicket,
    admitDenyParticipants,
    sendChatMessage,
    createPoll,
    votePoll,
    closePoll,
    askQuestion,
    upvoteQuestion,
    answerQuestion,
    saveWhiteboard,
  };
}
