export enum ImageType {
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  HEIC = 'heic',
  HEIF = 'heif',
}

export const MIME_TYPES: Record<ImageType, string> = {
  [ImageType.JPG]: 'image/jpeg',
  [ImageType.JPEG]: 'image/jpeg',
  [ImageType.PNG]: 'image/png',
  [ImageType.HEIC]: 'image/heic',
  [ImageType.HEIF]: 'image/heif',
};

export const ACCEPTED_IMAGE_TYPES: ImageType[] = [
  ImageType.JPG,
  ImageType.JPEG,
  ImageType.PNG,
  ImageType.HEIC,
  ImageType.HEIF,
];

export const ACCEPTED_MIME_TYPES: string[] = ACCEPTED_IMAGE_TYPES.map(t => MIME_TYPES[t]);

export function isValidImageType(value: string): value is ImageType {
  return Object.values(ImageType).includes(value as ImageType);
}