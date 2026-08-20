# Lecture Transcription Testing Module (LearnioX Prototype)

## Overview
This is a completely **isolated prototype** for testing lecture audio/video speech-to-text transcription with **bidirectional video-transcript synchronization**.

## Strict Isolation Rules
- **ZERO Course / Curriculum DB Integration**: Does not connect to Courses, Modules, Lessons, Enrollments, or Progress tables.
- **Isolated Storage**: Uploads and JSON results reside in `storage/test_uploads/` and `storage/test_results/`.
- **Easy Cleanup**: To remove this feature completely, simply delete the `lecture_transcription_test/` directory and remove the router inclusion in `app/api/v1/router.py`.

## API Endpoints
- `POST /api/v1/ai/test/lecture-transcription/upload`: Upload MP4/MP3/WAV/M4A file.
- `GET /api/v1/ai/test/lecture-transcription/status/{job_id}`: Poll transcription status and progress.
- `GET /api/v1/ai/test/lecture-transcription/{job_id}`: Retrieve completed timestamped transcript segments.
- `GET /api/v1/ai/test/lecture-transcription/media/{job_id}`: Stream uploaded media with HTTP 206 Range support.
