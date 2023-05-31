import { ImageTransform } from './image-transform.interface';

export interface CropperOptions {
  format: OutputFormat;
  maintainAspectRatio: boolean;
  resetCropOnAspectRatioChange: boolean;
  transform: ImageTransform;
  aspectRatio: number;
  resizeToWidth: number;
  resizeToHeight: number;
  cropperMinWidth: number;
  cropperMinHeight: number;
  cropperMaxHeight: number;
  cropperMaxWidth: number;
  cropperStaticWidth: number;
  cropperStaticHeight: number;
  canvasRotation: number;
  initialStepSize: number;
  roundCropper: boolean;
  onlyScaleDown: boolean;
  imageQuality: number;
  autoCrop: boolean;
  backgroundColor: string;
  containWithinAspectRatio: boolean;
  hideResizeSquares: boolean;
  alignImage: 'left' | 'center';
}

export type OutputFormat = 'png' | 'jpeg' | 'bmp' | 'webp' | 'ico';
export type OutputType = 'base64' | 'blob';
