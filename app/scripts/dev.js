const { spawn } = require('child_process');
const path = require('path');

// Wait for Vite server to be ready
function waitForVite() {
  return new Promise((resolve) => {
    const checkServer = setInterval(() => {
      fetch('http://localhost:5173')
        .then(() => {
          clearInterval(checkServer);
          resolve();
        })
        .catch(() => {
          // Server not ready yet, keep waiting
        });
    }, 100);
  });
}

async function main() {
  // Start Vite dev server
  const vite = spawn('npm', ['run', 'vite'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..'),
  });

  // Wait for Vite to be ready
  console.log('Starting Vite dev server...');
  await waitForVite();
  console.log('Vite dev server ready!');

  // Start Electron
  console.log('Starting Electron...');
  const electron = spawn('npm', ['run', 'electron'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'development' },
  });

  // Handle cleanup
  const cleanup = () => {
    vite.kill();
    electron.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  electron.on('close', () => {
    vite.kill();
    process.exit();
  });
}

main().catch(console.error);
