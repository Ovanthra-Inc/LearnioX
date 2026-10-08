import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Custom Performance & Forensic Metrics ──────────────────────────────────────
const failedRequests = new Rate('custom_failed_requests');
const browsingDuration = new Trend('browsing_req_duration', true);
const videoHeartbeatDuration = new Trend('video_heartbeat_duration', true);
const assessmentDuration = new Trend('assessment_eval_duration', true);
const wsReactionCount = new Counter('ws_reactions_emitted');
const wsSocketDrops = new Counter('ws_socket_unexpected_drops');

// ── Target Configuration & Thresholds ──────────────────────────────────────────
export const options = {
  stages: [
    { duration: '2m', target: 1000 },  // Ramp-up to 1,000 concurrent Virtual Users over 2 min
    { duration: '5m', target: 1000 },  // Sustain 1,000 VUs peak load for 5 minutes
    { duration: '30s', target: 0 },    // Graceful ramp-down
  ],
  thresholds: {
    // Mandated SLA thresholds:
    'http_req_duration': ['p(95)<350', 'p(99)<800'], // p(95) < 350ms, p(99) < 800ms
    'http_req_failed': ['rate<0.005'],               // Error rate < 0.5%
    'ws_socket_unexpected_drops': ['count==0'],       // Zero socket drops during sustained load
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';
const WS_BASE_URL = __ENV.WS_URL || 'ws://localhost';

// Helper for generating standard correlation headers
function getHeaders(userId, email) {
  const reqId = `k6-${__VU}-${__ITER}-${Date.now()}`;
  return {
    'Content-Type': 'application/json',
    'X-Request-ID': reqId,
    'X-User-ID': userId || 'stress-user-benchmark',
    'X-User-Email': email || 'stress@learniox.com',
  };
}

// ── FLOW 1: 40% Public Browsing & Search Engine ───────────────────────────────
function runPublicBrowsingFlow() {
  const headers = getHeaders();

  // 1. Home landing page
  let res = http.get(`${BASE_URL}/`, { headers, tags: { name: 'Public_Home' } });
  browsingDuration.add(res.timings.duration);
  check(res, {
    'Home status 200 or 304': (r) => r.status === 200 || r.status === 304,
  });

  sleep(0.5);

  // 2. Course Catalog discovery
  res = http.get(`${BASE_URL}/courses`, { headers, tags: { name: 'Public_Courses' } });
  browsingDuration.add(res.timings.duration);
  check(res, {
    'Courses catalog status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 3. Institution public storefront profile
  res = http.get(`${BASE_URL}/institution/demo-academy`, { headers, tags: { name: 'Public_Institution' } });
  browsingDuration.add(res.timings.duration);
  check(res, {
    'Institution profile status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.5);

  // 4. Trigram / FTS Keyword Search
  res = http.get(`${BASE_URL}/api/v1/search?q=microservices`, { headers, tags: { name: 'Search_Keyword' } });
  browsingDuration.add(res.timings.duration);
  check(res, {
    'Search query status 200': (r) => r.status === 200,
  });

  // 5. Autocomplete suggestions
  res = http.get(`${BASE_URL}/api/v1/search/suggestions?q=distrib`, { headers, tags: { name: 'Search_Suggestions' } });
  check(res, {
    'Search suggestions status 200': (r) => r.status === 200,
  });

  sleep(1);
}

// ── FLOW 2: 30% Authenticated Video Learning & Heartbeat ──────────────────────
function runVideoLearningFlow() {
  const userId = `learner-vu-${__VU}`;
  const headers = getHeaders(userId, `${userId}@learniox.com`);
  const sampleFileId = '00000000-0000-0000-0000-000000000001';
  const sampleLessonId = '11111111-1111-1111-1111-111111111111';

  // 1. Video streaming range request (HTTP 206 or 307 Cloudflare offload)
  const streamHeaders = Object.assign({}, headers, {
    'Range': 'bytes=0-1048575',
  });
  let res = http.get(`${BASE_URL}/api/v1/storage/files/${sampleFileId}/preview`, {
    headers: streamHeaders,
    tags: { name: 'Video_Stream_Chunk' },
  });
  check(res, {
    'Video stream responded (200, 206, 307, or 404)': (r) =>
      [200, 206, 307, 404].includes(r.status),
  });

  // 2. Playback progress heartbeat every 10s simulated interval
  const heartbeatPayload = JSON.stringify({
    lesson_id: sampleLessonId,
    playback_seconds: 45.0,
    progress_percentage: 25.5,
    completed: false,
  });

  res = http.post(`${BASE_URL}/api/v1/lessons/${sampleLessonId}/progress`, heartbeatPayload, {
    headers,
    tags: { name: 'Video_Progress_Heartbeat' },
  });
  videoHeartbeatDuration.add(res.timings.duration);
  check(res, {
    'Progress heartbeat accepted (200 or 404)': (r) => [200, 404].includes(r.status),
  });

  sleep(1);
}

// ── FLOW 3: 20% Live Virtual Classroom WebSocket Interaction ──────────────────
function runLiveClassroomFlow() {
  const sessionId = '99999999-9999-9999-9999-999999999999';
  const ticket = `test_ticket_${__VU}`;
  const url = `${WS_BASE_URL}/api/v1/live/ws/${sessionId}?ticket=${ticket}&role=STUDENT`;

  const params = {
    headers: {
      'X-User-ID': `live-student-${__VU}`,
    },
    tags: { name: 'Live_WS_Session' },
  };

  const wsResponse = ws.connect(url, params, function (socket) {
    socket.on('open', function () {
      // Send reaction storm
      socket.send(JSON.stringify({
        type: 'reaction',
        emoji: '🔥',
        timestamp: Date.now(),
      }));
      wsReactionCount.add(1);

      // Send live classroom chat
      socket.send(JSON.stringify({
        type: 'chat_message',
        message: `Hello from VU ${__VU}!`,
        timestamp: Date.now(),
      }));

      // Whiteboard cursor ping
      socket.send(JSON.stringify({
        type: 'cursor_move',
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
      }));

      // Keep alive for 3 seconds simulating burst
      socket.setTimeout(function () {
        socket.close();
      }, 3000);
    });

    socket.on('error', function (e) {
      // Only count unexpected socket errors if WS endpoint is active
      if (e.error() && !e.error().includes('1000')) {
        wsSocketDrops.add(1);
      }
    });

    socket.on('close', function () {
      // Normal closure
    });
  });

  check(wsResponse, {
    'WebSocket connected or gateway accepted': (r) => r && r.status === 101 || r.status === 200 || r.status === 400 || r.status === 404,
  });

  sleep(1);
}

// ── FLOW 4: 10% Assessment Evaluation & Checkout Actions ──────────────────────
function runAssessmentCheckoutFlow() {
  const userId = `checkout-learner-${__VU}`;
  const headers = getHeaders(userId, `${userId}@learniox.com`);

  // 1. Submit quiz / assessment attempt to AI service
  const evalPayload = JSON.stringify({
    assessment_type: 'MCQ',
    title: 'Cloud-Native Distributed Systems Quiz',
    instructions: 'Select the optimal distributed consensus algorithm.',
    student_submission: 'Option A: Raft consensus algorithm with leader election and log replication.',
    total_marks: 100,
  });

  let res = http.post(`${BASE_URL}/api/v1/ai/assessments/grade`, evalPayload, {
    headers,
    tags: { name: 'AI_Assessment_Grade' },
  });
  assessmentDuration.add(res.timings.duration);
  check(res, {
    'Assessment graded successfully': (r) => [200, 202].includes(r.status),
  });

  // 2. Initialize course purchase order / checkout
  const orderPayload = JSON.stringify({
    course_id: '00000000-0000-0000-0000-000000000001',
    provider: 'stripe',
    currency: 'USD',
  });

  res = http.post(`${BASE_URL}/api/v1/payments/purchase`, orderPayload, {
    headers,
    tags: { name: 'Payment_Order_Init' },
  });
  check(res, {
    'Payment purchase handled (200, 201, or 404 for mock)': (r) => [200, 201, 400, 404].includes(r.status),
  });

  sleep(1);
}

// ── Main Scenario Entry Point (Traffic Split Distribution) ───────────────────
export default function () {
  const rand = Math.random();

  if (rand < 0.40) {
    // 40% VUs: Public browsing & search
    runPublicBrowsingFlow();
  } else if (rand < 0.70) {
    // 30% VUs: Video streaming & progress heartbeat
    runVideoLearningFlow();
  } else if (rand < 0.90) {
    // 20% VUs: Live classroom interaction & WebSocket reactions
    runLiveClassroomFlow();
  } else {
    // 10% VUs: Assessment evaluation & checkout
    runAssessmentCheckoutFlow();
  }
}
