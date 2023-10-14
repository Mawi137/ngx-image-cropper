import { ElementRef, Injectable } from '@angular/core';
import { CropperPosition, Dimensions, ImageCroppedEvent, LoadedImage } from '../interfaces';
import { CropperSettings } from '../interfaces/cropper.settings';
import { resizeCanvas } from '../utils/resize.utils';
import { percentage } from '../utils/percentage.utils';
import { OutputType } from '../interfaces/cropper-options.interface';

@Injectable({providedIn: 'root'})
export class CropService {

  crop(loadedImage: LoadedImage, cropper: CropperPosition, settings: CropperSettings, output: 'blob', maxSize: Dimensions): Promise<ImageCroppedEvent> | null;
  crop(loadedImage: LoadedImage, cropper: CropperPosition, settings: CropperSettings, output: 'base64', maxSize: Dimensions): ImageCroppedEvent | null;
  crop(loadedImage: LoadedImage, cropper: CropperPosition, settings: CropperSettings, output: OutputType, maxSize: Dimensions): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    const imagePosition = this.getImagePosition(loadedImage, cropper, settings, maxSize);
    const width = imagePosition.x2 - imagePosition.x1;
    const height = imagePosition.y2 - imagePosition.y1;
    const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    if (settings.backgroundColor != null) {
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const scaleX = (settings.transform.scale || 1) * (settings.transform.flipH ? -1 : 1);
    const scaleY = (settings.transform.scale || 1) * (settings.transform.flipV ? -1 : 1);
    const {translateH, translateV} = this.getCanvasTranslate(loadedImage, settings, maxSize);

    const transformedImage = loadedImage.transformed;
    ctx.setTransform(scaleX, 0, 0, scaleY, transformedImage.size.width / 2 + translateH, transformedImage.size.height / 2 + translateV);
    ctx.translate(-imagePosition.x1 / scaleX, -imagePosition.y1 / scaleY);
    ctx.rotate((settings.transform.rotate || 0) * Math.PI / 180);

    ctx.drawImage(
      transformedImage.image,
      -transformedImage.size.width / 2,
      -transformedImage.size.height / 2
    );

    const result: ImageCroppedEvent = {
      width, height,
      imagePosition,
      cropperPosition: {...cropper}
    };
    if (settings.containWithinAspectRatio) {
      result.offsetImagePosition = this.getOffsetImagePosition(loadedImage, cropper, settings, maxSize);
    }
    const resizeRatio = this.getResizeRatio(width, height, settings);
    if (resizeRatio !== 1) {
      result.width = Math.round(width * resizeRatio);
      result.height = settings.maintainAspectRatio
        ? Math.round(result.width / settings.aspectRatio)
        : Math.round(height * resizeRatio);
      resizeCanvas(cropCanvas, result.width, result.height);
    }
    if (output === 'blob') {
      return this.cropToBlob(result, cropCanvas, settings);
    } else {
      result.base64 = cropCanvas.toDataURL('image/' + settings.format, this.getQuality(settings));
      return result;
    }
  }

  private async cropToBlob(output: ImageCroppedEvent, cropCanvas: HTMLCanvasElement, settings: CropperSettings): Promise<ImageCroppedEvent> {
    output.blob = await new Promise<Blob | null>(resolve => cropCanvas.toBlob(resolve, 'image/' + settings.format, this.getQuality(settings)));
    if (output.blob) {
      output.objectUrl = URL.createObjectURL(output.blob);
    }
    return output;
  }

  private getCanvasTranslate(loadedImage: LoadedImage, settings: CropperSettings, maxSize: Dimensions): { translateH: number, translateV: number } {
    if (settings.transform.translateUnit === 'px') {
      const ratio = this.getRatio(loadedImage, maxSize);
      return {
        translateH: (settings.transform.translateH || 0) * ratio,
        translateV: (settings.transform.translateV || 0) * ratio
      };
    } else {
      return {
        translateH: settings.transform.translateH ? percentage(settings.transform.translateH, loadedImage.transformed.size.width) : 0,
        translateV: settings.transform.translateV ? percentage(settings.transform.translateV, loadedImage.transformed.size.height) : 0
      };
    }
  }

  private getRatio(loadedImage: LoadedImage, maxSize: Dimensions): number {
    return loadedImage.transformed.size.width / maxSize.width;
  }

  private getImagePosition(loadedImage: LoadedImage, cropper: CropperPosition, settings: CropperSettings, maxSize: Dimensions): CropperPosition {
    const ratio = this.getRatio(loadedImage, maxSize);
    const out: CropperPosition = {
      x1: Math.round(cropper.x1 * ratio),
      y1: Math.round(cropper.y1 * ratio),
      x2: Math.round(cropper.x2 * ratio),
      y2: Math.round(cropper.y2 * ratio)
    };

    if (!settings.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, loadedImage.transformed.size.width);
      out.y2 = Math.min(out.y2, loadedImage.transformed.size.height);
    }

    return out;
  }

  private getOffsetImagePosition(loadedImage: LoadedImage, cropper: CropperPosition, settings: CropperSettings, maxSize: Dimensions): CropperPosition {
    const canvasRotation = settings.canvasRotation + loadedImage.exifTransform.rotate;
    const ratio = this.getRatio(loadedImage, maxSize);
    let offsetX: number;
    let offsetY: number;

    if (canvasRotation % 2) {
      offsetX = (loadedImage.transformed.size.width - loadedImage.original.size.height) / 2;
      offsetY = (loadedImage.transformed.size.height - loadedImage.original.size.width) / 2;
    } else {
      offsetX = (loadedImage.transformed.size.width - loadedImage.original.size.width) / 2;
      offsetY = (loadedImage.transformed.size.height - loadedImage.original.size.height) / 2;
    }

    const out: CropperPosition = {
      x1: Math.round(cropper.x1 * ratio) - offsetX,
      y1: Math.round(cropper.y1 * ratio) - offsetY,
      x2: Math.round(cropper.x2 * ratio) - offsetX,
      y2: Math.round(cropper.y2 * ratio) - offsetY
    };

    if (!settings.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, loadedImage.transformed.size.width);
      out.y2 = Math.min(out.y2, loadedImage.transformed.size.height);
    }

    return out;
  }

  getResizeRatio(width: number, height: number, settings: CropperSettings): number {
    const ratioWidth = settings.resizeToWidth / width;
    const ratioHeight = settings.resizeToHeight / height;
    const ratios = new Array<number>();

    if (settings.resizeToWidth > 0) {
      ratios.push(ratioWidth);
    }
    if (settings.resizeToHeight > 0) {
      ratios.push(ratioHeight);
    }

    const result = ratios.length === 0 ? 1 : Math.min(...ratios);

    if (result > 1 && !settings.onlyScaleDown) {
      return result;
    }
    return Math.min(result, 1);
  }

  getQuality(settings: CropperSettings): number {
    return Math.min(1, Math.max(0, settings.imageQuality / 100));
  }
}
