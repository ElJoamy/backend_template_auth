import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { BaseModel } from './base_model';
import { setupLogger } from '../../../utils/logger';
import type { AppSettings } from '../../../config/settings';
import { getAppSettings } from '../../../config/settings';
import { RoleName } from '../../../schemas/roles';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

@Entity({ name: 'roles' })
@Unique(['name'])
export class Role extends BaseModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: RoleName })
  name!: RoleName;

  @Column({ type: 'varchar', length: 255, nullable: false })
  description!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

logger.info('Role entity declared with fixed enum and descriptions.');