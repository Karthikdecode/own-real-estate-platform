import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { PropertyEntity } from './property.entity.js';

// Partial unique index (migration only): at most one cover image per property, which lets list
// queries join the cover image without N+1 lookups.
@Index('uq_property_images_primary', { synchronize: false })
@Entity({ name: 'property_images' })
@Unique('uq_property_images_storage_key', ['storageKey'])
@Index('idx_property_images_property_order', ['propertyId', 'displayOrder'])
@Check('chk_property_images_size_positive', `"size_bytes" > 0`)
@Check('chk_property_images_display_order', `"display_order" >= 0`)
@Check(
  'chk_property_images_mime_type',
  `"mime_type" IN ('image/jpeg', 'image/png', 'image/webp')`,
)
export class PropertyImageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'pk_property_images' })
  id!: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId!: string;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'property_id', foreignKeyConstraintName: 'fk_property_images_property' })
  property?: Relation<PropertyEntity>;

  /** Storage object key, never a URL: the storage provider derives public URLs from it. */
  @Column({ name: 'storage_key', type: 'varchar', length: 255 })
  storageKey!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 50 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @Column({ name: 'display_order', type: 'smallint', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt!: Date;
}
