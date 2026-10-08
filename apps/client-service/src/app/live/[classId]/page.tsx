'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Radio,
  Users,
  Grid,
  Maximize2,
  Share2,
  Clock,
  Shield,
  Circle,
  Sparkles,
  LayoutGrid,
  PenTool,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom, useSessionParticipants, useSessionChat, useSessionPolls, useSessionQnA, useLiveClassroomMutations } from '@/hooks/useLiveClassroom';
import { useClassroomMedia } from '@/hooks/useClassroomMedia';
import { useClassroomSocket } from '@/hooks/useClassroomSocket';
import { PreJoinLobby } from '@/components/live/pre-join-lobby';
import { WaitingRoomView } from '@/components/live/waiting-room-view';
import { ControlDock } from '@/components/live/control-dock';
import { ReactionOverlay } from '@/components/live/reaction-overlay';
import { VideoGrid } from '@/components/live/video-grid';
import { WhiteboardCanvas } from '@/components/live/whiteboard-canvas';
import { ChatPanel } from '@/components/live/side-panel/chat-panel';
import { QnAPanel } from '@/components/live/side-panel/qna-panel';
import { PollsPanel } from '@/components/live/side-panel/polls-panel';
import { ParticipantsPanel } from '@/components/live/side-panel/participants-panel';
import { JoinTicketData, ClassroomParticipant, ChatMessage, Poll, QnAQuestion } from '@/types/live';

