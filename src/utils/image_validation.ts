import path from 'path';
import { setupLogger } from './logger';
import type { AppSettings } from '../config/settings';
import { getAppSettings } from '../config/settings';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_MIME_TYPES, ImageType } from '../schemas/media/image_types';
import { ValidationError } from './errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

function hasPathTraversal(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('..') || lower.includes('/') || lower.includes('\\');
}

function getExtension(filename: string): string | null {
  const ext = path.extname(filename || '').toLowerCase();
  return ext || null;
}


function detectImageType(buf: Buffer): string {
  if (!buf || buf.length < 12) return 'unknown';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'png';
  }
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = buf.slice(8, 12).toString('ascii').toLowerCase();
    if (brand.includes('heic') || brand.includes('heix') || brand.includes('hevc') || brand.includes('hevx')) {
      return 'heic';
    }
    if (brand.includes('heif') || brand.includes('mif1') || brand.includes('msf1')) {
      return 'heif';
    }
  }
  return 'unknown';
}


export interface UploadLikeFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size?: number;
}

export function validateProfilePhoto(file: UploadLikeFile): Buffer {
  const filename = (file.originalname || '').toLowerCase();

  if (hasPathTraversal(filename)) {
    logger.warn(`❌ Path traversal attempt in filename: ${filename}`);
    throw new ValidationError('Invalid filename.');
  }

  const ext = getExtension(filename);
  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    logger.warn(`❌ Invalid image extension: ${filename}`);
    throw new ValidationError('Only JPG, JPEG, PNG, HEIC or HEIF images are allowed.');
  }

  if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`❌ Invalid MIME type: ${file.mimetype}`);
    throw new ValidationError('Unsupported image content type.');
  }

  const content = file.buffer;
  const size = file.size ?? content.length;
  if (size > MAX_IMAGE_SIZE_BYTES) {
    logger.warn(`❌ Image size exceeds 2MB: ${size} bytes`);
    throw new ValidationError('Image file exceeds the 2MB size limit.');
  }

  const realType = detectImageType(content);
  if (!['jpeg', 'png', 'heic', 'heif'].includes(realType)) {
    logger.warn(`❌ Invalid image content detected: ${realType}`);
    throw new ValidationError('Uploaded file is not a valid image.');
  }

  logger.info(`✅ Image validated: ${filename} (${realType})`);
  return content;
}

export function mapRealTypeToImageEnum(realType: string): ImageType | null {
  switch (realType) {
    case 'jpeg':
      return ImageType.JPEG;
    case 'png':
      return ImageType.PNG;
    case 'heic':
      return ImageType.HEIC;
    case 'heif':
      return ImageType.HEIF;
    default:
      return null;
  }
}