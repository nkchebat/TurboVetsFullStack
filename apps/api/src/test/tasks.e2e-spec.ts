import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app/app.module';
import { TestDatabaseModule } from './test-db.module';
import { User, Organization } from '@turbovets/data';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let jwtService: JwtService;
  let ownerToken: string;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    orgRepository = moduleFixture.get(getRepositoryToken(Organization));
    jwtService = moduleFixture.get(JwtService);

    // Create test organization
    const org = await orgRepository.save({
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
        organization: org,
      }),
      userRepository.save({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'Admin',
        organization: org,
      }),
      userRepository.save({
        name: 'Viewer User',
        email: 'viewer@test.com',
        password: hashedPassword,
        role: 'Viewer',
        organization: org,
      }),
    ]);

    // Generate JWT tokens
    ownerToken = jwtService.sign({ sub: owner.id, email: owner.email });
    adminToken = jwtService.sign({ sub: admin.id, email: admin.email });
    viewerToken = jwtService.sign({ sub: viewer.id, email: viewer.email });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tasks (POST)', () => {
    it('should allow owner to create task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Task');
        });
    });

    it('should allow admin to create task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Task',
          description: 'Admin Description',
        })
        .expect(201);
    });

    it('should not allow viewer to create task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Task',
          description: 'Viewer Description',
        })
        .expect(403);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(400);
    });

    it('should not allow creating task in different organization', async () => {
      // Create another organization
      const anotherOrg = await orgRepository.save({
        name: 'Another Org',
      });

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Task in Different Org',
          description: 'Description',
          organizationId: anotherOrg.id,
        })
        .expect(403);
    });

    it('should handle long title and description', () => {
      const longString = 'a'.repeat(1000);
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: longString,
          description: longString,
        })
        .expect(400);
    });
  });

  describe('/tasks (GET)', () => {
    it('should allow all roles to get tasks', async () => {
      // Test for each role
      for (const token of [ownerToken, adminToken, viewerToken]) {
        await request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      }
    });

    it('should return tasks in correct order (newest first)', async () => {
      // Create multiple tasks
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            title: `Task ${i}`,
            description: `Description ${i}`,
          });
        tasks.push(response.body);
        // Add small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          const timestamps = res.body.map((task) =>
            new Date(task.createdAt).getTime()
          );
          // Verify descending order
          expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
        });
    });

    it('should not return tasks from other organizations', async () => {
      // Create another organization and task
      const anotherOrg = await orgRepository.save({
        name: 'Another Org',
      });

      const anotherAdmin = await userRepository.save({
        name: 'Another Admin',
        email: 'another@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Admin',
        organization: anotherOrg,
      });

      const anotherAdminToken = jwtService.sign({
        sub: anotherAdmin.id,
        email: anotherAdmin.email,
      });

      // Create task in another org
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .send({
          title: 'Task in Another Org',
          description: 'Description',
        });

      // Verify original admin can't see the task
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const foundTask = res.body.find(
            (task) => task.title === 'Task in Another Org'
          );
          expect(foundTask).toBeUndefined();
        });
    });
  });

  describe('/tasks/:id (PUT)', () => {
    let taskId: number;

    beforeEach(async () => {
      // Create a test task
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Update Test Task',
          description: 'Update Test Description',
        });
      taskId = response.body.id;
    });

    it('should allow owner to update task', () => {
      return request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Updated Task',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Task');
        });
    });

    it('should not allow viewer to update task', () => {
      return request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Update',
        })
        .expect(403);
    });

    it('should not allow updating task status to invalid value', () => {
      return request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'invalid_status',
        })
        .expect(400);
    });

    it('should not allow updating task to different organization', async () => {
      const anotherOrg = await orgRepository.save({
        name: 'Another Org',
      });

      return request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          organizationId: anotherOrg.id,
        })
        .expect(403);
    });

    it('should handle concurrent updates correctly', async () => {
      // Simulate concurrent updates from owner and admin
      const [ownerUpdate, adminUpdate] = await Promise.all([
        request(app.getHttpServer())
          .put(`/tasks/${taskId}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            title: 'Owner Update',
          }),
        request(app.getHttpServer())
          .put(`/tasks/${taskId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Admin Update',
          }),
      ]);

      expect(ownerUpdate.status).toBe(200);
      expect(adminUpdate.status).toBe(200);

      // Verify final state
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.body.title).toBe('Admin Update');
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    let taskId: number;

    beforeEach(async () => {
      // Create a test task
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Delete Test Task',
          description: 'Delete Test Description',
        });
      taskId = response.body.id;
    });

    it('should allow owner to delete task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('should not allow admin to delete task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should handle deletion of non-existent task', () => {
      return request(app.getHttpServer())
        .delete('/tasks/999999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });

    it('should not allow admin to delete task from different organization', async () => {
      // Create another organization and task
      const anotherOrg = await orgRepository.save({
        name: 'Another Org',
      });

      const anotherAdmin = await userRepository.save({
        name: 'Another Admin',
        email: 'another@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Admin',
        organization: anotherOrg,
      });

      const anotherTask = await taskRepository.save({
        title: 'Another Task',
        description: 'Description',
        status: 'todo',
        owner: anotherAdmin,
        organization: anotherOrg,
      });

      return request(app.getHttpServer())
        .delete(`/tasks/${anotherTask.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should cascade delete related audit logs', async () => {
      // Create a task and generate some audit logs
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Task to Delete',
          description: 'Will be deleted',
        });

      const taskToDelete = response.body;

      // Update the task to generate audit logs
      await request(app.getHttpServer())
        .put(`/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Updated Title',
        });

      // Delete the task
      await request(app.getHttpServer())
        .delete(`/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify audit logs are also deleted
      const auditLogsResponse = await request(app.getHttpServer())
        .get(`/audit-log/task/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(auditLogsResponse.body).toHaveLength(0);
    });
  });
});
