import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PlayerState {
  currentLessonId: string | null;
  currentCourseId: string | null;
  isPlaying: boolean;
  currentTime: number; // seconds
  duration: number;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  captionsEnabled: boolean;
}

const initialState: PlayerState = {
  currentLessonId: null,
  currentCourseId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackRate: 1,
  isFullscreen: false,
  captionsEnabled: false,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setCurrentLesson(state, action: PayloadAction<{ lessonId: string; courseId: string }>) {
      state.currentLessonId = action.payload.lessonId;
      state.currentCourseId = action.payload.courseId;
      state.currentTime = 0;
      state.isPlaying = false;
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    setCurrentTime(state, action: PayloadAction<number>) {
      state.currentTime = action.payload;
    },
    setDuration(state, action: PayloadAction<number>) {
      state.duration = action.payload;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload;
    },
    setPlaybackRate(state, action: PayloadAction<number>) {
      state.playbackRate = action.payload;
    },
    toggleFullscreen(state) {
      state.isFullscreen = !state.isFullscreen;
    },
    toggleCaptions(state) {
      state.captionsEnabled = !state.captionsEnabled;
    },
    resetPlayer(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setCurrentLesson,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  setPlaybackRate,
  toggleFullscreen,
  toggleCaptions,
  resetPlayer,
} = playerSlice.actions;
export default playerSlice.reducer;
