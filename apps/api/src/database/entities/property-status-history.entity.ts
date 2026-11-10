import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { PropertyEntity } from './property.entity.js';
import { UserEntity } from './user.entity.js';

@Entity({ name: 'property_status_history' })
@Index('idx_property_status_history_prop', ['propertyId', 'createdAt'])
export class PropertyStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'pk_property_status_history' })
  id!: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId!: string;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'property_id', foreignKeyConstraintName: 'fk_property_status_history_property' })
  property?: Relation<PropertyEntity>;

  @Column({ name: 'old_status', type: 'varchar', length: 50 })
  oldStatus!: string;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus!: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'changed_by', foreignKeyConstraintName: 'fk_property_status_history_user' })
  user?: Relation<UserEntity>;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt!: Date;
}

