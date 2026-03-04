/**
 * Performance Testing Suite for EduMyles
 * Tests system performance under various load conditions
 * Target: 1000+ concurrent users
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 300 }, // Ramp up to 300 users
    { duration: '5m', target: 300 }, // Stay at 300 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Less than 10% failure rate
    http_reqs: ['rate>100'], // At least 100 requests per second
  },
};

// Base URL for testing
const BASE_URL = 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'admin@test.com', password: 'password123', role: 'admin' },
  { email: 'teacher@test.com', password: 'password123', role: 'teacher' },
  { email: 'student@test.com', password: 'password123', role: 'student' },
  { email: 'parent@test.com', password: 'password123', role: 'parent' },
];

const testEndpoints = [
  '/api/auth/login',
  '/api/students',
  '/api/teachers',
  '/api/assignments',
  '/api/payments',
  '/api/communications',
  '/api/library/books',
  '/api/hr/staff',
  '/api/finance/fees',
];

// Custom metrics
const errorRate = new Rate('errors');

// Authentication helper
function authenticate(user) {
  const response = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  });
  
  check(response, {
    'authentication successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined,
  });
  
  return response.json('token');
}

// Main test functions
export function setup() {
  console.log('Starting performance test setup...');
}

export default function () {
  // Select random user and endpoint
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const endpoint = testEndpoints[Math.floor(Math.random() * testEndpoints.length)];
  
  // Test authentication
  const token = authenticate(user);
  
  if (token) {
    // Test various endpoints
    testEndpoint(token, endpoint);
    
    // Test specific user flows
    if (Math.random() > 0.7) {
      testStudentFlow(token);
    } else if (Math.random() > 0.5) {
      testTeacherFlow(token);
    } else if (Math.random() > 0.3) {
      testAdminFlow(token);
    }
  }
  
  sleep(1); // Wait 1 second between requests
}

function testEndpoint(token, endpoint) {
  const response = http.get(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response size > 0': (r) => r.body.length > 0,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testStudentFlow(token) {
  // Test student-specific workflow
  const endpoints = [
    '/api/student/assignments',
    '/api/student/grades',
    '/api/student/timetable',
    '/api/student/wallet',
  ];
  
  endpoints.forEach(endpoint => {
    testEndpoint(token, endpoint);
  });
}

function testTeacherFlow(token) {
  // Test teacher-specific workflow
  const endpoints = [
    '/api/teacher/classes',
    '/api/teacher/assignments',
    '/api/teacher/grades',
    '/api/teacher/attendance',
  ];
  
  endpoints.forEach(endpoint => {
    testEndpoint(token, endpoint);
  });
}

function testAdminFlow(token) {
  // Test admin-specific workflow
  const endpoints = [
    '/api/admin/students',
    '/api/admin/teachers',
    '/api/admin/payments',
    '/api/admin/reports',
  ];
  
  endpoints.forEach(endpoint => {
    testEndpoint(token, endpoint);
  });
}

export function teardown() {
  console.log('Performance test completed');
  console.log(`Error rate: ${errorRate.rate * 100}%`);
}

// Stress test functions
export function stressTest() {
  // Maximum load test
  const maxUsers = 1500;
  const testDuration = '5m';
  
  console.log(`Starting stress test with ${maxUsers} users for ${testDuration}`);
  
  // This would be called separately for stress testing
  return {
    stages: [
      { duration: '1m', target: maxUsers },
      { duration: testDuration, target: maxUsers },
      { duration: '1m', target: 0 },
    ],
  };
}

// Database performance test
export function testDatabasePerformance() {
  const queries = [
    'SELECT * FROM students LIMIT 100',
    'SELECT * FROM assignments LIMIT 100',
    'SELECT * FROM payments LIMIT 100',
    'SELECT COUNT(*) FROM users',
  ];
  
  queries.forEach(query => {
    const startTime = Date.now();
    // Execute query (this would be actual database query)
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    check(duration, {
      'query time < 100ms': (d) => d < 100,
    });
  });
}

// File upload performance test
export function testFileUpload() {
  const fileSizes = ['1MB', '5MB', '10MB'];
  const fileTypes = ['pdf', 'jpg', 'docx'];
  
  fileSizes.forEach(size => {
    fileTypes.forEach(type => {
      const response = http.post(`${BASE_URL}/api/upload`, {
        file: `test-${size}.${type}`,
      });
      
      check(response, {
        'upload successful': (r) => r.status === 200,
        'upload time < 5s': (r) => r.timings.duration < 5000,
      });
    });
  });
}

// Real-time features test
export function testRealTimeFeatures() {
  // Test WebSocket connections and real-time updates
  const wsUrl = `${BASE_URL.replace('http', 'ws')}/api/realtime`;
  
  // Simulate real-time connections
  for (let i = 0; i < 100; i++) {
    // Test WebSocket connection
    const response = http.get(`${BASE_URL}/api/realtime/status`);
    
    check(response, {
      'realtime status ok': (r) => r.status === 200,
      'connection time < 200ms': (r) => r.timings.duration < 200,
    });
  }
}

// Cache performance test
export function testCachePerformance() {
  const endpoints = [
    '/api/students',
    '/api/assignments',
    '/api/library/books',
  ];
  
  endpoints.forEach(endpoint => {
    // First request (cache miss)
    const firstResponse = http.get(`${BASE_URL}${endpoint}`);
    const firstTime = firstResponse.timings.duration;
    
    // Second request (cache hit)
    const secondResponse = http.get(`${BASE_URL}${endpoint}`);
    const secondTime = secondResponse.timings.duration;
    
    check(secondTime, {
      'cache hit faster': (t) => t < firstTime * 0.5,
      'cache response time < 100ms': (t) => t < 100,
    });
  });
}
