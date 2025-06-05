const { spawn, exec } = require('child_process');
const fs = require('fs');
const http = require('http');

console.log('🚀 Setting up TurboVets Database...');

// Helper function to run a command and wait for it
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Helper function to check if API is responding
function checkAPI() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api',
        method: 'GET',
        timeout: 3000,
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Helper function to wait for API
async function waitForAPI(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkAPI()) {
      return true;
    }
    console.log(`⏳ Waiting for API... (attempt ${i + 1}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

// Helper function to kill processes
function killProcesses() {
  return new Promise((resolve) => {
    exec('pkill -f "api-api:serve"', () => {
      // Don't care about exit code, just resolve after trying
      setTimeout(resolve, 2000);
    });
  });
}

async function main() {
  try {
    // Step 1: Stop existing processes
    console.log('🛑 Stopping existing API processes...');
    await killProcesses();

    // Step 2: Remove existing database
    if (fs.existsSync('db.sqlite')) {
      console.log('🗑️  Removing existing database...');
      fs.unlinkSync('db.sqlite');
    }

    // Step 3: Clear NX cache
    console.log('🧹 Clearing NX cache...');
    await runCommand('npx', ['nx', 'reset']);

    // Step 4: Build the API
    console.log('📦 Building API with database configuration...');
    await runCommand('npx', ['nx', 'run', 'api-api:build']);
    console.log('✅ Build completed successfully');

    // Step 5: Start API in background
    console.log('🚀 Starting API server...');
    const apiProcess = spawn('npx', ['nx', 'run', 'api-api:serve'], {
      stdio: 'pipe',
      shell: true,
      detached: process.platform !== 'win32', // Don't detach on Windows
    });

    // Log API output to file
    const logStream = fs.createWriteStream('api.log');
    apiProcess.stdout.pipe(logStream);
    apiProcess.stderr.pipe(logStream);

    // Step 6: Wait for API to be ready
    console.log('⏳ Waiting for API to start...');
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Initial wait

    const apiReady = await waitForAPI();
    if (!apiReady) {
      throw new Error('API failed to start properly');
    }
    console.log('✅ API is responding!');

    // Step 7: Wait for database file
    console.log('⏳ Waiting for database file to be created...');
    let dbExists = false;
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync('db.sqlite')) {
        dbExists = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!dbExists) {
      console.log(
        '⚠️  Database file not found, but continuing with bootstrap...'
      );
    }

    // Step 8: Run bootstrap
    console.log('📝 Populating database with initial data...');
    await runCommand('node', ['bootstrap-simple.js']);

    // Success!
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Your database is ready with:');
    console.log('   - SQLite file: ./db.sqlite');
    console.log('   - 3 Organizations (No Substitutions + PHX & DAL branches)');
    console.log('   - 3 Users with different roles');
    console.log('   - Sample tasks for testing');
    console.log('\n🔗 API running at: http://localhost:3001/api');
    console.log('🌐 Dashboard at: http://localhost:4200');
    console.log('\n🧪 Test endpoints:');
    console.log('   curl http://localhost:3001/api/organizations');
    console.log('   curl http://localhost:3001/api/users');
    console.log('   curl http://localhost:3001/api/tasks');
    console.log(`\n✨ API process ID: ${apiProcess.pid}`);
    console.log('📄 API logs are being written to: api.log');

    // Don't exit, keep the process alive so the API stays running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      apiProcess.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
