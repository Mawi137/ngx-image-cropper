import { CropperPosition } from './cropper-position.interface';
import { Dimensions } from './dimensions.interface';
import { ImageTransform } from './image-transform.interface';
import { LoadedImage } from './loaded-image.interface';
import { OutputFormat } from './cropper-options.interface';

export interface CropInput {
  loadedImage: LoadedImage;
  cropper: CropperPosition;
  maxSize: Dimensions;
  transform?: ImageTransform;
  options?: {
    backgroundColor?: string;
    containWithinAspectRatio?: boolean;
    maintainAspectRatio?: boolean;
    aspectRatio?: number;
    format?: OutputFormat;
    canvasRotation?: number;
    imageQuality?: number;
    resizeToWidth?: number;
    resizeToHeight?: number;
    onlyScaleDown?: boolean;
  };
}
