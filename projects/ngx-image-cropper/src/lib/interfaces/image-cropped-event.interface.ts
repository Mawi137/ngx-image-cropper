import { CropperPosition } from './cropper-position.interface';
import { ExifTransform } from './exif-transform.interface';

export interface ImageCroppedEvent {
    base64?: string | null;
    file?: Blob | null;
    width: number;
    height: number;
    cropperPosition: CropperPosition;
    imagePosition: CropperPosition;
    offsetImagePosition?: CropperPosition;
    exifTransform: ExifTransform;
}
