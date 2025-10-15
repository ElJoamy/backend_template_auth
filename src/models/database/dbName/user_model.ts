import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseModel } from './base_model';
import { setupLogger } from '../../../utils/logger';
import type { AppSettings } from '../../../config/settings';
import { getAppSettings } from '../../../config/settings';
import { Role } from './role_model';
import { ImageType } from '../../../schemas/media/image_types';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

@Entity({ name: 'users' })
export class User extends BaseModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  lastname!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80, nullable: false })
  username!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120, nullable: false })
  email!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: false })
  phone!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: false })
  passwordHash!: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @Column({ name: 'avatar_type', type: 'enum', enum: ImageType, nullable: true })
  avatarType?: ImageType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

logger.info('User entity declared: ready for TypeORM sync/use.');