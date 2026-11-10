import { INQUIRY_STATUSES, type InquiryStatus } from '@real-estate/contracts';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { PropertyEntity } from './property.entity.js';
import { UserEntity } from './user.entity.js';

// Partial unique index (migration only): one open (new/contacted) inquiry per sender and property,
// enforced by the database so concurrent requests cannot create duplicates.
@Index('uq_inquiries_open_per_sender', { synchronize: false })
@Entity({ name: 'inquiries' })
@Index('idx_inquiries_owner_created', ['ownerId', 'createdAt', 'id'])
@Index('idx_inquiries_sender_created', ['senderId', 'createdAt'])
@Index('idx_inquiries_property', ['propertyId'])
@Check('chk_inquiries_not_self', `"sender_id" <> "owner_id"`)
export class InquiryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'pk_inquiries' })
  id!: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId!: string;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'property_id', foreignKeyConstraintName: 'fk_inquiries_property' })
  property?: Relation<PropertyEntity>;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sender_id', foreignKeyConstraintName: 'fk_inquiries_sender' })
  sender?: Relation<UserEntity>;

  /** Copied from properties.owner_id by the service (never from client input): no join for the inbox. */
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'owner_id', foreignKeyConstraintName: 'fk_inquiries_owner' })
  owner?: Relation<UserEntity>;

  @Column({ name: 'message', type: 'varchar', length: 1000 })
  message!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: [...INQUIRY_STATUSES],
    enumName: 'inquiry_status',
    default: 'new',
  })
  status!: InquiryStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt!: Date;
}
