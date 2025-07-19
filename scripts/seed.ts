import { PrismaClient, AuditAction } from '@prisma/client';
import { PasswordUtils } from '../src/utils/password';
import { config } from '../src/config/config';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    logger.info('Starting admin user seeding...');

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: config.admin.email }
    });

    if (existingAdmin) {
      logger.info(`Admin user already exists with email: ${config.admin.email}`);
      return;
    }

    // Hash the admin password
    const hashedPassword = await PasswordUtils.hashPassword(config.admin.password);

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        email: config.admin.email,
        password: hashedPassword,
        name: config.admin.name,
        role: 'admin',
        isActive: true,
      }
    });

    logger.info(`✅ Admin user created successfully!`);
    logger.info(`Email: ${admin.email}`);
    logger.info(`Name: ${admin.name}`);
    logger.info(`Role: ${admin.role}`);
    logger.info(`ID: ${admin.id}`);

    // Create initial audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        entityType: 'ADMIN',
        entityId: admin.id,
        adminId: admin.id,
        description: 'Initial admin user created via seed script',
        newValues: JSON.stringify({
          adminEmail: admin.email,
          adminName: admin.name,
          createdAt: admin.createdAt,
          method: 'SEED_SCRIPT'
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
      }
    });

    logger.info('✅ Initial audit log created');

  } catch (error) {
    logger.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedAdmin()
    .then(() => {
      logger.info('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdmin;
