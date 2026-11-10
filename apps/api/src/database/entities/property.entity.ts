import {
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type ListingType,
  type PropertyStatus,
  type PropertyType,
} from '@real-estate/contracts';
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { numericColumnTransformer } from '../column-transformers.js';
import { UserEntity } from './user.entity.js';

/*
 * Partial and expression indexes cannot be expressed by TypeORM. They are created by the
 * migration and declared here with synchronize: false so that migration:generate never drops them.
 * Public indexes cover only live listings (published, not soft-deleted); ascending composites also
 * serve descending keyset sorts through backward scans.
 */
// Owner dashboard keyset (newest first) and owner foreign-key lookups.
@Index('idx_properties_owner_created', { synchronize: false })
// Public search without a city: newest/oldest.
@Index('idx_properties_public_listing_published', { synchronize: false })
// Public search without a city: price sort and budget range.
@Index('idx_properties_public_listing_price', { synchronize: false })
// City search on lower(city): newest/oldest.
@Index('idx_properties_public_city_published', { synchronize: false })
// City search on lower(city): price sort, budget range and similar-property candidates.
@Index('idx_properties_public_city_price', { synchronize: false })
// GIN trigram on (locality || ' ' || city || ' ' || pincode) for ILIKE '%text%' location search.
@Index('idx_properties_public_location_trgm', { synchronize: false })
@Entity({ name: 'properties' })
@Unique('uq_properties_slug', ['slug'])
@Check('chk_properties_price_positive', `"price" > 0`)
@Check('chk_properties_area_positive', `"area_sqft" > 0`)
@Check('chk_properties_bedrooms_range', `"bedrooms" IS NULL OR "bedrooms" BETWEEN 0 AND 20`)
@Check('chk_properties_bathrooms_range', `"bathrooms" IS NULL OR "bathrooms" BETWEEN 0 AND 20`)
@Check('chk_properties_pincode_format', `"pincode" ~ '^[1-9][0-9]{5}$'`)
@Check('chk_properties_coordinates_pair', `("latitude" IS NULL) = ("longitude" IS NULL)`)
@Check('chk_properties_latitude_range', `"latitude" IS NULL OR "latitude" BETWEEN -90 AND 90`)
@Check('chk_properties_longitude_range', `"longitude" IS NULL OR "longitude" BETWEEN -180 AND 180`)
@Check('chk_properties_published_at', `"status" <> 'published' OR "published_at" IS NOT NULL`)
export class PropertyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'pk_properties' })
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'owner_id', foreignKeyConstraintName: 'fk_properties_owner' })
  owner?: Relation<UserEntity>;

  @Column({ name: 'title', type: 'varchar', length: 150 })
  title!: string;

  @Column({ name: 'slug', type: 'varchar', length: 200 })
  slug!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({
    name: 'property_type',
    type: 'enum',
    enum: [...PROPERTY_TYPES],
    enumName: 'property_type',
  })
  propertyType!: PropertyType;

  @Column({ name: 'listing_type', type: 'enum', enum: [...LISTING_TYPES], enumName: 'listing_type' })
  listingType!: ListingType;

  /** Whole INR; the monthly rent for rent listings. */
  @Column({ name: 'price', type: 'bigint', transformer: numericColumnTransformer })
  price!: number;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  city!: string;

  @Column({ name: 'locality', type: 'varchar', length: 150 })
  locality!: string;

  @Column({ name: 'address', type: 'varchar', length: 300 })
  address!: string;

  @Column({ name: 'pincode', type: 'varchar', length: 6 })
  pincode!: string;

  @Column({
    name: 'latitude',
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: numericColumnTransformer,
  })
  latitude!: number | null;

  @Column({
    name: 'longitude',
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: numericColumnTransformer,
  })
  longitude!: number | null;

  @Column({ name: 'bedrooms', type: 'smallint', nullable: true })
  bedrooms!: number | null;

  @Column({ name: 'bathrooms', type: 'smallint', nullable: true })
  bathrooms!: number | null;

  @Column({ name: 'area_sqft', type: 'integer' })
  areaSqft!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: [...PROPERTY_STATUSES],
    enumName: 'property_status',
    default: 'draft',
  })
  status!: PropertyStatus;

  /** Set on the first publish only, so keyset cursors stay stable across unpublish/republish. */
  @Column({ name: 'published_at', type: 'timestamptz', precision: 3, nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', precision: 3 })
  deletedAt!: Date | null;
}
