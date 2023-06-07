import { Dimensions } from './dimensions.interface';
import { ExifTransform } from './exif-transform.interface';

export interface LoadedImage {
  original: {
    objectUrl: string;
    image: HTMLImageElement;
    size: Dimensions;
  };
  transformed: {
    objectUrl: string;
    image: HTMLImageElement;
    size: Dimensions;
  };
  exifTransform: ExifTransform;
}
