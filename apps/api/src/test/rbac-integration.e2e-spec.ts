import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app/app.module';
import { JwtService } from '@nestjs/jwt';

describe('RBAC Integration Tests (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Mock user data for different roles
  const ownerUser = {
    id: 1,
    email: 'owner@test.com',
    role: 'Owner',
    organization: { id: 1 },
  };

  const adminUser = {
    id: 2,
    email: 'admin@test.com',
    role: 'Admin',
    organization: { id: 1 },
  };

  const viewerUser = {
    id: 3,
    email: 'viewer@test.com',
    role: 'Viewer',
    organization: { id: 1 },
  };

  const adminUserOrg2 = {
    id: 4,
    email: 'admin2@test.com',
    role: 'Admin',
    organization: { id: 2 },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const generateToken = (user: any) => {
    return jwtService.sign(user);
  };

  describe('Tasks Endpoint RBAC', () => {
    describe('GET /api/tasks', () => {
      it('should allow Owner to access tasks', async () => {
        const token = generateToken(ownerUser);

        const response = await request(app.getHttpServer())
          .get('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should allow Admin to access tasks', async () => {
        const token = generateToken(adminUser);

        const response = await request(app.getHttpServer())
          .get('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should allow Viewer to access tasks', async () => {
        const token = generateToken(viewerUser);

        const response = await request(app.getHttpServer())
          .get('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should deny access without authentication', async () => {
        await request(app.getHttpServer()).get('/api/tasks').expect(401);
      });
    });

    describe('POST /api/tasks', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        category: 'Work',
      };

      it('should allow Owner to create tasks', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .post('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .send(taskData)
          .expect(201);
      });

      it('should allow Admin to create tasks', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .post('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .send(taskData)
          .expect(201);
      });

      it('should deny Viewer from creating tasks', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .post('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .send(taskData)
          .expect(403);
      });
    });

    describe('PUT /api/tasks/:id', () => {
      const updateData = {
        title: 'Updated Task',
        status: 'DONE',
      };

      it('should allow Owner to update tasks', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .put('/api/tasks/1')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(200);
      });

      it('should allow Admin to update tasks', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .put('/api/tasks/1')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(200);
      });

      it('should deny Viewer from updating tasks', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .put('/api/tasks/1')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(403);
      });
    });

    describe('DELETE /api/tasks/:id', () => {
      it('should allow Owner to delete tasks', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .delete('/api/tasks/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should allow Admin to delete tasks', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .delete('/api/tasks/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny Viewer from deleting tasks', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .delete('/api/tasks/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });
  });

  describe('Organizations Endpoint RBAC', () => {
    describe('POST /api/organizations', () => {
      const orgData = {
        name: 'Test Organization',
        description: 'Test Description',
      };

      it('should allow Owner to create organizations', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('Authorization', `Bearer ${token}`)
          .send(orgData)
          .expect(201);
      });

      it('should deny Admin from creating organizations', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('Authorization', `Bearer ${token}`)
          .send(orgData)
          .expect(403);
      });

      it('should deny Viewer from creating organizations', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('Authorization', `Bearer ${token}`)
          .send(orgData)
          .expect(403);
      });
    });

    describe('GET /api/organizations/sub-organizations', () => {
      it('should allow Owner to view sub-organizations', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .get('/api/organizations/sub-organizations')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should allow Admin to view sub-organizations', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .get('/api/organizations/sub-organizations')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny Viewer from viewing sub-organizations', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .get('/api/organizations/sub-organizations')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });

    describe('DELETE /api/organizations/:id', () => {
      it('should allow Owner to delete organizations', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .delete('/api/organizations/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny Admin from deleting organizations', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .delete('/api/organizations/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

      it('should deny Viewer from deleting organizations', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .delete('/api/organizations/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });
  });

  describe('Users Endpoint RBAC', () => {
    describe('POST /api/users', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'Admin',
        organizationId: 1,
      };

      it('should allow Owner to create users', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send(userData)
          .expect(201);
      });

      it('should deny Admin from creating users', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send(userData)
          .expect(403);
      });

      it('should deny Viewer from creating users', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send(userData)
          .expect(403);
      });
    });

    describe('GET /api/users', () => {
      it('should allow Owner to view users', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should allow Admin to view users in their organization', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny Viewer from viewing users', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });
  });

  describe('Audit Log Endpoint RBAC', () => {
    describe('GET /api/audit-log', () => {
      it('should allow Owner to view audit logs', async () => {
        const token = generateToken(ownerUser);

        await request(app.getHttpServer())
          .get('/api/audit-log')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should allow Admin to view audit logs', async () => {
        const token = generateToken(adminUser);

        await request(app.getHttpServer())
          .get('/api/audit-log')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      it('should deny Viewer from viewing audit logs', async () => {
        const token = generateToken(viewerUser);

        await request(app.getHttpServer())
          .get('/api/audit-log')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
    });
  });

  describe('Organization Isolation', () => {
    it('should prevent Admin from accessing different organization data', async () => {
      const token = generateToken(adminUserOrg2);

      // Try to access organization 1 data while being from organization 2
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .query({ organizationId: 1 })
        .expect(403);
    });

    it('should allow Owner to access any organization data', async () => {
      const token = generateToken(ownerUser);

      // Owner should be able to access any organization
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .query({ organizationId: 2 })
        .expect(200);
    });

    it('should allow Admin to access their own organization data', async () => {
      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .query({ organizationId: 1 })
        .expect(200);
    });
  });

  describe('Role Hierarchy', () => {
    it('should demonstrate Owner has highest privileges', async () => {
      const token = generateToken(ownerUser);

      // Owner can perform all operations
      await request(app.getHttpServer())
        .post('/api/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Org', description: 'Test' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test User', email: 'test@test.com', role: 'Admin' })
        .expect(201);
    });

    it('should demonstrate Admin has limited privileges', async () => {
      const token = generateToken(adminUser);

      // Admin can manage tasks but not organizations or users
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Task', description: 'Test', category: 'Work' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Org', description: 'Test' })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test User', email: 'test@test.com', role: 'Admin' })
        .expect(403);
    });

    it('should demonstrate Viewer has read-only access', async () => {
      const token = generateToken(viewerUser);

      // Viewer can only read tasks
      await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // But cannot create, update, or delete
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Task', description: 'Test', category: 'Work' })
        .expect(403);

      await request(app.getHttpServer())
        .put('/api/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Task' })
        .expect(403);

      await request(app.getHttpServer())
        .delete('/api/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
