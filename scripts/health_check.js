import http from 'http';

const checkEndpoint = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    }).on('error', err => reject(err));
  });
};

const runHealthCheck = async () => {
  console.log('🔍 Starting Automated Health Check Verification...\n');
  const baseUrl = 'http://localhost:5000';
  let passed = true;

  const endpoints = [
    { path: '/api/menu', expectedStatus: 200, name: 'Menu API Endpoint' },
    { path: '/api/tables', expectedStatus: 200, name: 'Tables API Endpoint' },
    { path: '/api/settings', expectedStatus: 200, name: 'Settings API Endpoint' },
    { path: '/', expectedStatus: 200, name: 'Static Frontend App Entry Route' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await checkEndpoint(`${baseUrl}${ep.path}`);
      if (res.status === ep.expectedStatus) {
        console.log(`✅ [PASS] ${ep.name} (${ep.path}) -> HTTP ${res.status}`);
      } else {
        console.error(`❌ [FAIL] ${ep.name} (${ep.path}) -> Expected HTTP ${ep.expectedStatus}, got ${res.status}`);
        passed = false;
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${ep.name} (${ep.path}) -> Failed to connect: ${err.message}`);
      passed = false;
    }
  }

  if (passed) {
    console.log('\n🎉 ALL AUTOMATED HEALTH CHECKS PASSED! Zero errors found.');
    process.exit(0);
  } else {
    console.error('\n⚠️ Health check detected issues that need fixing.');
    process.exit(1);
  }
};

runHealthCheck();
