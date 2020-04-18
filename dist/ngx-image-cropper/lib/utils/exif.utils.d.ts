import { ExifTransform } from '../interfaces/exif-transform.interface';
export declare function supportsAutomaticRotation(): Promise<boolean>;
export declare function getTransformationsFromExifData(exifRotationOrBase64Image: number | string): ExifTransform;
