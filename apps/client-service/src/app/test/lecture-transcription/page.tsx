import { Metadata } from 'next';
import LectureTranscriptionTest from './LectureTranscriptionTest';

export const metadata: Metadata = {
  title: 'Lecture Transcription Test Lab | LearnioX',
  description: 'Isolated test laboratory for speech-to-text transcription and video-transcript synchronization.',
};

export default function LectureTranscriptionTestPage() {
  return <LectureTranscriptionTest />;
}
