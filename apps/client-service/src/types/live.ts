export type ClassroomStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
export type SessionStatus = 'ACTIVE' | 'ENDED';
export type ParticipantRole = 'HOST' | 'INSTRUCTOR' | 'CO_HOST' | 'TA' | 'STUDENT' | 'GUEST';
export type AdmissionStatus = 'WAITING' | 'ADMITTED' | 'DENIED' | 'REMOVED' | 'LEFT';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'PARTIAL' | 'ABSENT';
export type ChatMessageType = 'PUBLIC' | 'ANNOUNCEMENT' | 'DIRECT' | 'SYSTEM';
export type PollType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'YES_NO';
export type PollStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type StageLayout = 'grid' | 'speaker' | 'presentation' | 'whiteboard';

export interface ClassroomSettings {
  waiting_room_enabled: boolean;
  chat_enabled: boolean;
  qna_enabled: boolean;
  polls_enabled: boolean;
  whiteboard_enabled: boolean;
  allow_student_mic: boolean;
  allow_student_camera: boolean;
  allow_student_screen: boolean;
  auto_record: boolean;
  guest_allowed: boolean;
}

export interface LiveClassroom {
  id: string;
  institution_id: string;
  course_id?: string | null;
  lesson_id?: string | null;
  instructor_id: string;
  title: string;
  description?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  status: ClassroomStatus;
  settings: ClassroomSettings;
  active_session_id?: string | null;
  active_session_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingSession {
  id: string;
  classroom_id: string;
  session_code: string;
  status: SessionStatus;
  started_at: string;
  ended_at?: string | null;
  peak_participants: number;
  recording_url?: string | null;
  recording_status: string;
  created_at: string;
}

export interface JoinTicketData {
  ticket: string;
  classroom_id: string;
  session_id: string;
  session_code: string;
  user_id?: string | null;
  display_name: string;
  role: ParticipantRole;
  admission_status: AdmissionStatus;
  media_token: string;
  media_url: string;
  expires_at: string;
}

export interface ClassroomParticipant {
  id: string;
  user_id?: string | null;
  display_name: string;
  avatar_url?: string | null;
  role: ParticipantRole;
  admission_status: AdmissionStatus;
  joined_at: string;
  total_seconds: number;
  hand_raised: boolean;
  is_muted: boolean;
  is_speaking?: boolean;
  audio_level?: number;
  video_enabled?: boolean;
  audio_enabled?: boolean;
  screen_sharing?: boolean;
  connection_quality?: 'good' | 'poor' | 'bad';
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message_type: ChatMessageType;
  recipient_id?: string | null;
  content: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface PollOption {
  id: string;
  option_text: string;
  is_correct?: boolean | null;
  vote_count: number;
  vote_percentage: number;
}

export interface Poll {
  id: string;
  session_id: string;
  creator_id: string;
  question: string;
  poll_type: PollType;
  is_anonymous: boolean;
  status: PollStatus;
  timer_seconds: number;
  total_votes: number;
  has_voted: boolean;
  user_voted_option_ids: string[];
  options: PollOption[];
  created_at: string;
  closed_at?: string | null;
}

export interface QnAQuestion {
  id: string;
  session_id: string;
  asker_id: string;
  asker_name: string;
  question: string;
  upvotes: number;
  has_upvoted: boolean;
  is_answered: boolean;
  answer_text?: string | null;
  answered_by?: string | null;
  answered_by_name?: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface WhiteboardSnapshot {
  page_number: number;
  canvas_data: Record<string, any>;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  first_join_at: string;
  last_leave_at: string;
  total_seconds: number;
  attendance_percentage: number;
  status: AttendanceStatus;
  reconciled_at: string;
}
