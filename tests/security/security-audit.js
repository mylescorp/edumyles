/**
 * Security Audit Suite for EduMyles
 * Comprehensive security testing and tenant isolation validation
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Security metrics
const securityErrors = new Rate('security_errors');
const tenantIsolationViolations = new Rate('tenant_isolation_violations');
const authenticationFailures = new Rate('authentication_failures');
const authorizationFailures = new Rate('authorization_failures');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Test users for different tenants
const testTenants = [
  {
    tenantId: 'tenant-1',
    admin: { email: 'admin@tenant1.com', password: 'password123' },
    teacher: { email: 'teacher@tenant1.com', password: 'password123' },
    student: { email: 'student@tenant1.com', password: 'password123' },
  },
  {
    tenantId: 'tenant-2',
    admin: { email: 'admin@tenant2.com', password: 'password123' },
    teacher: { email: 'teacher@tenant2.com', password: 'password123' },
    student: { email: 'student@tenant2.com', password: 'password123' },
  }
];

// Security test scenarios
export function setup() {
  console.log('🔒 Starting Security Audit Suite');
  console.log('Testing tenant isolation and security controls...');
}

export default function () {
  // Test 1: Authentication Security
  testAuthenticationSecurity();
  
  // Test 2: Authorization Controls
  testAuthorizationControls();
  
  // Test 3: Tenant Isolation
  testTenantIsolation();
  
  // Test 4: Data Access Controls
  testDataAccessControls();
  
  // Test 5: Input Validation
  testInputValidation();
  
  // Test 6: Session Management
  testSessionManagement();
  
  sleep(1);
}

// Test 1: Authentication Security
function testAuthenticationSecurity() {
  console.log('🔐 Testing Authentication Security...');
  
  // Test weak passwords
  const weakPasswordTests = [
    { email: 'test@test.com', password: '123', expected: 'failure' },
    { email: 'test@test.com', password: 'password', expected: 'failure' },
    { email: 'test@test.com', password: '', expected: 'failure' },
    { email: '', password: 'password123', expected: 'failure' },
    { email: 'invalid-email', password: 'password123', expected: 'failure' },
  ];
  
  weakPasswordTests.forEach(test => {
    const response = http.post(`${BASE_URL}/api/auth/login`, {
      email: test.email,
      password: test.password,
    });
    
    const isSecure = test.expected === 'failure' ? 
      response.status !== 200 : 
      response.status === 200;
    
    check(response, {
      'authentication security': isSecure,
    }) || authenticationFailures.add(1);
  });
  
  // Test SQL injection in login
  const sqlInjectionTests = [
    "admin'--",
    "admin' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
  ];
  
  sqlInjectionTests.forEach(injection => {
    const response = http.post(`${BASE_URL}/api/auth/login`, {
      email: injection,
      password: 'password',
    });
    
    check(response, {
      'SQL injection prevented': (r) => r.status !== 200,
    }) || securityErrors.add(1);
  });
}

// Test 2: Authorization Controls
function testAuthorizationControls() {
  console.log('🛡️ Testing Authorization Controls...');
  
  // Get tokens for different user types
  const tenant1AdminToken = authenticate(testTenants[0].admin);
  const tenant1StudentToken = authenticate(testTenants[0].student);
  const tenant2AdminToken = authenticate(testTenants[1].admin);
  
  if (!tenant1AdminToken || !tenant1StudentToken || !tenant2AdminToken) {
    console.error('Failed to authenticate test users');
    return;
  }
  
  // Test student accessing admin endpoints
  const studentAccessingAdmin = http.get(`${BASE_URL}/api/admin/students`, {
    headers: { 'Authorization': `Bearer ${tenant1StudentToken}` }
  });
  
  check(studentAccessingAdmin, {
    'student cannot access admin endpoints': (r) => r.status === 403,
  }) || authorizationFailures.add(1);
  
  // Test cross-tenant access
  const tenant1StudentAccessingTenant2 = http.get(`${BASE_URL}/api/students`, {
    headers: { 'Authorization': `Bearer ${tenant1StudentToken}` }
  });
  
  // This should only return tenant 1 students, not tenant 2
  const students = JSON.parse(tenant1StudentAccessingTenant2.body || '[]');
  const hasCrossTenantData = students.some(student => 
    student.tenantId && student.tenantId !== 'tenant-1'
  );
  
  check(tenant1StudentAccessingTenant2, {
    'no cross-tenant data access': (r) => !hasCrossTenantData,
  }) || tenantIsolationViolations.add(1);
}

// Test 3: Tenant Isolation
function testTenantIsolation() {
  console.log('🏢 Testing Tenant Isolation...');
  
  // Test direct tenant ID manipulation
  const tenant1Token = authenticate(testTenants[0].student);
  
  if (!tenant1Token) return;
  
  // Try to access tenant 2 data directly
  const directAccessAttempts = [
    `${BASE_URL}/api/students?tenantId=tenant-2`,
    `${BASE_URL}/api/teachers?tenantId=tenant-2`,
    `${BASE_URL}/api/assignments?tenantId=tenant-2`,
    `${BASE_URL}/api/payments?tenantId=tenant-2`,
  ];
  
  directAccessAttempts.forEach(url => {
    const response = http.get(url, {
      headers: { 'Authorization': `Bearer ${tenant1Token}` }
    });
    
    check(response, {
      'direct tenant access prevented': (r) => r.status === 403 || r.status === 404,
    }) || tenantIsolationViolations.add(1);
  });
  
  // Test tenant ID injection in request body
  const injectionTests = [
    { endpoint: '/api/students', data: { tenantId: 'tenant-2' } },
    { endpoint: '/api/assignments', data: { tenantId: 'tenant-2' } },
    { endpoint: '/api/payments', data: { tenantId: 'tenant-2' } },
  ];
  
  injectionTests.forEach(test => {
    const response = http.post(`${BASE_URL}${test.endpoint}`, test.data, {
      headers: { 'Authorization': `Bearer ${tenant1Token}` }
    });
    
    check(response, {
      'tenant injection prevented': (r) => r.status === 403 || r.status === 400,
    }) || tenantIsolationViolations.add(1);
  });
}

// Test 4: Data Access Controls
function testDataAccessControls() {
  console.log('🔍 Testing Data Access Controls...');
  
  const tenant1StudentToken = authenticate(testTenants[0].student);
  const tenant2StudentToken = authenticate(testTenants[1].student);
  
  if (!tenant1StudentToken || !tenant2StudentToken) return;
  
  // Test students can only access their own data
  const student1Data = http.get(`${BASE_URL}/api/student/profile`, {
    headers: { 'Authorization': `Bearer ${tenant1StudentToken}` }
  });
  
  const student2Data = http.get(`${BASE_URL}/api/student/profile`, {
    headers: { 'Authorization': `Bearer ${tenant2StudentToken}` }
  });
  
  // Verify data is different (proper isolation)
  const profile1 = JSON.parse(student1Data.body || '{}');
  const profile2 = JSON.parse(student2Data.body || '{}');
  
  check(student1Data, {
    'student can access own data': (r) => r.status === 200,
    'student data is isolated': () => profile1.email !== profile2.email,
  }) || securityErrors.add(1);
  
  // Test accessing other student's data directly
  const otherStudentAccess = http.get(`${BASE_URL}/api/student/profile/${testTenants[1].student.email}`, {
    headers: { 'Authorization': `Bearer ${tenant1StudentToken}` }
  });
  
  check(otherStudentAccess, {
    'cannot access other student data': (r) => r.status === 403 || r.status === 404,
  }) || authorizationFailures.add(1);
}

// Test 5: Input Validation
function testInputValidation() {
  console.log('🧪 Testing Input Validation...');
  
  const token = authenticate(testTenants[0].admin);
  if (!token) return;
  
  // Test XSS injection
  const xssPayloads = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert("xss")>',
    '"><script>alert("xss")</script>',
  ];
  
  xssPayloads.forEach(payload => {
    const response = http.post(`${BASE_URL}/api/students`, {
      firstName: payload,
      lastName: 'Test',
      email: 'test@test.com',
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    check(response, {
      'XSS prevented': (r) => r.status === 400 || r.status === 422,
    }) || securityErrors.add(1);
  });
  
  // Test NoSQL injection
  const nosqlPayloads = [
    { $ne: null },
    { $gt: '' },
    { $where: 'return true' },
    { $regex: '.*' },
  ];
  
  nosqlPayloads.forEach(payload => {
    const response = http.get(`${BASE_URL}/api/students?search=${JSON.stringify(payload)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    check(response, {
      'NoSQL injection prevented': (r) => r.status === 400 || r.status === 422,
    }) || securityErrors.add(1);
  });
  
  // Test file upload security
  const maliciousFiles = [
    { name: 'malware.exe', type: 'application/octet-stream' },
    { name: 'script.php', type: 'application/x-php' },
    { name: 'shell.sh', type: 'application/x-sh' },
  ];
  
  maliciousFiles.forEach(file => {
    const response = http.post(`${BASE_URL}/api/upload`, {
      file: file.name,
      contentType: file.type,
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    check(response, {
      'malicious file upload prevented': (r) => r.status === 400 || r.status === 422,
    }) || securityErrors.add(1);
  });
}

// Test 6: Session Management
function testSessionManagement() {
  console.log('🔑 Testing Session Management...');
  
  // Test session timeout
  const token = authenticate(testTenants[0].student);
  if (!token) return;
  
  // Make request with valid token
  const validRequest = http.get(`${BASE_URL}/api/student/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  check(validRequest, {
    'valid token works': (r) => r.status === 200,
  });
  
  // Test with invalid token
  const invalidRequest = http.get(`${BASE_URL}/api/student/profile`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  
  check(invalidRequest, {
    'invalid token rejected': (r) => r.status === 401,
  }) || authenticationFailures.add(1);
  
  // Test with no token
  const noTokenRequest = http.get(`${BASE_URL}/api/student/profile`);
  
  check(noTokenRequest, {
    'no token rejected': (r) => r.status === 401,
  }) || authenticationFailures.add(1);
  
  // Test token reuse after logout (if logout endpoint exists)
  const logoutResponse = http.post(`${BASE_URL}/api/auth/logout`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (logoutResponse.status === 200) {
    const afterLogoutRequest = http.get(`${BASE_URL}/api/student/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    check(afterLogoutRequest, {
      'token invalidated after logout': (r) => r.status === 401,
    }) || authenticationFailures.add(1);
  }
}

// Helper function to authenticate
function authenticate(user) {
  const response = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  });
  
  if (response.status === 200) {
    return response.json('token');
  }
  return null;
}

// Additional security tests
export function testRateLimiting() {
  console.log('🚦 Testing Rate Limiting...');
  
  const token = authenticate(testTenants[0].student);
  if (!token) return;
  
  // Make rapid requests to test rate limiting
  const requests = [];
  for (let i = 0; i < 100; i++) {
    requests.push(
      http.get(`${BASE_URL}/api/student/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );
  }
  
  const rateLimitedRequests = requests.filter(r => r.status === 429);
  
  check(rateLimitedRequests.length > 0, {
    'rate limiting active': () => rateLimitedRequests.length > 0,
  }) || securityErrors.add(1);
}

export function testCORS() {
  console.log('🌐 Testing CORS Configuration...');
  
  const origins = [
    'http://evil.com',
    'http://malicious-site.com',
    'null',
  ];
  
  origins.forEach(origin => {
    const response = http.get(`${BASE_URL}/api/health`, {
      headers: { 'Origin': origin }
    });
    
    const allowOrigin = response.headers['Access-Control-Allow-Origin'];
    
    check(response, {
      'CORS properly configured': (r) => 
        allowOrigin !== '*' && 
        !origins.includes(allowOrigin),
    }) || securityErrors.add(1);
  });
}

export function testSecurityHeaders() {
  console.log('🔒 Testing Security Headers...');
  
  const response = http.get(`${BASE_URL}/api/health`);
  
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
  ];
  
  requiredHeaders.forEach(header => {
    check(response, {
      [`${header} header present`]: (r) => r.headers[header] !== undefined,
    }) || securityErrors.add(1);
  });
}

export function teardown() {
  console.log('🔒 Security Audit Completed');
  console.log(`Security Errors: ${securityErrors.rate * 100}%`);
  console.log(`Tenant Isolation Violations: ${tenantIsolationViolations.rate * 100}%`);
  console.log(`Authentication Failures: ${authenticationFailures.rate * 100}%`);
  console.log(`Authorization Failures: ${authorizationFailures.rate * 100}%`);
}
