/**
 * EduMyles Basic Load Test — uses k6 (https://k6.io/)
 *
 * Run:  k6 run e2e/load/basic-load.js
 * With env:  k6 run -e BASE_URL=https://app.edumyles.com e2e/load/basic-load.js
 *
 * Stages:
 *   0–1 min  : ramp up to 10 VUs
 *   1–3 min  : steady 10 VUs
 *   3–4 min  : ramp down to 0
 *
 * Thresholds (all must pass):
 *   http_req_duration p(95) < 800 ms  (spec: TTFB < 800 ms)
 *   http_req_failed rate < 1%
 */

import http from "k6/http";
import { sleep, check } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "2m", target: 10 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const ROUTES = [
  "/auth/login",
  "/maintenance",
];

export default function () {
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  const res = http.get(`${BASE_URL}${route}`);

  const ok = check(res, {
    "status is 2xx or 3xx": (r) => r.status < 400,
    "response time < 800ms": (r) => r.timings.duration < 800,
  });

  errorRate.add(!ok);
  sleep(1);
}
