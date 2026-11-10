import { AdminAuditLogEntity } from './admin-audit-log.entity.js';
import { InquiryEntity } from './inquiry.entity.js';
import { PropertyImageEntity } from './property-image.entity.js';
import { PropertyStatusHistoryEntity } from './property-status-history.entity.js';
import { PropertyEntity } from './property.entity.js';
import { RefreshTokenEntity } from './refresh-token.entity.js';
import { UserEntity } from './user.entity.js';

export {
  AdminAuditLogEntity,
  InquiryEntity,
  PropertyEntity,
  PropertyImageEntity,
  PropertyStatusHistoryEntity,
  RefreshTokenEntity,
  UserEntity,
};

/** Explicit entity list for the DataSource (no glob scanning). */
export const ENTITIES = [
  UserEntity,
  RefreshTokenEntity,
  PropertyEntity,
  PropertyImageEntity,
  InquiryEntity,
  PropertyStatusHistoryEntity,
  AdminAuditLogEntity,
];
