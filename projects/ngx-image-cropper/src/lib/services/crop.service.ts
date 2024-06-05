import { Injectable } from '@angular/core';
import { CropperOptions, CropperPosition, ImageCroppedEvent } from '../interfaces';
import { CropperState } from '../component/cropper.state';
import { resizeCanvas } from '../utils/resize.utils';
import { percentage } from '../utils/percentage.utils';
import { OutputType } from '../interfaces/cropper-options.interface';

@Injectable({providedIn: 'root'})
export class CropService {

  crop(cropperState: CropperState, output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(cropperState: CropperState, output: 'base64'): ImageCroppedEvent | null;
  crop(cropperState: CropperState, output: OutputType): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    const imagePosition = this.getImagePosition(cropperState);
    const width = imagePosition.x2 - imagePosition.x1;
    const height = imagePosition.y2 - imagePosition.y1;
    const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    if (cropperState.options.backgroundColor != null) {
      ctx.fillStyle = cropperState.options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const scaleX = (cropperState.transform.scale || 1) * (cropperState.transform.flipH ? -1 : 1);
    const scaleY = (cropperState.transform.scale || 1) * (cropperState.transform.flipV ? -1 : 1);
    const {translateH, translateV} = this.getCanvasTranslate(cropperState);

    const transformedImage = cropperState.loadedImage!.transformed;
    ctx.setTransform(scaleX, 0, 0, scaleY, transformedImage.size.width / 2 + translateH, transformedImage.size.height / 2 + translateV);
    ctx.translate(-imagePosition.x1 / scaleX, -imagePosition.y1 / scaleY);
    ctx.rotate((cropperState.transform.rotate || 0) * Math.PI / 180);

    ctx.drawImage(
      transformedImage.image,
      -transformedImage.size.width / 2,
      -transformedImage.size.height / 2
    );

    const result: ImageCroppedEvent = {
      width, height,
      imagePosition,
      cropperPosition: {...cropperState.cropper}
    };
    if (cropperState.options.containWithinAspectRatio) {
      result.offsetImagePosition = this.getOffsetImagePosition(cropperState);
    }
    const resizeRatio = this.getResizeRatio(width, height, cropperState.options);
    if (resizeRatio !== 1) {
      result.width = Math.round(width * resizeRatio);
      result.height = cropperState.options.maintainAspectRatio
        ? Math.round(result.width / cropperState.options.aspectRatio)
        : Math.round(height * resizeRatio);
      resizeCanvas(cropCanvas, result.width, result.height);
    }
    if (output === 'blob') {
      return this.cropToBlob(result, cropCanvas, cropperState);
    } else {
      result.base64 = cropCanvas.toDataURL('image/' + cropperState.options.format, this.getQuality(cropperState.options));
      return result;
    }
  }

  private async cropToBlob(output: ImageCroppedEvent, cropCanvas: HTMLCanvasElement, cropperState: CropperState): Promise<ImageCroppedEvent> {
    output.blob = await new Promise<Blob | null>(resolve => cropCanvas.toBlob(resolve, 'image/' + cropperState.options.format, this.getQuality(cropperState.options)));
    if (output.blob) {
      output.objectUrl = URL.createObjectURL(output.blob);
    }
    return output;
  }

  private getCanvasTranslate(cropperState: CropperState): { translateH: number, translateV: number } {
    if (cropperState.transform.translateUnit === 'px') {
      const ratio = this.getRatio(cropperState);
      return {
        translateH: (cropperState.transform.translateH || 0) * ratio,
        translateV: (cropperState.transform.translateV || 0) * ratio
      };
    } else {
      return {
        translateH: cropperState.transform.translateH ? percentage(cropperState.transform.translateH, cropperState.loadedImage!.transformed.size.width) : 0,
        translateV: cropperState.transform.translateV ? percentage(cropperState.transform.translateV, cropperState.loadedImage!.transformed.size.height) : 0
      };
    }
  }

  private getRatio(cropperState: CropperState): number {
    return cropperState.loadedImage!.transformed.size.width / cropperState.maxSize!.width;
  }

  private getImagePosition(cropperState: CropperState): CropperPosition {
    const ratio = this.getRatio(cropperState);
    const out: CropperPosition = {
      x1: Math.round(cropperState.cropper.x1 * ratio),
      y1: Math.round(cropperState.cropper.y1 * ratio),
      x2: Math.round(cropperState.cropper.x2 * ratio),
      y2: Math.round(cropperState.cropper.y2 * ratio)
    };

    if (!cropperState.options.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, cropperState.loadedImage!.transformed.size.width);
      out.y2 = Math.min(out.y2, cropperState.loadedImage!.transformed.size.height);
    }

    return out;
  }

  private getOffsetImagePosition(cropperState: CropperState): CropperPosition {
    const canvasRotation = cropperState.options.canvasRotation + cropperState.loadedImage!.exifTransform.rotate;
    const ratio = this.getRatio(cropperState);
    let offsetX: number;
    let offsetY: number;

    if (canvasRotation % 2) {
      offsetX = (cropperState.loadedImage!.transformed.size.width - cropperState.loadedImage!.original.size.height) / 2;
      offsetY = (cropperState.loadedImage!.transformed.size.height - cropperState.loadedImage!.original.size.width) / 2;
    } else {
      offsetX = (cropperState.loadedImage!.transformed.size.width - cropperState.loadedImage!.original.size.width) / 2;
      offsetY = (cropperState.loadedImage!.transformed.size.height - cropperState.loadedImage!.original.size.height) / 2;
    }

    const out: CropperPosition = {
      x1: Math.round(cropperState.cropper.x1 * ratio) - offsetX,
      y1: Math.round(cropperState.cropper.y1 * ratio) - offsetY,
      x2: Math.round(cropperState.cropper.x2 * ratio) - offsetX,
      y2: Math.round(cropperState.cropper.y2 * ratio) - offsetY
    };

    if (!cropperState.options.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, cropperState.loadedImage!.transformed.size.width);
      out.y2 = Math.min(out.y2, cropperState.loadedImage!.transformed.size.height);
    }

    return out;
  }

  getResizeRatio(width: number, height: number, options: CropperOptions): number {
    const ratioWidth = options.resizeToWidth / width;
    const ratioHeight = options.resizeToHeight / height;
    const ratios = new Array<number>();

    if (options.resizeToWidth > 0) {
      ratios.push(ratioWidth);
    }
    if (options.resizeToHeight > 0) {
      ratios.push(ratioHeight);
    }

    const result = ratios.length === 0 ? 1 : Math.min(...ratios);

    if (result > 1 && !options.onlyScaleDown) {
      return result;
    }
    return Math.min(result, 1);
  }

  getQuality(options: CropperOptions): number {
    return Math.min(1, Math.max(0, options.imageQuality / 100));
  }
}
