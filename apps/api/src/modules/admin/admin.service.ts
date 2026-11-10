import type {
  AdminDashboardStats,
  AdminPropertiesQuery,
  AdminPropertyItem,
  ModeratePropertyAction,
} from '@real-estate/contracts';
import type { Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { AdminAuditLogEntity } from '../../database/entities/admin-audit-log.entity.js';
import { InquiryEntity } from '../../database/entities/inquiry.entity.js';
import { PropertyImageEntity } from '../../database/entities/property-image.entity.js';
import { PropertyStatusHistoryEntity } from '../../database/entities/property-status-history.entity.js';
import { PropertyEntity } from '../../database/entities/property.entity.js';
import { UserEntity } from '../../database/entities/user.entity.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { StorageProvider } from '../uploads/storage.interface.js';

export class AdminService {
  constructor(
    private readonly propertyRepo: Repository<PropertyEntity>,
    private readonly imageRepo: Repository<PropertyImageEntity>,
    private readonly userRepo: Repository<UserEntity>,
    private readonly inquiryRepo: Repository<InquiryEntity>,
    private readonly historyRepo: Repository<PropertyStatusHistoryEntity>,
    private readonly auditRepo: Repository<AdminAuditLogEntity>,
    private readonly storage: StorageProvider,
  ) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const totalProperties = await this.propertyRepo.count();
    const publishedProperties = await this.propertyRepo.count({
      where: { status: 'published' },
    });
    const pendingReviewProperties = await this.propertyRepo.count({
      where: { status: 'draft' },
    });
    const unpublishedProperties = await this.propertyRepo.count({
      where: { status: 'unpublished' },
    });
    const totalUsers = await this.userRepo.count();
    const totalInquiries = await this.inquiryRepo.count();

    return {
      totalProperties,
      publishedProperties,
      pendingReviewProperties,
      unpublishedProperties,
      totalUsers,
      totalInquiries,
    };
  }

  async getProperties(query: AdminPropertiesQuery): Promise<{ items: AdminPropertyItem[]; total: number }> {
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.owner', 'owner')
      .where('p.deletedAt IS NULL');

    if (query.status && query.status !== 'all') {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    if (query.city) {
      qb.andWhere('LOWER(p.city) = LOWER(:city)', { city: query.city });
    }

    if (query.propertyType) {
      qb.andWhere('p.propertyType = :propertyType', { propertyType: query.propertyType });
    }

    if (query.listingType) {
      qb.andWhere('p.listingType = :listingType', { listingType: query.listingType });
    }

    if (query.q) {
      qb.andWhere(
        '(p.title ILIKE :q OR p.locality ILIKE :q OR p.city ILIKE :q OR owner.fullName ILIKE :q OR owner.email ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    qb.orderBy('p.createdAt', 'DESC');
    qb.take(query.limit);

    const [entities, total] = await qb.getManyAndCount();

    // Fetch primary images for these properties
    const propertyIds = entities.map((e) => e.id);
    const images =
      propertyIds.length > 0
        ? await this.imageRepo
            .createQueryBuilder('img')
            .where('img.propertyId IN (:...propertyIds)', { propertyIds })
            .orderBy('img.isPrimary', 'DESC')
            .addOrderBy('img.displayOrder', 'ASC')
            .getMany()
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (!imageMap.has(img.propertyId)) {
        imageMap.set(img.propertyId, this.storage.getPublicUrl(img.storageKey));
      }
    }

    const items: AdminPropertyItem[] = entities.map((p) => ({
      id: p.id,
      ownerId: p.ownerId,
      title: p.title,
      slug: p.slug,
      description: p.description,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: Number(p.price),
      city: p.city,
      locality: p.locality,
      address: p.address,
      pincode: p.pincode,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqft: p.areaSqft,
      status: p.status,
      primaryImageUrl: imageMap.get(p.id) ?? null,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      owner: {
        id: p.owner!.id,
        fullName: p.owner!.fullName,
        email: p.owner!.email,
        mobileNumber: p.owner!.mobileNumber,
      },
    }));

    return { items, total };
  }

  async getPropertyById(propertyId: string) {
    const property = await this.propertyRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.owner', 'owner')
      .where('p.id = :propertyId AND p.deletedAt IS NULL', { propertyId })
      .getOne();

    if (!property) {
      throw AppError.notFound('Property not found.');
    }

    const images = await this.imageRepo.find({
      where: { propertyId },
      order: { isPrimary: 'DESC', displayOrder: 'ASC' },
    });

    const history = await this.historyRepo
      .createQueryBuilder('h')
      .innerJoinAndSelect('h.user', 'u')
      .where('h.propertyId = :propertyId', { propertyId })
      .orderBy('h.createdAt', 'DESC')
      .getMany();

    return {
      ...property,
      price: Number(property.price),
      images: images.map((img) => ({
        id: img.id,
        url: this.storage.getPublicUrl(img.storageKey),
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
      })),
      history: history.map((h) => ({
        id: h.id,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        changedBy: h.user?.fullName ?? 'Admin',
        remarks: h.remarks,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async moderateProperty(
    propertyId: string,
    action: ModeratePropertyAction,
    remarks: string | undefined,
    adminUser: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const property = await this.propertyRepo.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw AppError.notFound('Property not found.');
    }

    const oldStatus = property.status;
    let newStatus: 'published' | 'draft' | 'unpublished';

    switch (action) {
      case 'approve':
        if (oldStatus === 'published') {
          throw AppError.badRequest('Property is already approved and published.');
        }
        newStatus = 'published';
        property.publishedAt = new Date();
        break;
      case 'reject':
        newStatus = 'unpublished';
        break;
      case 'request_changes':
        newStatus = 'draft';
        break;
      default:
        throw AppError.badRequest('Invalid moderation action.');
    }

    property.status = newStatus;

    return await this.propertyRepo.manager.transaction(async (tx) => {
      // 1. Update property
      const savedProperty = await tx.save(property);

      // 2. Insert into property_status_history
      const historyEntry = this.historyRepo.create({
        propertyId,
        oldStatus,
        newStatus,
        changedBy: adminUser.id,
        remarks: remarks || `Action: ${action}`,
      });
      await tx.save(historyEntry);

      // 3. Log into admin_audit_logs
      const auditLog = this.auditRepo.create({
        actorUserId: adminUser.id,
        action: `PROPERTY_MODERATE_${action.toUpperCase()}`,
        entityType: 'property',
        entityId: propertyId,
        oldValues: { status: oldStatus },
        newValues: { status: newStatus, remarks },
        ipAddress: ipAddress ?? null,
      });
      await tx.save(auditLog);

      return {
        id: savedProperty.id,
        status: savedProperty.status,
        publishedAt: savedProperty.publishedAt,
        message: `Property successfully updated to ${newStatus}.`,
      };
    });
  }
}
