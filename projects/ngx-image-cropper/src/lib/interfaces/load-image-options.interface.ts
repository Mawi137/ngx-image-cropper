import { OutputFormat } from './cropper-options.interface';

export interface LoadImageOptions {
  format?: OutputFormat;
  checkImageType?: boolean;
  canvasRotation?: number;
  containWithinAspectRatio?: boolean;
  aspectRatio?: number;
}
