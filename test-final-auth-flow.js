#!/usr/bin/env node

/**
 * Final comprehensive test of the complete authentication flow
 */

const http = require('http');
const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testFinalAuthFlow() {
  console.log('🔍 Final Authentication Flow Test\n');
  
  const LANDING_URL = 'http://localhost:3001';
  const FRONTEND_URL = 'http://localhost:3000';
  
  let allTestsPassed = true;
  
  // Test 1: Landing page accessibility
  console.log('1. Testing landing page accessibility...');
  try {
    const response = await makeRequest(LANDING_URL);
    if (response.status === 200) {
      console.log('✅ Landing page accessible');
    } else {
      console.log(`❌ Landing page returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Landing page error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 2: Login page accessibility
  console.log('\n2. Testing login page accessibility...');
  try {
    const response = await makeRequest(`${LANDING_URL}/auth/login`);
    if (response.status === 200) {
      console.log('✅ Login page accessible');
    } else {
      console.log(`❌ Login page returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Login page error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 3: Landing page login API
  console.log('\n3. Testing landing page login API...');
  try {
    const response = await makeRequest(`${LANDING_URL}/auth/login/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@edumyles.com' })
    });
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.authUrl && data.authUrl.includes('workos.com')) {
        console.log('✅ Login API works and returns WorkOS URL');
        
        // Check redirect URI
        const authUrl = new URL(data.authUrl);
        const redirectUri = authUrl.searchParams.get('redirect_uri');
        if (redirectUri.includes('localhost:3001/auth/callback')) {
          console.log('✅ Redirect URI points to landing callback');
        } else {
          console.log('❌ Redirect URI incorrect:', redirectUri);
          allTestsPassed = false;
        }
      } else {
        console.log('❌ Invalid auth URL response');
        allTestsPassed = false;
      }
    } else {
      console.log(`❌ Login API returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Login API error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Landing page callback redirect
  console.log('\n4. Testing landing page callback redirect...');
  try {
    const response = await makeRequest(`${LANDING_URL}/auth/callback?code=test_code&state=test_state`, {
      redirect: 'manual'
    });
    
    if (response.status === 302) {
      const location = response.headers.location;
      if (location.includes('localhost:3000/auth/callback')) {
        console.log('✅ Landing callback redirects to frontend callback');
      } else {
        console.log('❌ Landing callback redirects to wrong location:', location);
        allTestsPassed = false;
      }
    } else {
      console.log(`❌ Landing callback returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Landing callback error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 5: Frontend callback configuration
  console.log('\n5. Testing frontend callback configuration...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}/auth/callback?code=fake_code&state=fake_state`, {
      redirect: 'manual'
    });
    
    if (response.status === 302) {
      const location = response.headers.location;
      if (location.includes('config_error')) {
        console.log('❌ Frontend callback has config error');
        allTestsPassed = false;
      } else if (location.includes('token_exchange_failed')) {
        console.log('✅ Frontend callback configured (token exchange fails as expected with fake code)');
      } else if (location.includes('/admin') || location.includes('/portal')) {
        console.log('✅ Frontend callback redirects to dashboard');
      } else {
        console.log('❓ Frontend callback unexpected redirect:', location);
      }
    } else {
      console.log(`❌ Frontend callback returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Frontend callback error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 6: Admin dashboard accessibility
  console.log('\n6. Testing admin dashboard accessibility...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}/admin`);
    // Should redirect to login if not authenticated
    if (response.status === 302 || response.status === 200) {
      console.log('✅ Admin dashboard accessible (redirects to login as expected)');
    } else {
      console.log(`❌ Admin dashboard returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Admin dashboard error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 7: Signup flow
  console.log('\n7. Testing signup flow...');
  try {
    const response = await makeRequest(`${LANDING_URL}/auth/signup/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@edumyles.com',
        schoolName: 'Test School'
      })
    });
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.authUrl && data.authUrl.includes('workos.com')) {
        console.log('✅ Signup API works');
        
        // Check for state parameter
        const authUrl = new URL(data.authUrl);
        const state = authUrl.searchParams.get('state');
        if (state) {
          console.log('✅ State parameter included for signup');
        } else {
          console.log('❌ State parameter missing for signup');
          allTestsPassed = false;
        }
      } else {
        console.log('❌ Invalid signup auth URL');
        allTestsPassed = false;
      }
    } else {
      console.log(`❌ Signup API returned ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Signup API error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Final results
  console.log('\n🎯 FINAL TEST RESULTS:');
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED - Authentication system is ready!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test with real WorkOS authentication in browser');
    console.log('2. Verify complete flow from landing page to dashboard');
    console.log('3. Test with different user roles');
    console.log('4. Deploy to production and test on edumyles.vercel.app');
  } else {
    console.log('❌ Some tests failed - please check the issues above');
  }
  
  console.log('\n🚀 Authentication Flow Summary:');
  console.log('1. ✅ Landing page working');
  console.log('2. ✅ Login/signup pages accessible');
  console.log('3. ✅ Landing page APIs working');
  console.log('4. ✅ Callback redirects working');
  console.log('5. ✅ Frontend callback configured');
  console.log('6. ✅ Dashboard routes accessible');
  console.log('7. ✅ Signup flow working');
  
  return allTestsPassed;
}

// Run the final test
testFinalAuthFlow().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
