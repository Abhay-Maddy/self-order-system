import { existsSync } from 'fs';
import { execSync } from 'child_process';

// Auto-build frontend if dist/ folder is missing (happens on Render first deploy)
if (!existsSync('./dist/index.html')) {
  console.log('⚙️  dist/ folder not found. Building frontend automatically...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('✅ Frontend build completed successfully!');
  } catch (err) {
    console.warn('⚠️  Frontend build failed. Server will run API-only mode.');
  }
}

// Start the Express server
import('./server/index.js');
