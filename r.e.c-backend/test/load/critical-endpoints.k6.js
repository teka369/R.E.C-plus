import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    school_peak: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 200 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:4001';
const token = __ENV.BEARER_TOKEN || '';

function authHeaders() {
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export default function () {
  const gradesRes = http.get(`${baseUrl}/academic/grades`, {
    headers: authHeaders(),
  });
  check(gradesRes, { 'academic/grades status ok': (r) => r.status === 200 || r.status === 401 || r.status === 403 });

  const performanceRes = http.get(`${baseUrl}/performance/grades/10`, {
    headers: authHeaders(),
  });
  check(performanceRes, { 'performance endpoint reachable': (r) => r.status < 500 });

  sleep(1);
}
