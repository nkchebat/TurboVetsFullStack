import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app/app.module';
import { TestDatabaseModule } from './test-db.module';
import { User, Organization, Task } from '@turbovets/data';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('AuditLogController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let taskRepository: Repository<Task>;
  let jwtService: JwtService;
  let ownerToken: string;
  let adminToken: string;
  let viewerToken: string;
  let testOrg: Organization;
  let testTask: Task;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    orgRepository = moduleFixture.get(getRepositoryToken(Organization));
    taskRepository = moduleFixture.get(getRepositoryToken(Task));
    jwtService = moduleFixture.get(JwtService);

    // Create test organization
    testOrg = await orgRepository.save({
      name: 'Test Organization',
    });

    // Create test users with different roles
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [owner, admin, viewer] = await Promise.all([
      userRepository.save({
        name: 'Owner User',
        email: 'owner@test.com',
        password: hashedPassword,
        role: 'Owner',
        organization: testOrg,
      }),
      userRepository.save({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'Admin',
        organization: testOrg,
      }),
      userRepository.save({
        name: 'Viewer User',
        email: 'viewer@test.com',
        password: hashedPassword,
        role: 'Viewer',
        organization: testOrg,
      }),
    ]);

    // Generate JWT tokens
    ownerToken = jwtService.sign({ sub: owner.id, email: owner.email });
    adminToken = jwtService.sign({ sub: admin.id, email: admin.email });
    viewerToken = jwtService.sign({ sub: viewer.id, email: viewer.email });

    // Create a test task to generate audit logs
    testTask = await taskRepository.save({
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo',
      owner: owner,
      organization: testOrg,
    });

    // Generate some audit logs through task operations
    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'New Task',
        description: 'New Description',
      });

    await request(app.getHttpServer())
      .put(`/tasks/${testTask.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Updated Task',
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/audit-log (GET)', () => {
    it('should allow owner to get all audit logs', () => {
      return request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('action');
          expect(res.body[0]).toHaveProperty('userId');
          expect(res.body[0]).toHaveProperty('taskId');
          expect(res.body[0]).toHaveProperty('details');
          expect(res.body[0]).toHaveProperty('timestamp');
        });
    });

    it('should allow admin to get only their organization audit logs', () => {
      return request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Verify all logs belong to admin's organization
          res.body.forEach((log) => {
            expect(log.userId).toBeDefined();
          });
        });
    });

    it('should not allow viewer to get audit logs', () => {
      return request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return empty array when no audit logs exist for admin', async () => {
      // Create a new organization and admin
      const newOrg = await orgRepository.save({
        name: 'New Organization',
      });

      const newAdmin = await userRepository.save({
        name: 'New Admin',
        email: 'newadmin@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Admin',
        organization: newOrg,
      });

      const newAdminToken = jwtService.sign({
        sub: newAdmin.id,
        email: newAdmin.email,
      });

      return request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${newAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('/audit-log/task/:taskId (GET)', () => {
    it('should allow owner to get task audit logs', () => {
      return request(app.getHttpServer())
        .get(`/audit-log/task/${testTask.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          res.body.forEach((log) => {
            expect(log.taskId).toBe(testTask.id);
          });
        });
    });

    it('should allow admin to get task audit logs from their organization', () => {
      return request(app.getHttpServer())
        .get(`/audit-log/task/${testTask.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should not allow viewer to get task audit logs', () => {
      return request(app.getHttpServer())
        .get(`/audit-log/task/${testTask.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return empty array for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/audit-log/task/999999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should not allow admin to access task logs from different organization', async () => {
      // Create a new organization and task
      const newOrg = await orgRepository.save({
        name: 'Another Organization',
      });

      const newAdmin = await userRepository.save({
        name: 'Another Admin',
        email: 'another@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Admin',
        organization: newOrg,
      });

      const newTask = await taskRepository.save({
        title: 'Another Task',
        description: 'Another Description',
        status: 'todo',
        owner: newAdmin,
        organization: newOrg,
      });

      return request(app.getHttpServer())
        .get(`/audit-log/task/${newTask.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});
