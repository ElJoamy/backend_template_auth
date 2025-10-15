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
import { User } from './user_model';

// Logger por archivo
const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

@Entity({ name: 'sessions' })
export class Session extends BaseModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: false })
  jti!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'expires_at', type: 'datetime', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt?: Date | null;
}

logger.info('Session entity declarada: control de sesiones activas por usuario.');