export default function LiveClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(`/live/${classId}`)}`);
    }
  }, [isAuthLoading, isAuthenticated, router, classId]);

  const [joinState, setJoinState] = useState<'lobby' | 'waiting' | 'in-class'>('lobby');
  const [activePanel, setActivePanel] = useState<'chat' | 'qna' | 'polls' | 'people' | 'whiteboard' | null>(null);
  const [layout, setLayout] = useState<'grid' | 'whiteboard'>('grid');
  const [ticketData, setTicketData] = useState<JoinTicketData | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number> | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [incomingStroke, setIncomingStroke] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Classroom Queries & Mutations
  const { data: classroom, isLoading } = useClassroom(classId);
  const mutations = useLiveClassroomMutations();
  const media = useClassroomMedia();

  const sessionId = ticketData?.session_id || classroom?.active_session_id || '';

  const { data: participantsData } = useSessionParticipants(sessionId);
  const { data: chatData } = useSessionChat(sessionId);
  const { data: pollsData } = useSessionPolls(sessionId);
  const { data: qnaData } = useSessionQnA(sessionId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ClassroomParticipant[]>([]);

  useEffect(() => {
    if (chatData) setMessages(chatData);
  }, [chatData]);

  useEffect(() => {
    if (participantsData) setParticipants(participantsData);
  }, [participantsData]);

  // Session elapsed timer
  useEffect(() => {
    if (joinState !== 'in-class') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [joinState]);

  // WebSocket Handlers
  const socket = useClassroomSocket({
    sessionId,
    ticket: ticketData?.ticket,
    onUserJoined: (user) => {
      setParticipants((prev) => {
        if (prev.some((p) => String(p.user_id) === String(user.user_id))) return prev;
        return [
          ...prev,
          {
            id: user.user_id || `${Date.now()}`,
            user_id: user.user_id,
            display_name: user.display_name,
            role: user.role,
            admission_status: user.admission_status,
            joined_at: user.timestamp,
            total_seconds: 0,
            hand_raised: false,
            is_muted: false,
          },
        ];
      });
      toast.info(`${user.display_name} joined the class.`);
    },
    onUserLeft: (user) => {
      setParticipants((prev) => prev.filter((p) => String(p.user_id) !== String(user.user_id)));
    },
    onChatMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activePanel !== 'chat') {
        setUnreadChatCount((c) => c + 1);
      }
    },
    onReactionBatch: (counts) => {
      setReactionCounts(counts);
    },
    onHandRaiseUpdate: ({ userId, displayName, raised }) => {
      setParticipants((prev) =>
        prev.map((p) => (String(p.user_id) === String(userId) ? { ...p, hand_raised: raised } : p))
      );
      if (raised) {
        toast.info(`${displayName} raised their hand.`);
      }
    },
    onAdmissionUpdate: ({ userId, action }) => {
      if (ticketData?.user_id && String(ticketData.user_id) === String(userId)) {
        if (action === 'ADMIT') {
          toast.success('You have been admitted to the classroom!');
          setJoinState('in-class');
        } else {
          toast.error('The host denied entry to this session.');
          setJoinState('lobby');
        }
      }
    },
    onWhiteboardStroke: (stroke) => {
      setIncomingStroke(stroke);
    },
    onSessionEnded: () => {
      setJoinState('lobby');
      toast.warning('The live class has concluded.');
    },
  });

  // Handle Join Action from Lobby
  const handleJoinFromLobby = async () => {
    try {
      const ticket = await mutations.createJoinTicket.mutateAsync({
        classroomId: classId,
        displayName: undefined,
      });
      setTicketData(ticket);

      if (ticket.admission_status === 'ADMITTED') {
        setJoinState('in-class');
      } else {
        setJoinState('waiting');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not join classroom. Please verify enrollment.');
    }
  };

  // Toggle Hand Raise
  const handleToggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socket.toggleHandRaise(nextState);
  };

  // Format Timer String (MM:SS or HH:MM:SS)
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Authentication check
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 1. Loading State
  if (isLoading || !classroom) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Connecting to LearnioX Virtual Classroom...
        </div>
      </div>
    );
  }

  // 2. Pre-Join Green Room Lobby
  if (joinState === 'lobby') {
    return (
      <PreJoinLobby
        classroomTitle={classroom.title}
        courseTitle={classroom.description || 'Live Academy Lecture'}
        isLive={classroom.status === 'LIVE'}
        role={ticketData?.role || 'STUDENT'}
        onJoin={handleJoinFromLobby}
        media={media}
      />
    );
  }

  // 3. Waiting Room Screen
  if (joinState === 'waiting') {
    return (
      <WaitingRoomView
        classroomTitle={classroom.title}
        courseTitle={classroom.description || 'Live Academy Lecture'}
        displayName={ticketData?.display_name || 'Learner'}
        onLeave={() => setJoinState('lobby')}
      />
    );
  }

  // 4. In-Class Virtual Classroom Stage
  const isHost = ticketData?.role === 'HOST' || ticketData?.role === 'INSTRUCTOR';
  const waitingCount = participants.filter((p) => p.admission_status === 'WAITING').length;

  return (
    <div className="relative h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden font-mono select-none">
      {/* Ephemeral Reaction Bursts */}
      <ReactionOverlay incomingCounts={reactionCounts} />

      {/* Top Header Bar */}
      <header className="h-12 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-sm px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] font-bold uppercase rounded-sm">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" /> LIVE
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-[200px] md:max-w-[360px]">
              {classroom.title}
            </span>
            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              | Code: {ticketData?.session_code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Live Duration Timer */}
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-bold">{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Participant Count Badge */}
          <div className="hidden sm:flex items-center gap-1 text-neutral-400">
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
          </div>

          {/* Whiteboard vs Video Grid switcher */}
          <div className="flex items-center border border-neutral-800 bg-neutral-950 p-0.5">
            <button
              onClick={() => {
                setLayout('grid');
                if (activePanel === 'whiteboard') setActivePanel(null);
              }}
              type="button"
              className={`p-1.5 ${layout === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
              title="Video Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setLayout('whiteboard');
              }}
              type="button"
              className={`p-1.5 ${layout === 'whiteboard' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
              title="Collaborative Whiteboard View"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body: Stage + Side Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Center Stage */}
        <main className="flex-1 relative flex flex-col h-full overflow-hidden">
          {layout === 'whiteboard' ? (
            <WhiteboardCanvas
              isPresenter={isHost}
              onSendStroke={socket.sendWhiteboardStroke}
              incomingStroke={incomingStroke}
            />
          ) : (
            <VideoGrid
              participants={participants}
              localStream={media.localStream}
              isCameraOn={media.isCameraOn}
              isMicOn={media.isMicOn}
              currentUserId={ticketData?.user_id}
            />
          )}

          {/* Floating Bottom Control Dock */}
          <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-auto">
            <ControlDock
              isMicOn={media.isMicOn}
              isCameraOn={media.isCameraOn}
              isScreenSharing={media.isScreenSharing}
              isHandRaised={isHandRaised}
              activePanel={activePanel}
              unreadChatCount={unreadChatCount}
              waitingCount={waitingCount}
              role={ticketData?.role || 'STUDENT'}
              onToggleMic={media.toggleMic}
              onToggleCamera={media.toggleCamera}
              onToggleScreenShare={media.toggleScreenShare}
              onToggleHandRaise={handleToggleHandRaise}
              onSendReaction={socket.sendReaction}
              onTogglePanel={(p) => {
                if (p === 'chat') setUnreadChatCount(0);
                setActivePanel(activePanel === p ? null : p);
              }}
              onMuteAll={
                isHost
                  ? () => {
                      toast.success('Muted all student participants.');
                    }
                  : undefined
              }
              onEndSession={
                isHost
                  ? async () => {
                      if (window.confirm('Are you sure you want to end this live class for everyone?')) {
                        await mutations.endSession.mutateAsync(sessionId);
                        router.push(`/institution/${classroom.institution_id}`);
                      }
                    }
                  : undefined
              }
              onLeave={() => {
                setJoinState('lobby');
                router.push(`/courses/${classroom.course_id || ''}`);
              }}
            />
          </div>
        </main>

        {/* Collapsible Right Side Drawer */}
        {activePanel && (
          <aside className="w-80 md:w-96 h-full z-20 shadow-2xl border-l border-neutral-800 flex flex-col bg-neutral-900 animate-in slide-in-from-right-2 duration-150">
            {activePanel === 'chat' && (
              <ChatPanel
                messages={messages}
                role={ticketData?.role || 'STUDENT'}
                onSendMessage={async (content, type) => {
                  await mutations.sendChatMessage.mutateAsync({
                    sessionId,
                    content,
                    messageType: type,
                  });
                }}
              />
            )}
            {activePanel === 'qna' && (
              <QnAPanel
                questions={qnaData || []}
                role={ticketData?.role || 'STUDENT'}
                onAskQuestion={async (q) => {
                  await mutations.askQuestion.mutateAsync({ sessionId, question: q });
                }}
                onUpvoteQuestion={async (qid) => {
                  await mutations.upvoteQuestion.mutateAsync(qid);
                }}
                onAnswerQuestion={async (qid, ans) => {
                  await mutations.answerQuestion.mutateAsync({ questionId: qid, answerText: ans });
                }}
              />
            )}
            {activePanel === 'polls' && (
              <PollsPanel
                polls={pollsData || []}
                role={ticketData?.role || 'STUDENT'}
                onVote={async (pollId, optionIds) => {
                  await mutations.votePoll.mutateAsync({ pollId, optionIds });
                }}
                onCreatePoll={
                  isHost
                    ? async (pdata) => {
                        await mutations.createPoll.mutateAsync({
                          sessionId,
                          question: pdata.question,
                          options: pdata.options,
                          timerSeconds: pdata.timerSeconds,
                        });
                      }
                    : undefined
                }
                onClosePoll={
                  isHost
                    ? async (pid) => {
                        await mutations.closePoll.mutateAsync(pid);
                      }
                    : undefined
                }
              />
            )}
            {activePanel === 'people' && (
              <ParticipantsPanel
                participants={participants}
                role={ticketData?.role || 'STUDENT'}
                onAdmit={
                  isHost
                    ? async (uids) => {
                        await mutations.admitDenyParticipants.mutateAsync({
                          sessionId,
                          userIds: uids,
                          action: 'ADMIT',
                        });
                      }
                    : undefined
                }
                onDeny={
                  isHost
                    ? async (uids) => {
                        await mutations.admitDenyParticipants.mutateAsync({
                          sessionId,
                          userIds: uids,
                          action: 'DENY',
                        });
                      }
                    : undefined
                }
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
