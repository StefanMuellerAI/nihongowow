/**
 * NihongoWOW API Load Testing Script
 * 
 * This script tests the main API endpoints under load using k6.
 * 
 * Installation:
 *   brew install k6  (macOS)
 *   or visit https://k6.io/docs/getting-started/installation/
 * 
 * Usage:
 *   k6 run backend/tests/load/k6-load-test.js
 * 
 * With custom options:
 *   k6 run --vus 50 --duration 5m backend/tests/load/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const vocabularyTrend = new Trend('vocabulary_duration');
const kanaTrend = new Trend('kana_duration');
const quizTrend = new Trend('quiz_duration');
const tagsTrend = new Trend('tags_duration');

// Test configuration
export const options = {
  // Stages for gradual ramp-up and ramp-down
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 50 },  // Spike to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  
  // Thresholds for pass/fail criteria
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be below 1%
    errors: ['rate<0.1'],              // Custom error rate below 10%
    vocabulary_duration: ['p(95)<300'], // Vocabulary API p95 < 300ms
    kana_duration: ['p(95)<100'],       // Kana API p95 < 100ms (cached)
    tags_duration: ['p(95)<200'],       // Tags API p95 < 200ms
  },
};

// Configuration - update this for your environment
const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

// Helper function to make authenticated requests (if needed)
function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function () {
  // Test Health Check
  group('Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check is healthy': (r) => r.json('status') === 'healthy',
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.5);

  // Test Kana Endpoints (Static Data - Should be Fast)
  group('Kana API', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/kana`);
    kanaTrend.add(Date.now() - start);
    
    check(res, {
      'kana status 200': (r) => r.status === 200,
      'kana has hiragana': (r) => r.json('hiragana') && r.json('hiragana').length > 0,
      'kana has katakana': (r) => r.json('katakana') && r.json('katakana').length > 0,
      'kana has cache header': (r) => r.headers['Cache-Control'] !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.3);

  // Test Tags Endpoint
  group('Vocabulary Tags', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/vocabulary/tags`);
    tagsTrend.add(Date.now() - start);
    
    check(res, {
      'tags status 200': (r) => r.status === 200,
      'tags is array': (r) => Array.isArray(r.json()),
      'tags has cache header': (r) => r.headers['Cache-Control'] !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.3);

  // Test Vocabulary List (Paginated)
  group('Vocabulary List', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/vocabulary?page=1&page_size=20`);
    vocabularyTrend.add(Date.now() - start);
    
    check(res, {
      'vocab list status 200': (r) => r.status === 200,
      'vocab list has items': (r) => r.json('items') !== undefined,
      'vocab list has pagination': (r) => r.json('total') !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.3);

  // Test Random Vocabulary (Used by Games)
  group('Random Vocabulary', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/vocabulary/random?count=15`);
    vocabularyTrend.add(Date.now() - start);
    
    check(res, {
      'random vocab status 200': (r) => r.status === 200,
      'random vocab is array': (r) => Array.isArray(r.json()),
      'random vocab has items': (r) => r.json().length > 0,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.3);

  // Test Quiz Random Question
  group('Quiz API', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/quiz/random`);
    quizTrend.add(Date.now() - start);
    
    check(res, {
      'quiz random status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    
    // Only check structure if we got a question
    if (res.status === 200) {
      check(res, {
        'quiz has vocabulary_id': (r) => r.json('vocabulary_id') !== undefined,
        'quiz has question': (r) => r.json('question') !== undefined,
        'quiz has mode': (r) => r.json('mode') !== undefined,
      });
    }
    errorRate.add(res.status !== 200 && res.status !== 404);
  });

  sleep(0.3);

  // Test Random Kana (Used by Salad Game)
  group('Random Kana', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/kana/random?type=mixed&count=20`);
    kanaTrend.add(Date.now() - start);
    
    check(res, {
      'random kana status 200': (r) => r.status === 200,
      'random kana has items': (r) => r.json('kana') && r.json('kana').length > 0,
      'random kana has count': (r) => r.json('count') !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.5);

  // Test Settings Endpoint
  group('Settings API', function () {
    const res = http.get(`${BASE_URL}/api/settings`);
    
    check(res, {
      'settings status 200': (r) => r.status === 200,
      'settings has object': (r) => r.json('settings') !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  // Random sleep between iterations (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

// Handle test completion summary
export function handleSummary(data) {
  console.log('\n========== Load Test Summary ==========\n');
  
  // Print key metrics
  const metrics = data.metrics;
  
  if (metrics.http_req_duration) {
    console.log(`Request Duration (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`Request Duration (avg): ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  }
  
  if (metrics.http_req_failed) {
    console.log(`Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  }
  
  if (metrics.vocabulary_duration) {
    console.log(`Vocabulary API (p95): ${metrics.vocabulary_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  if (metrics.kana_duration) {
    console.log(`Kana API (p95): ${metrics.kana_duration.values['p(95)'].toFixed(2)}ms`);
  }
  
  console.log('\n========================================\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
