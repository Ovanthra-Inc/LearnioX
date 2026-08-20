'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  FileVideo,
  FileAudio,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface TranscriptionResult {
  job_id: string;
  status: string;
  filename: string;
  duration: number;
  language: string;
  segments: TranscriptSegment[];
  full_text: string;
  created_at: string;
  completed_at?: string;
  error?: string;
}

export default function LectureTranscriptionTest() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptionResult | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProcessing = isUploading || ['queued', 'extracting_audio', 'transcribing', 'processing'].includes(jobStatus);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segmentsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleStartTranscription = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(10);
    setJobStatus('uploading');
    setStageMessage('Uploading media file...');

    const formData = new FormData();
    formData.append('file', file);

    const apiBase = getApiBaseUrl();

    try {
      const uploadRes = await axios.post(
        `${apiBase}/ai/test/lecture-transcription/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const p = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(p);
            }
          },
        }
      );

      const payload = uploadRes.data;
      const newJobId = payload.data?.job_id;
      if (!newJobId) {
        throw new Error('No job ID returned from transcription upload API.');
      }

      setJobId(newJobId);
      setIsUploading(false);
      setJobStatus('processing');
      setStageMessage('Processing audio extraction & speech-to-text...');

      // Start polling for status
      pollJobStatus(newJobId);
    } catch (err: any) {
      setIsUploading(false);
      setJobStatus('failed');
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Upload failed.';
      setErrorMsg(msg);
    }
  };

  const pollJobStatus = async (id: string) => {
    const apiBase = getApiBaseUrl();
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${apiBase}/ai/test/lecture-transcription/status/${id}`);
        const statusData = res.data?.data;

        if (statusData) {
          setJobStatus(statusData.status);
          setJobProgress(statusData.progress || 0);
          setStageMessage(statusData.stage || 'Transcribing...');

          if (statusData.status === 'completed') {
            clearInterval(interval);
            fetchTranscriptResult(id);
          } else if (statusData.status === 'failed') {
            clearInterval(interval);
            setErrorMsg(statusData.error || 'Transcription job failed.');
          }
        }
      } catch (err: any) {
        clearInterval(interval);
        setErrorMsg('Lost connection to transcription polling endpoint.');
      }
    }, 1500);
  };

  const fetchTranscriptResult = async (id: string) => {
    const apiBase = getApiBaseUrl();
    try {
      const res = await axios.get(`${apiBase}/ai/test/lecture-transcription/${id}`);
      const data = res.data?.data;
      if (data) {
        setTranscript(data);
        setJobStatus('completed');
      }
    } catch (err: any) {
      setErrorMsg('Failed to load completed transcript.');
    }
  };

  // Video Time Update Listener for real-time synchronization
  const handleTimeUpdate = () => {
    if (!videoRef.current || !transcript?.segments) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Find corresponding segment
    const index = transcript.segments.findIndex(
      (seg) => time >= seg.start && time <= seg.end
    );

    if (index !== -1 && index !== activeSegmentIndex) {
      setActiveSegmentIndex(index);
    }
  };

  // Auto-scroll active segment into view
  useEffect(() => {
    if (autoScroll && activeSegmentRef.current && segmentsContainerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeSegmentIndex, autoScroll]);

  // Click on timestamp to seek video
  const handleSeekToTimestamp = (timestampSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestampSeconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript.full_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    if (!transcript) return;
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${transcript.filename || 'lecture'}_transcript.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredSegments = transcript?.segments.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const mediaStreamUrl = jobId
    ? `${getApiBaseUrl()}/ai/test/lecture-transcription/media/${jobId}`
    : '';

  const isVideoFormat = Boolean(
    file?.name.match(/\.(mp4|webm|mov|mkv)$/i) ||
    transcript?.filename?.match(/\.(mp4|webm|mov|mkv)$/i)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Isolated Prototype & Testing Lab
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              Lecture Transcription & Video Sync Test
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Test Whisper Speech-to-Text extraction, timestamped segments, and real-time bidirectional video synchronization.
            </p>
          </div>

          {jobStatus === 'completed' && transcript && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyTranscript}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied Full Text!' : 'Copy Text'}
              </button>
              <button
                onClick={handleDownloadTranscript}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-lg shadow-indigo-500/20"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </div>
          )}
        </div>

        {/* Upload & Processing Card Section */}
        {jobStatus !== 'completed' ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all bg-slate-950/40 ${
                isProcessing
                  ? 'border-indigo-500/40 opacity-90 cursor-not-allowed'
                  : 'border-slate-700 hover:border-indigo-500/50 cursor-pointer'
              }`}
              onClick={() => {
                if (!isProcessing) {
                  document.getElementById('file-upload-input')?.click();
                }
              }}
            >
              <input
                id="file-upload-input"
                type="file"
                disabled={isProcessing}
                accept=".mp4,.mp3,.wav,.m4a,.webm,.mov,.mkv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    setErrorMsg(null);
                  }
                }}
              />

              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              {file ? (
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {isProcessing ? stageMessage || 'Processing...' : 'Ready for transcription'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-base font-medium text-slate-200">
                    Click to browse or drag & drop lecture media
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports MP4, MP3, WAV, M4A, WebM (Max 100MB)
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Audio extracted with FFmpeg 16kHz Mono • Whisper Engine
              </div>

              <button
                disabled={!file || isProcessing}
                onClick={handleStartTranscription}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm text-white flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {stageMessage || 'Transcribing...'} ({isUploading ? uploadProgress : jobProgress}%)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Transcription
                  </>
                )}
              </button>
            </div>

            {/* Live Processing Progress Bar & Status Pill */}
            {isProcessing && (
              <div className="space-y-3 border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-slate-300 font-medium">
                      {stageMessage || 'Processing transcription job...'}
                    </span>
                  </div>
                  <span className="text-indigo-400 font-mono font-bold">
                    {isUploading ? uploadProgress : jobProgress}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(5, isUploading ? uploadProgress : jobProgress)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Transcription Error</p>
              <p className="text-xs text-rose-400 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Video Player & Synchronized Transcript Interface */}
        {jobStatus === 'completed' && transcript && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Video / Audio Player (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-2">
                {isVideoFormat !== null ? (
                  <video
                    ref={videoRef}
                    src={mediaStreamUrl}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full rounded-xl bg-black aspect-video object-contain"
                  />
                ) : (
                  <div className="p-12 text-center space-y-4 bg-slate-950/60 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                      <Volume2 className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{transcript.filename}</p>
                      <p className="text-xs text-slate-400">Audio Playback</p>
                    </div>
                    <audio
                      ref={videoRef as any}
                      src={mediaStreamUrl}
                      controls
                      onTimeUpdate={handleTimeUpdate}
                      className="w-full mt-4"
                    />
                  </div>
                )}
              </div>

              {/* Media Metadata Badge Bar */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 text-slate-400">
                  <span>
                    Duration: <strong className="text-slate-200">{formatTimestamp(transcript.duration)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Language: <strong className="text-slate-200 uppercase">{transcript.language}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Segments: <strong className="text-slate-200">{transcript.segments.length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">
                    Time: <strong className="text-indigo-400">{formatTimestamp(currentTime)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Synchronized Transcript List (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col h-[600px] shadow-2xl">
              
              {/* Transcript Search & Controls Bar */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Live Synchronized Transcript
                  </h3>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                    Auto-scroll
                  </label>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transcript keywords..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Scrollable Segment Items */}
              <div
                ref={segmentsContainerRef}
                className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                {filteredSegments.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-10">
                    No transcript segments matching '{searchQuery}'
                  </p>
                ) : (
                  filteredSegments.map((segment, idx) => {
                    const isActive =
                      currentTime >= segment.start && currentTime <= segment.end;

                    return (
                      <div
                        key={idx}
                        ref={isActive ? activeSegmentRef : null}
                        onClick={() => handleSeekToTimestamp(segment.start)}
                        className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <button
                            type="button"
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1.5 transition ${
                              isActive
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800 text-indigo-400 hover:bg-indigo-500/20'
                            }`}
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            [{formatTimestamp(segment.start)} → {formatTimestamp(segment.end)}]
                          </button>
                          {segment.speaker && (
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                              {segment.speaker}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs leading-relaxed ${
                            isActive
                              ? 'text-slate-100 font-medium'
                              : 'text-slate-300'
                          }`}
                        >
                          {segment.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Restart Test Button */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    setFile(null);
                    setJobId(null);
                    setJobStatus('idle');
                    setTranscript(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline transition"
                >
                  Upload another lecture video to test
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
