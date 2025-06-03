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

describe('OrganizationsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgRepository: Repository<Organization>;
  let jwtService: JwtService;
  let ownerToken: string;
  let adminToken: string;
  let viewerToken: string;
  let testOrg: Organization;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/organizations (POST)', () => {
    it('should allow owner to create organization', () => {
      return request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Sub Organization',
          parentOrgId: testOrg.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Sub Organization');
        });
    });

    it('should not allow admin to create organization', () => {
      return request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Sub Org',
          parentOrgId: testOrg.id,
        })
        .expect(403);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(400);
    });

    it('should not allow creating organization with non-existent parent', () => {
      return request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Invalid Parent Org',
          parentOrgId: 999999,
        })
        .expect(404);
    });

    it('should not allow creating circular organization hierarchy', async () => {
      // Create a sub-organization
      const subOrgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Sub Org',
          parentOrgId: testOrg.id,
        });

      // Try to make the parent org a child of the sub-org
      return request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Circular Org',
          parentOrgId: subOrgResponse.body.id,
        })
        .expect(400);
    });

    it('should handle long organization names', () => {
      return request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'a'.repeat(1000),
        })
        .expect(400);
    });
  });

  describe('/organizations/sub-organizations (GET)', () => {
    beforeEach(async () => {
      // Create a sub-organization for testing
      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Sub Org',
          parentOrgId: testOrg.id,
        });
    });

    it('should allow owner to get sub-organizations', () => {
      return request(app.getHttpServer())
        .get('/organizations/sub-organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should allow admin to get sub-organizations', () => {
      return request(app.getHttpServer())
        .get('/organizations/sub-organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should not allow viewer to get sub-organizations', () => {
      return request(app.getHttpServer())
        .get('/organizations/sub-organizations')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return empty array when no sub-organizations exist', async () => {
      // Create a new organization without sub-orgs
      const newOrg = await orgRepository.save({
        name: 'No Sub Orgs',
      });

      const newOwner = await userRepository.save({
        name: 'New Owner',
        email: 'newowner@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Owner',
        organization: newOrg,
      });

      const newOwnerToken = jwtService.sign({
        sub: newOwner.id,
        email: newOwner.email,
      });

      return request(app.getHttpServer())
        .get('/organizations/sub-organizations')
        .set('Authorization', `Bearer ${newOwnerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return nested sub-organizations in correct order', async () => {
      // Create multiple levels of sub-organizations
      const level1Response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Level 1 Org',
          parentOrgId: testOrg.id,
        });

      const level2Response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Level 2 Org',
          parentOrgId: level1Response.body.id,
        });

      return request(app.getHttpServer())
        .get('/organizations/sub-organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          // Verify hierarchy is maintained
          const level1Org = res.body.find((org) => org.name === 'Level 1 Org');
          expect(level1Org).toBeDefined();
          expect(level1Org.parentOrg.id).toBe(testOrg.id);
        });
    });
  });

  describe('/organizations/:id (PUT)', () => {
    let subOrgId: number;

    beforeEach(async () => {
      // Create a sub-organization for testing
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Update Test Org',
          parentOrgId: testOrg.id,
        });
      subOrgId = response.body.id;
    });

    it('should allow owner to update organization', () => {
      return request(app.getHttpServer())
        .put(`/organizations/${subOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Updated Organization',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Organization');
        });
    });

    it('should not allow admin to update organization', () => {
      return request(app.getHttpServer())
        .put(`/organizations/${subOrgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Update',
        })
        .expect(403);
    });

    it('should not allow updating organization to create circular reference', async () => {
      // Create a sub-organization
      const subOrgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Sub Org',
          parentOrgId: testOrg.id,
        });

      // Try to make parent org a child of its child
      return request(app.getHttpServer())
        .put(`/organizations/${testOrg.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          parentOrgId: subOrgResponse.body.id,
        })
        .expect(400);
    });

    it('should not allow updating to non-existent parent organization', () => {
      return request(app.getHttpServer())
        .put(`/organizations/${testOrg.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          parentOrgId: 999999,
        })
        .expect(404);
    });

    it('should handle concurrent updates correctly', async () => {
      const subOrgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Concurrent Test Org',
          parentOrgId: testOrg.id,
        });

      const subOrgId = subOrgResponse.body.id;

      // Simulate concurrent updates
      const [update1, update2] = await Promise.all([
        request(app.getHttpServer())
          .put(`/organizations/${subOrgId}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'Update 1',
          }),
        request(app.getHttpServer())
          .put(`/organizations/${subOrgId}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'Update 2',
          }),
      ]);

      expect(update1.status).toBe(200);
      expect(update2.status).toBe(200);

      // Verify final state
      const response = await request(app.getHttpServer())
        .get(`/organizations/${subOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.body.name).toBe('Update 2');
    });
  });

  describe('/organizations/:id (DELETE)', () => {
    let subOrgId: number;

    beforeEach(async () => {
      // Create a sub-organization for testing
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Delete Test Org',
          parentOrgId: testOrg.id,
        });
      subOrgId = response.body.id;
    });

    it('should allow owner to delete organization', () => {
      return request(app.getHttpServer())
        .delete(`/organizations/${subOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('should not allow admin to delete organization', () => {
      return request(app.getHttpServer())
        .delete(`/organizations/${subOrgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should not allow deleting organization with users', async () => {
      // Create a sub-organization
      const subOrgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Org With Users',
          parentOrgId: testOrg.id,
        });

      // Create a user in the sub-organization
      await userRepository.save({
        name: 'Sub Org User',
        email: 'subuser@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Admin',
        organization: { id: subOrgResponse.body.id },
      });

      // Try to delete the organization
      return request(app.getHttpServer())
        .delete(`/organizations/${subOrgResponse.body.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);
    });

    it('should not allow deleting root organization', () => {
      return request(app.getHttpServer())
        .delete(`/organizations/${testOrg.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);
    });

    it('should cascade delete related tasks and audit logs', async () => {
      // Create a sub-organization
      const subOrgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Org To Delete',
          parentOrgId: testOrg.id,
        });

      const subOrgId = subOrgResponse.body.id;

      // Create a task in the sub-organization
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Task in Sub Org',
          description: 'Will be deleted',
          organizationId: subOrgId,
        });

      // Delete the organization
      await request(app.getHttpServer())
        .delete(`/organizations/${subOrgId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${taskResponse.body.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);

      // Verify audit logs are deleted
      const auditLogsResponse = await request(app.getHttpServer())
        .get(`/audit-log/task/${taskResponse.body.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(auditLogsResponse.body).toHaveLength(0);
    });
  });
});
