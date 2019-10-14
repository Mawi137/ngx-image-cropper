import { CropperPosition } from "./cropper-position.interface";
import { Transformations } from './transformations.interfaces';

export interface ImageCroppedEvent {
    base64?: string | null;
    file?: Blob | null;
    width: number;
    height: number;
    cropperPosition: CropperPosition;
    imagePosition: CropperPosition;
    offsetImagePosition?: CropperPosition;
    transform: Transformations;
}
