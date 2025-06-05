import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  Organization,
  UserRole,
} from '../../../../libs/data/src/lib/entities';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🚀 Starting database bootstrap...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const orgRepository = app.get<Repository<Organization>>(
    getRepositoryToken(Organization)
  );

  try {
    // Check if data already exists
    const existingOrgs = await orgRepository.count();
    if (existingOrgs > 0) {
      console.log('✅ Database already has organizations. Skipping bootstrap.');
      await app.close();
      return;
    }

    console.log('📝 Creating organizations...');

    // Create parent organization
    const parentOrg = await orgRepository.save({
      name: 'No Substitutions',
    });
    console.log(
      `✅ Created parent organization: ${parentOrg.name} (ID: ${parentOrg.id})`
    );

    // Create child organizations
    const phxOrg = await orgRepository.save({
      name: 'No Substitutions PHX',
      parentOrg: parentOrg,
    });
    console.log(
      `✅ Created child organization: ${phxOrg.name} (ID: ${phxOrg.id})`
    );

    const dalOrg = await orgRepository.save({
      name: 'No Substitutions DAL',
      parentOrg: parentOrg,
    });
    console.log(
      `✅ Created child organization: ${dalOrg.name} (ID: ${dalOrg.id})`
    );

    console.log('👥 Creating users...');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Main Admin (Owner of parent org)
    const mainAdmin = await userRepository.save({
      name: 'Main Admin',
      email: 'main.admin@nosubstitutions.com',
      password: hashedPassword,
      role: 'Owner' as UserRole,
      organization: parentOrg,
    });
    console.log(
      `✅ Created user: ${mainAdmin.name} (${mainAdmin.role}) in ${parentOrg.name}`
    );

    // Create PHX Admin (Admin of PHX org)
    const phxAdmin = await userRepository.save({
      name: 'PHX Admin',
      email: 'phx.admin@nosubstitutions.com',
      password: hashedPassword,
      role: 'Admin' as UserRole,
      organization: phxOrg,
    });
    console.log(
      `✅ Created user: ${phxAdmin.name} (${phxAdmin.role}) in ${phxOrg.name}`
    );

    // Create DAL Admin (Admin of DAL org)
    const dalAdmin = await userRepository.save({
      name: 'DAL Admin',
      email: 'dal.admin@nosubstitutions.com',
      password: hashedPassword,
      role: 'Admin' as UserRole,
      organization: dalOrg,
    });
    console.log(
      `✅ Created user: ${dalAdmin.name} (${dalAdmin.role}) in ${dalOrg.name}`
    );

    console.log('\n🎉 Bootstrap completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Organizations created: 3`);
    console.log(`   Users created: 3`);
    console.log('\n🔑 Login credentials (password for all: password123):');
    console.log(`   Main Admin: main.admin@nosubstitutions.com`);
    console.log(`   PHX Admin: phx.admin@nosubstitutions.com`);
    console.log(`   DAL Admin: dal.admin@nosubstitutions.com`);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
