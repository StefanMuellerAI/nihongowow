/**
 * NihongoWOW API Smoke Test
 * 
 * A quick test to verify the API is working correctly.
 * Run this before deploying or after infrastructure changes.
 * 
 * Usage:
 *   k6 run backend/tests/load/k6-smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  // Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health check': (r) => r.status === 200,
  });

  // Kana endpoint
  res = http.get(`${BASE_URL}/api/kana`);
  check(res, {
    'kana endpoint': (r) => r.status === 200,
  });

  // Tags endpoint
  res = http.get(`${BASE_URL}/api/vocabulary/tags`);
  check(res, {
    'tags endpoint': (r) => r.status === 200,
  });

  // Vocabulary list
  res = http.get(`${BASE_URL}/api/vocabulary?page=1&page_size=10`);
  check(res, {
    'vocabulary list': (r) => r.status === 200,
  });

  // Quiz random
  res = http.get(`${BASE_URL}/api/quiz/random`);
  check(res, {
    'quiz random': (r) => r.status === 200 || r.status === 404,
  });

  // Settings
  res = http.get(`${BASE_URL}/api/settings`);
  check(res, {
    'settings': (r) => r.status === 200,
  });

  sleep(1);
}
