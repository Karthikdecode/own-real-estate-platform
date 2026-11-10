import { USER_ROLES, type UserRole } from '@real-estate/contracts';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@Unique('uq_users_email', ['email'])
@Unique('uq_users_mobile_number', ['mobileNumber'])
@Check('chk_users_email_lowercase', `"email" = lower("email")`)
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'pk_users' })
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName!: string;

  @Column({ name: 'email', type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'mobile_number', type: 'varchar', length: 16, nullable: true })
  mobileNumber!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: [...USER_ROLES],
    enumName: 'user_role',
    default: 'user',
  })
  role!: UserRole;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt!: Date;
}
