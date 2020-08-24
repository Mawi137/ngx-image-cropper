import { CropperPosition } from './cropper-position.interface';

export interface CropperMovedEvent {
    width: number;
    height: number;
    cropperPosition: CropperPosition;
    imagePosition: CropperPosition;
    offsetImagePosition?: CropperPosition;
}
