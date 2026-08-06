import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[PASS] ${url} -> Status: ${res.statusCode}`);
        resolve(true);
      });
    }).on('error', (err) => {
      console.log(`[FAIL] ${url} -> Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runCheck() {
  console.log('--- RUNNING FULL SYSTEM HEALTH CHECKS ---');
  await checkUrl('http://localhost:5000/api/health');
  await checkUrl('http://localhost:5000/api/menu');
  await checkUrl('http://localhost:5000/api/tables');
  await checkUrl('http://localhost:5000/api/orders/kitchen');
  await checkUrl('http://localhost:3000/');
  console.log('--- ALL CHECKS COMPLETE ---');
}

runCheck();
