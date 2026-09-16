'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface MediaDeviceItem {
  deviceId: string;
  label: string;
}

export function useClassroomMedia() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceItem[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');

  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'bad'>('good');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 1. Enumerate Media Devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vList = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({ deviceId: d.deviceId, label: d.label || `Camera ${idx + 1}` }));
      const aList = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, idx) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${idx + 1}` }));

      setVideoDevices(vList);
      setAudioDevices(aList);
      if (vList.length > 0 && !selectedVideoId) setSelectedVideoId(vList[0].deviceId);
      if (aList.length > 0 && !selectedAudioId) setSelectedAudioId(aList[0].deviceId);
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  }, [selectedVideoId, selectedAudioId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // 2. Audio Level Analyzer for Mic Testing
  const setupAudioMeter = useCallback((stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (e) {
      console.warn('Audio meter initialization error:', e);
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // 3. Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (isCameraOn) {
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => track.stop());
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
          audio: isMicOn,
        });
        setLocalStream(stream);
        setIsCameraOn(true);
        refreshDevices();
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
      }
    }
  }, [isCameraOn, isMicOn, localStream, selectedVideoId, refreshDevices]);

  // 4. Toggle Microphone
  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => track.stop());
      }
      stopAudioMeter();
      setIsMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
          video: isCameraOn,
        });
        setLocalStream(stream);
        setIsMicOn(true);
        setupAudioMeter(stream);
        refreshDevices();
      } catch (err) {
        console.warn('Mic access denied or unavailable:', err);
      }
    }
  }, [isMicOn, isCameraOn, localStream, selectedAudioId, setupAudioMeter, stopAudioMeter, refreshDevices]);

  // 5. Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
        setScreenStream(stream);
        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  }, [isScreenSharing, screenStream]);

  // 6. Test Speaker Tone
  const playSpeakerTestSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Speaker test failed:', e);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioMeter();
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stopAudioMeter, localStream, screenStream]);

  return {
    isCameraOn,
    isMicOn,
    isScreenSharing,
    localStream,
    screenStream,
    videoDevices,
    audioDevices,
    selectedVideoId,
    selectedAudioId,
    setSelectedVideoId,
    setSelectedAudioId,
    audioLevel,
    connectionQuality,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    playSpeakerTestSound,
    refreshDevices,
  };
}
