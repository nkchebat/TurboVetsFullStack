const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function bootstrap() {
  console.log('🚀 Starting database bootstrap...');

  // Open database connection
  const db = new sqlite3.Database('db.sqlite');

  try {
    // First, let's check what tables exist
    console.log('🔍 Checking database schema...');
    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map((row) => row.name));
        }
      );
    });

    console.log('📋 Found tables:', tables);

    // Check if organizations already exist
    let orgCount = 0;
    try {
      orgCount = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM organization', (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
    } catch (error) {
      console.log(
        '⚠️  Organization table might not exist yet, creating data anyway...'
      );
    }

    if (orgCount > 0) {
      console.log('✅ Database already has organizations. Skipping bootstrap.');
      db.close();
      return;
    }

    console.log('📝 Creating organizations...');

    // Create parent organization
    const parentOrgId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO organization (name, parentOrgId, createdAt, updatedAt) 
         VALUES (?, NULL, datetime('now'), datetime('now'))`,
        ['No Substitutions'],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(
      `✅ Created parent organization: No Substitutions (ID: ${parentOrgId})`
    );

    // Create PHX child organization
    const phxOrgId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO organization (name, parentOrgId, createdAt, updatedAt) 
         VALUES (?, ?, datetime('now'), datetime('now'))`,
        ['No Substitutions PHX', parentOrgId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(
      `✅ Created child organization: No Substitutions PHX (ID: ${phxOrgId})`
    );

    // Create DAL child organization
    const dalOrgId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO organization (name, parentOrgId, createdAt, updatedAt) 
         VALUES (?, ?, datetime('now'), datetime('now'))`,
        ['No Substitutions DAL', parentOrgId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(
      `✅ Created child organization: No Substitutions DAL (ID: ${dalOrgId})`
    );

    console.log('👥 Creating users...');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Main Admin (Owner of parent org)
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user (name, email, password, role, organizationId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          'Main Admin',
          'main.admin@nosubstitutions.com',
          hashedPassword,
          'Owner',
          parentOrgId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(`✅ Created user: Main Admin (Owner) in No Substitutions`);

    // Create PHX Admin (Admin of PHX org)
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user (name, email, password, role, organizationId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          'PHX Admin',
          'phx.admin@nosubstitutions.com',
          hashedPassword,
          'Admin',
          phxOrgId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(`✅ Created user: PHX Admin (Admin) in No Substitutions PHX`);

    // Create DAL Admin (Admin of DAL org)
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user (name, email, password, role, organizationId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          'DAL Admin',
          'dal.admin@nosubstitutions.com',
          hashedPassword,
          'Admin',
          dalOrgId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(`✅ Created user: DAL Admin (Admin) in No Substitutions DAL`);

    // Create some sample tasks for testing
    console.log('📋 Creating sample tasks...');

    const taskTitles = [
      'Review patient files',
      'Update inventory system',
      'Schedule staff meeting',
      'Audit compliance records',
      'Train new employees',
    ];

    for (let i = 0; i < taskTitles.length; i++) {
      const orgId = i < 2 ? parentOrgId : i < 4 ? phxOrgId : dalOrgId;
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO task (title, description, status, organizationId, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [taskTitles[i], `Description for ${taskTitles[i]}`, 'todo', orgId],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }
    console.log(`✅ Created ${taskTitles.length} sample tasks`);

    console.log('\n🎉 Bootstrap completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Organizations created: 3`);
    console.log(`   Users created: 3`);
    console.log(`   Sample tasks created: ${taskTitles.length}`);
    console.log('\n🔑 Login credentials (password for all: password123):');
    console.log(`   Main Admin: main.admin@nosubstitutions.com`);
    console.log(`   PHX Admin: phx.admin@nosubstitutions.com`);
    console.log(`   DAL Admin: dal.admin@nosubstitutions.com`);
    console.log('\n🌐 Test your API endpoints:');
    console.log(
      `   Organizations: curl http://localhost:3001/api/organizations`
    );
    console.log(`   Users: curl http://localhost:3001/api/users`);
    console.log(`   Tasks: curl http://localhost:3001/api/tasks`);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    console.error('Error details:', error.message);

    // Show table schema for debugging
    try {
      const schema = await new Promise((resolve, reject) => {
        db.all(
          "SELECT sql FROM sqlite_master WHERE type='table'",
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      console.log('📋 Database schema:');
      schema.forEach((table) => console.log(table.sql));
    } catch (schemaError) {
      console.error('Could not retrieve schema:', schemaError.message);
    }
  } finally {
    db.close();
  }
}

bootstrap().catch(console.error);
