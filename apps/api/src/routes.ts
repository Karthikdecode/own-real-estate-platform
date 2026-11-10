import { Router } from 'express';
import { AppDataSource } from './database/data-source.js';
import type { DatabaseHealthCheck } from './database/database.js';
import { AdminAuditLogEntity } from './database/entities/admin-audit-log.entity.js';
import { InquiryEntity } from './database/entities/inquiry.entity.js';
import { PropertyImageEntity } from './database/entities/property-image.entity.js';
import { PropertyStatusHistoryEntity } from './database/entities/property-status-history.entity.js';
import { PropertyEntity } from './database/entities/property.entity.js';
import { RefreshTokenEntity } from './database/entities/refresh-token.entity.js';
import { UserEntity } from './database/entities/user.entity.js';
import { AdminController } from './modules/admin/admin.controller.js';
import { createAdminRouter } from './modules/admin/admin.routes.js';
import { AdminService } from './modules/admin/admin.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import { RefreshTokenService } from './modules/auth/refresh-token.service.js';
import { HealthController } from './modules/health/health.controller.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { HealthService } from './modules/health/health.service.js';
import { InquiriesController } from './modules/inquiries/inquiries.controller.js';
import { createInquiriesRouter } from './modules/inquiries/inquiries.routes.js';
import { InquiriesService } from './modules/inquiries/inquiries.service.js';
import { PropertiesController } from './modules/properties/properties.controller.js';
import { createPropertiesRouter } from './modules/properties/properties.routes.js';
import { PropertiesService } from './modules/properties/properties.service.js';
import type { StorageProvider } from './modules/uploads/storage.interface.js';

export interface AppDependencies {
  readonly databaseHealth: DatabaseHealthCheck;
  readonly storage: StorageProvider;
}

export function createApiRouter(deps: AppDependencies): Router {
  const router = Router();

  // Health
  const healthController = new HealthController(new HealthService(deps.databaseHealth));
  router.use(createHealthRouter(healthController));

  // Repositories
  const userRepo = AppDataSource.getRepository(UserEntity);
  const refreshTokenRepo = AppDataSource.getRepository(RefreshTokenEntity);
  const propertyRepo = AppDataSource.getRepository(PropertyEntity);
  const imageRepo = AppDataSource.getRepository(PropertyImageEntity);
  const inquiryRepo = AppDataSource.getRepository(InquiryEntity);
  const historyRepo = AppDataSource.getRepository(PropertyStatusHistoryEntity);
  const auditRepo = AppDataSource.getRepository(AdminAuditLogEntity);

  // Auth Module
  const refreshTokenService = new RefreshTokenService(refreshTokenRepo, userRepo);
  const authService = new AuthService(userRepo, refreshTokenService);
  const authController = new AuthController(authService);
  router.use(createAuthRouter(authController));

  // Properties Module
  const propertiesService = new PropertiesService(propertyRepo, imageRepo, deps.storage);
  const propertiesController = new PropertiesController(propertiesService);
  router.use(createPropertiesRouter(propertiesController));

  // Inquiries Module
  const inquiriesService = new InquiriesService(inquiryRepo, propertyRepo, userRepo);
  const inquiriesController = new InquiriesController(inquiriesService);
  router.use(createInquiriesRouter(inquiriesController));

  // Admin Moderation Module
  const adminService = new AdminService(
    propertyRepo,
    imageRepo,
    userRepo,
    inquiryRepo,
    historyRepo,
    auditRepo,
    deps.storage,
  );
  const adminController = new AdminController(adminService);
  router.use(createAdminRouter(adminController));

  return router;
}
