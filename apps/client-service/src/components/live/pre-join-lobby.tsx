'use client';

import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Settings2,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';
import { useClassroomMedia } from '@/hooks/useClassroomMedia';

interface PreJoinLobbyProps {
  classroomTitle: string;
  courseTitle?: string;
  isLive: boolean;
  role: string;
  onJoin: () => void;
  media: ReturnType<typeof useClassroomMedia>;
}

export function PreJoinLobby({
  classroomTitle,
  courseTitle,
  isLive,
  role,
  onJoin,
  media,
}: PreJoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && media.localStream && media.isCameraOn) {
      videoRef.current.srcObject = media.localStream;
    }
  }, [media.localStream, media.isCameraOn]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
      {/* Header Info */}
      <div className="max-w-xl w-full text-center mb-6 space-y-2">
        {courseTitle && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-neutral-800 bg-neutral-900 text-xs font-mono uppercase tracking-widest text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {courseTitle}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-mono">
          {classroomTitle}
        </h1>
        <p className="text-sm text-neutral-400">
          Check your audio, video, and device permissions before entering the classroom.
        </p>
      </div>

      {/* Main Green Room Card */}
      <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Video Preview Stage */}
        <div className="relative aspect-video bg-neutral-950 flex items-center justify-center border-b border-neutral-800">
          {media.isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-neutral-500">
              <div className="w-20 h-20 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-400">
                <User className="w-10 h-10" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider">Camera is Turned Off</span>
            </div>
          )}

          {/* Role Badge */}
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-neutral-900/90 border border-neutral-700 text-[10px] font-mono tracking-widest uppercase text-emerald-400">
            {role === 'HOST' || role === 'INSTRUCTOR' ? 'Host / Instructor' : 'Student Learner'}
          </div>

          {/* Mic Level Meter */}
          {media.isMicOn && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-neutral-900/90 border border-neutral-800 rounded-sm">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${media.audioLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={media.toggleMic}
              type="button"
              className={`p-2.5 transition-colors border ${
                media.isMicOn
                  ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900'
              }`}
              title={media.isMicOn ? 'Mute Microphone' : 'Turn on Microphone'}
            >
              {media.isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={media.toggleCamera}
              type="button"
              className={`p-2.5 transition-colors border ${
                media.isCameraOn
                  ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900'
              }`}
              title={media.isCameraOn ? 'Turn off Camera' : 'Turn on Camera'}
            >
              {media.isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button
              onClick={media.playSpeakerTestSound}
              type="button"
              className="p-2.5 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
              title="Test Speakers (Plays chime)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device Selectors & Join Action */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Camera Select */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase tracking-wider block">Camera</label>
              <select
                value={media.selectedVideoId}
                onChange={(e) => media.setSelectedVideoId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 p-2 text-neutral-200 focus:outline-none focus:border-neutral-600"
              >
                {media.videoDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mic Select */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase tracking-wider block">Microphone</label>
              <select
                value={media.selectedAudioId}
                onChange={(e) => media.setSelectedAudioId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 p-2 text-neutral-200 focus:outline-none focus:border-neutral-600"
              >
                {media.audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-xs text-neutral-500 font-mono">
              Status:{' '}
              <span className={isLive ? 'text-emerald-400' : 'text-amber-400'}>
                {isLive ? '● CLASS IS LIVE' : '○ SCHEDULED'}
              </span>
            </div>

            <button
              onClick={onJoin}
              type="button"
              className="px-6 py-2.5 bg-white text-black font-mono text-xs uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors shadow-lg active:translate-y-0.5"
            >
              {role === 'HOST' || role === 'INSTRUCTOR' ? 'Start Classroom' : 'Join Classroom'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
