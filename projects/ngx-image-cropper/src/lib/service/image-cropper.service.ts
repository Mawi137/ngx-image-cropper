import { Injectable } from '@angular/core';
import {CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform} from "../interfaces";
import {resizeCanvas} from "../utils/resize.utils";
import {IDENTITY_IMAGE_TRANSFORM} from "../interfaces/image-transform.interface";

@Injectable({
  providedIn: 'root'
})
export class ImageCropperService {

  constructor() { }

  waitForImageToLoad(img: HTMLImageElement): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
          if (!img.complete) {
              const oldload = img.onload;
              const olderror = img.onerror;
              img.onload = function() { resolve(img); if (oldload) { oldload.bind(this).call(arguments); } };
              img.onerror = function(e) { reject(e); if (olderror) { olderror.bind(this).call(arguments); } };
          } else {
              if (img.naturalHeight !== 0) {
                  resolve(img);
              } else {
                  reject('Image failed to load!');
              }
          }
      });
  }

  async cropAsync(originalImage: HTMLImageElement, area: CropperPosition, transform: ImageTransform = IDENTITY_IMAGE_TRANSFORM, backgroundColor?: string): Promise<HTMLCanvasElement> {
      return this.crop(await this.waitForImageToLoad(originalImage), area, transform, backgroundColor);
  }

  crop(originalImage: HTMLImageElement, area: CropperPosition, transform: ImageTransform = IDENTITY_IMAGE_TRANSFORM, backgroundColor?: string): HTMLCanvasElement {
      const width = area.x2 - area.x1;
      const height = area.y2 - area.y1;

      if (!originalImage.complete) {
          throw new Error('Image to be cropped has not yet completed!');
      }

      const originalSize: Dimensions = {
          width: originalImage.naturalWidth,
          height: originalImage.naturalHeight
      };

      const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
      cropCanvas.width = width;
      cropCanvas.height = height;

      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
          if (backgroundColor != null) {
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, width, height);
          }

          const scaleX = (transform.scale || 1) * (transform.flipH ? -1 : 1);
          const scaleY = (transform.scale || 1) * (transform.flipV ? -1 : 1);

          ctx.setTransform(scaleX, 0, 0, scaleY, originalSize.width / 2, originalSize.height / 2);
          ctx.translate(-area.x1 / scaleX, -area.y1 / scaleY);
          ctx.rotate((transform.rotate || 0) * Math.PI / 180);

          ctx.drawImage(originalImage, -originalSize.width / 2, -originalSize.height / 2);

          return cropCanvas;
      }

      return null;
  }
}
