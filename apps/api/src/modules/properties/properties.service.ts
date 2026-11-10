import { randomBytes } from 'node:crypto';
import type {
  CreatePropertyRequest,
  MyListingsQuery,
  OwnerPropertySummary,
  PropertyDetail,
  PropertyImage,
  PropertySearchQuery,
  PropertyStatus,
  PropertySummary,
  UpdatePropertyRequest,
} from '@real-estate/contracts';
import { In, type Repository, type SelectQueryBuilder } from 'typeorm';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error.js';
import type { CursorPage } from '../../common/types/pagination.types.js';
import { PropertyImageEntity } from '../../database/entities/property-image.entity.js';
import { PropertyEntity } from '../../database/entities/property.entity.js';
import {
  createKeysetCursorSchema,
  decodeCursor,
  getKeysetFetchLimit,
  toCursorPage,
} from '../../utils/pagination.js';
import type { StorageProvider } from '../uploads/storage.interface.js';

const propertyCursorSchema = createKeysetCursorSchema(
  z.enum(['newest', 'price_asc', 'price_desc']),
);

const ownerCursorSchema = createKeysetCursorSchema(z.literal('newest'));

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class PropertiesService {
  constructor(
    private readonly propertyRepo: Repository<PropertyEntity>,
    private readonly imageRepo: Repository<PropertyImageEntity>,
    private readonly storage: StorageProvider,
  ) {}

  async search(query: PropertySearchQuery): Promise<CursorPage<PropertySummary>> {
    const listingType = query.listingType ?? 'sale';
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'published' })
      .andWhere('p.listing_type = :listingType', { listingType });

    if (query.city) {
      qb.andWhere('LOWER(p.city) = LOWER(:city)', { city: query.city });
    }

    if (query.q) {
      qb.andWhere(
        '(p.locality ILIKE :search OR p.city ILIKE :search OR p.pincode ILIKE :search OR p.title ILIKE :search)',
        { search: `%${query.q}%` },
      );
    }

    if (query.propertyType && query.propertyType.length > 0) {
      qb.andWhere('p.property_type IN (:...propertyTypes)', {
        propertyTypes: query.propertyType,
      });
    }

    if (query.bedrooms && query.bedrooms.length > 0) {
      qb.andWhere('p.bedrooms IN (:...bedrooms)', { bedrooms: query.bedrooms });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    const sort = query.sort ?? 'newest';
    if (query.cursor) {
      const cursor = decodeCursor(query.cursor, propertyCursorSchema);
      if (sort === 'newest') {
        qb.andWhere('(p.published_at, p.id) < (:val, :id)', {
          val: new Date(cursor.value),
          id: cursor.id,
        });
      } else if (sort === 'price_asc') {
        qb.andWhere('(p.price, p.id) > (:val, :id)', { val: cursor.value, id: cursor.id });
      } else if (sort === 'price_desc') {
        qb.andWhere('(p.price, p.id) < (:val, :id)', { val: cursor.value, id: cursor.id });
      }
    }

    if (sort === 'newest') {
      qb.orderBy('p.published_at', 'DESC').addOrderBy('p.id', 'DESC');
    } else if (sort === 'price_asc') {
      qb.orderBy('p.price', 'ASC').addOrderBy('p.id', 'ASC');
    } else if (sort === 'price_desc') {
      qb.orderBy('p.price', 'DESC').addOrderBy('p.id', 'DESC');
    }

    const limit = Number(query.limit) || 20;
    const fetchLimit = getKeysetFetchLimit(limit);
    qb.limit(fetchLimit);

    const properties = await qb.getMany();

    // Batch load primary images for results to avoid N+1 queries
    const propertyIds = properties.map((p) => p.id);
    const primaryImages =
      propertyIds.length > 0
        ? await this.imageRepo.find({
            where: { propertyId: In(propertyIds), isPrimary: true },
          })
        : [];

    const imageMap = new Map<string, string>();
    for (const img of primaryImages) {
      imageMap.set(img.propertyId, this.storage.getPublicUrl(img.storageKey));
    }

    const summaries: PropertySummary[] = properties.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: p.price,
      city: p.city,
      locality: p.locality,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqft: p.areaSqft,
      primaryImageUrl: imageMap.get(p.id) ?? null,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    }));

    return toCursorPage(summaries, limit, (last) => {
      let value: string | number;
      if (sort === 'newest') {
        value = last.publishedAt ?? new Date().toISOString();
      } else {
        value = last.price;
      }
      return { v: 1, sort, value, id: last.id };
    });
  }

  async getBySlug(slug: string): Promise<PropertyDetail> {
    const property = await this.propertyRepo.findOne({
      where: { slug, status: 'published' },
    });

    if (!property) {
      throw AppError.notFound('Property');
    }

    return this.mapToDetail(property);
  }

  async getSimilar(propertyId: string, limit = 4): Promise<PropertySummary[]> {
    const target = await this.propertyRepo.findOneBy({ id: propertyId });
    if (!target) {
      throw AppError.notFound('Property');
    }

    const minPrice = Math.floor(target.price * 0.6);
    const maxPrice = Math.ceil(target.price * 1.4);

    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.id != :propertyId', { propertyId })
      .andWhere('p.status = :status', { status: 'published' })
      .andWhere('p.city = :city', { city: target.city })
      .andWhere('p.listing_type = :listingType', { listingType: target.listingType })
      .andWhere('p.property_type = :propertyType', { propertyType: target.propertyType })
      .andWhere('p.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice })
      .orderBy(`ABS(p.price - ${target.price})`, 'ASC')
      .limit(limit);

    const similar = await qb.getMany();

    const ids = similar.map((p) => p.id);
    const images =
      ids.length > 0
        ? await this.imageRepo.find({
            where: { propertyId: In(ids), isPrimary: true },
          })
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      imageMap.set(img.propertyId, this.storage.getPublicUrl(img.storageKey));
    }

    return similar.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: p.price,
      city: p.city,
      locality: p.locality,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqft: p.areaSqft,
      primaryImageUrl: imageMap.get(p.id) ?? null,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    }));
  }

  async create(ownerId: string, input: CreatePropertyRequest): Promise<PropertyDetail> {
    const { images, ...propertyData } = input as any;
    const baseSlug = `${slugify(input.title)}-${slugify(input.city)}-${randomBytes(4).toString('hex')}`;

    const property = new PropertyEntity();
    Object.assign(property, propertyData, {
      ownerId,
      slug: baseSlug,
      status: 'published',
      publishedAt: new Date(),
    });

    const savedProperty = await this.propertyRepo.save(property);

    if (Array.isArray(images) && images.length > 0) {
      const imageEntities: PropertyImageEntity[] = [];

      for (let index = 0; index < Math.min(images.length, 4); index++) {
        const rawImg = images[index];
        if (typeof rawImg !== 'string' || !rawImg.trim()) continue;

        let storageKey = rawImg.trim();
        let mimeType: string = 'image/jpeg';
        let sizeBytes = 1024 * 150;

        // Check if image is a base64 data URL (e.g. data:image/jpeg;base64,...)
        const dataUrlMatch = storageKey.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUrlMatch && dataUrlMatch[1] && dataUrlMatch[2]) {
          const rawMime = dataUrlMatch[1].toLowerCase();
          const base64Data = dataUrlMatch[2];
          const buffer = Buffer.from(base64Data, 'base64');
          sizeBytes = buffer.byteLength;

          const ext = rawMime.includes('png') ? 'png' : rawMime.includes('webp') ? 'webp' : 'jpg';
          mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

          const safeKey = `properties/${savedProperty.id}/${index}-${randomBytes(4).toString('hex')}.${ext}`;
          try {
            await this.storage.putObject({
              key: safeKey,
              body: buffer,
              contentType: mimeType,
            });
            storageKey = safeKey;
          } catch {
            // If storage fails, fallback to standard key
            storageKey = safeKey;
          }
        } else {
          // Normal URL (e.g. Unsplash presets)
          if (storageKey.includes('.png')) mimeType = 'image/png';
          else if (storageKey.includes('.webp')) mimeType = 'image/webp';
          else mimeType = 'image/jpeg';

          if (storageKey.length > 250) {
            storageKey = storageKey.substring(0, 250);
          }
        }

        imageEntities.push(
          this.imageRepo.create({
            propertyId: savedProperty.id,
            storageKey,
            mimeType,
            sizeBytes,
            displayOrder: index,
            isPrimary: index === 0,
          }),
        );
      }

      if (imageEntities.length > 0) {
        await this.imageRepo.save(imageEntities);
      }
    }

    return this.mapToDetail(savedProperty);
  }

  async update(
    ownerId: string,
    propertyId: string,
    input: UpdatePropertyRequest,
  ): Promise<PropertyDetail> {
    const property = await this.propertyRepo.findOneBy({ id: propertyId });
    if (!property) {
      throw AppError.notFound('Property');
    }

    if (property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to edit this property.');
    }

    Object.assign(property, input);
    await this.propertyRepo.save(property);
    return this.mapToDetail(property);
  }

  async updateStatus(
    ownerId: string,
    propertyId: string,
    status: PropertyStatus,
  ): Promise<PropertyDetail> {
    const property = await this.propertyRepo.findOneBy({ id: propertyId });
    if (!property) {
      throw AppError.notFound('Property');
    }

    if (property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to update this property status.');
    }

    property.status = status;
    if (status === 'published' && !property.publishedAt) {
      property.publishedAt = new Date();
    }

    await this.propertyRepo.save(property);
    return this.mapToDetail(property);
  }

  async delete(ownerId: string, propertyId: string): Promise<void> {
    const property = await this.propertyRepo.findOneBy({ id: propertyId });
    if (!property) {
      throw AppError.notFound('Property');
    }

    if (property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to delete this property.');
    }

    await this.propertyRepo.softDelete(propertyId);
  }

  async getMyListings(
    ownerId: string,
    query: Partial<MyListingsQuery> = {},
  ): Promise<CursorPage<OwnerPropertySummary>> {
    const limit = Number(query.limit) || 12;
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.owner_id = :ownerId', { ownerId });

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    if (query.cursor) {
      const cursor = decodeCursor(query.cursor, ownerCursorSchema);
      qb.andWhere('(p.created_at, p.id) < (:val, :id)', {
        val: new Date(cursor.value),
        id: cursor.id,
      });
    }

    qb.orderBy('p.created_at', 'DESC').addOrderBy('p.id', 'DESC');
    qb.limit(getKeysetFetchLimit(limit));

    const properties = await qb.getMany();

    const ids = properties.map((p) => p.id);
    const images =
      ids.length > 0
        ? await this.imageRepo.find({
            where: { propertyId: In(ids), isPrimary: true },
          })
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      imageMap.set(img.propertyId, this.storage.getPublicUrl(img.storageKey));
    }

    const summaries: OwnerPropertySummary[] = properties.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: p.price,
      city: p.city,
      locality: p.locality,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqft: p.areaSqft,
      primaryImageUrl: imageMap.get(p.id) ?? null,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return toCursorPage(summaries, limit, (last) => ({
      v: 1,
      sort: 'newest',
      value: last.createdAt,
      id: last.id,
    }));
  }

  async getMyListingById(ownerId: string, propertyId: string): Promise<PropertyDetail> {
    const property = await this.propertyRepo.findOneBy({ id: propertyId, ownerId });
    if (!property) {
      throw AppError.notFound('Property');
    }
    return this.mapToDetail(property);
  }

  private async mapToDetail(p: PropertyEntity): Promise<PropertyDetail> {
    const images = await this.imageRepo.find({
      where: { propertyId: p.id },
      order: { displayOrder: 'ASC' },
    });

    const mappedImages: PropertyImage[] = images.map((img) => ({
      id: img.id,
      url: this.storage.getPublicUrl(img.storageKey),
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    }));

    const primaryImg = images.find((i) => i.isPrimary) ?? images[0];

    return {
      id: p.id,
      slug: p.slug,
      ownerId: p.ownerId,
      title: p.title,
      description: p.description,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: p.price,
      city: p.city,
      locality: p.locality,
      address: p.address,
      pincode: p.pincode,
      latitude: p.latitude,
      longitude: p.longitude,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqft: p.areaSqft,
      status: p.status,
      primaryImageUrl: primaryImg ? this.storage.getPublicUrl(primaryImg.storageKey) : null,
      images: mappedImages,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
