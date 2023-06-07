import { CropperPosition } from './cropper-position.interface';

export interface ImageCroppedEvent {
  base64?: string | null;
  blob?: Blob | null;
  objectUrl?: string | null;
  width: number;
  height: number;
  cropperPosition: CropperPosition;
  imagePosition: CropperPosition;
  offsetImagePosition?: CropperPosition;
}
