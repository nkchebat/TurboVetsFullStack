const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting database creation and population process...');

// Function to wait for file to exist
function waitForFile(filePath, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      if (fs.existsSync(filePath)) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${filePath}`));
      } else {
        setTimeout(check, 1000);
      }
    }

    check();
  });
}

// Function to wait for API to be ready
function waitForAPI(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api',
        method: 'GET',
        timeout: 3000,
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, 2000);
        }
      });

      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for API'));
        } else {
          setTimeout(check, 2000);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        setTimeout(check, 2000);
      });

      req.end();
    }

    check();
  });
}

async function main() {
  try {
    // Step 1: Build the API
    console.log('📦 Building API...');
    const buildProcess = spawn('npx', ['nx', 'run', 'api-api:build'], {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
    });

    console.log('✅ API built successfully');

    // Step 2: Start the API in background
    console.log('🚀 Starting API server...');
    const apiProcess = spawn('npx', ['nx', 'run', 'api-api:serve'], {
      stdio: 'pipe',
      shell: true,
      detached: true,
    });

    // Don't wait for the process to exit, but monitor its output
    apiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Application is running')) {
        console.log('✅ API server started successfully');
      }
    });

    // Step 3: Wait for API to be ready
    console.log('⏳ Waiting for API to be ready...');
    await waitForAPI('http://localhost:3001/api');
    console.log('✅ API is responding');

    // Step 4: Wait for database file to be created
    console.log('⏳ Waiting for database to be created...');
    await waitForFile('./db.sqlite');
    console.log('✅ Database file created');

    // Step 5: Run bootstrap script
    console.log('📝 Populating database with initial data...');
    const bootstrapProcess = spawn('node', ['bootstrap-simple.js'], {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      bootstrapProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Bootstrap failed with code ${code}`));
      });
    });

    console.log('\n🎉 Database creation and population completed!');
    console.log('\n📊 Your database is now ready with:');
    console.log('   - 3 organizations (No Substitutions, PHX, DAL)');
    console.log('   - 3 users with different roles');
    console.log('   - SQLite database: ./db.sqlite');
    console.log('\n🔗 Test your API at: http://localhost:3001/api');

    // Don't kill the API process, let it keep running
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
