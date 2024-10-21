import { Injectable } from '@angular/core';
import { CropperPosition, ImageCroppedEvent } from '../interfaces';
import { resizeCanvas } from '../utils/resize.utils';
import { percentage } from '../utils/percentage.utils';
import { OutputType } from '../interfaces/image-cropper-settings';
import { ImageCropperState } from '../state/image-cropper-state';

@Injectable({providedIn: 'root'})
export class CropService {

  crop(state: ImageCropperState, output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(state: ImageCropperState, output: 'base64'): ImageCroppedEvent | null;
  crop(state: ImageCropperState, output: OutputType): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    const imagePosition = this.getImagePosition(state);
    const width = imagePosition.x2 - imagePosition.x1;
    const height = imagePosition.y2 - imagePosition.y1;
    const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    if (state.backgroundColor != null) {
      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const scaleX = state.transform.scale * (state.transform.flipX ? -1 : 1);
    const scaleY = state.transform.scale * (state.transform.flipY ? -1 : 1);
    const {translateX, translateY} = this.getCanvasTranslate(state);

    const transformedImage = state.loadedImage!.transformed;
    ctx.setTransform(scaleX, 0, 0, scaleY, transformedImage.size.width / 2 + translateX, transformedImage.size.height / 2 + translateY);
    ctx.translate(-imagePosition.x1 / scaleX, -imagePosition.y1 / scaleY);
    ctx.rotate(state.transform.rotate * Math.PI / 180);

    ctx.drawImage(
      transformedImage.image,
      -transformedImage.size.width / 2,
      -transformedImage.size.height / 2
    );

    const result: ImageCroppedEvent = {
      width, height,
      imagePosition,
      cropperPosition: {...state.cropper}
    };
    if (state.containWithinAspectRatio) {
      result.offsetImagePosition = this.getOffsetImagePosition(state);
    }
    const resizeRatio = this.getResizeRatio(width, height, state);
    if (resizeRatio !== 1) {
      result.width = Math.round(width * resizeRatio);
      result.height = state.maintainAspectRatio
        ? Math.round(result.width / state.aspectRatio)
        : Math.round(height * resizeRatio);
      resizeCanvas(cropCanvas, result.width, result.height);
    }
    if (output === 'blob') {
      return this.cropToBlob(result, cropCanvas, state);
    } else {
      result.base64 = cropCanvas.toDataURL('image/' + state.format, this.getQuality(state));
      return result;
    }
  }

  private async cropToBlob(output: ImageCroppedEvent, cropCanvas: HTMLCanvasElement, state: ImageCropperState): Promise<ImageCroppedEvent> {
    output.blob = await new Promise<Blob | null>(resolve => cropCanvas.toBlob(resolve, 'image/' + state.format, this.getQuality(state)));
    if (output.blob) {
      output.objectUrl = URL.createObjectURL(output.blob);
    }
    return output;
  }

  private getCanvasTranslate(state: ImageCropperState): { translateX: number, translateY: number } {
    if (state.transform.translateUnit === 'px') {
      const ratio = this.getRatio(state);
      return {
        translateX: state.transform.translateX * ratio,
        translateY: state.transform.translateY * ratio
      };
    } else {
      return {
        translateX: state.transform.translateX ? percentage(state.transform.translateX, state.loadedImage!.transformed.size.width) : 0,
        translateY: state.transform.translateY ? percentage(state.transform.translateY, state.loadedImage!.transformed.size.height) : 0
      };
    }
  }

  private getRatio(state: ImageCropperState): number {
    return state.loadedImage!.transformed.size.width / state.maxSize.width;
  }

  private getImagePosition(state: ImageCropperState): CropperPosition {
    const ratio = this.getRatio(state);
    const out: CropperPosition = {
      x1: Math.round(state.cropper.x1 * ratio),
      y1: Math.round(state.cropper.y1 * ratio),
      x2: Math.round(state.cropper.x2 * ratio),
      y2: Math.round(state.cropper.y2 * ratio)
    };

    if (!state.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, state.loadedImage!.transformed.size.width);
      out.y2 = Math.min(out.y2, state.loadedImage!.transformed.size.height);
    }

    return out;
  }

  private getOffsetImagePosition(state: ImageCropperState): CropperPosition {
    const canvasRotation = state.canvasRotation + state.loadedImage!.exifTransform.rotate;
    const ratio = this.getRatio(state);
    let offsetX: number;
    let offsetY: number;

    if (canvasRotation % 2) {
      offsetX = (state.loadedImage!.transformed.size.width - state.loadedImage!.original.size.height) / 2;
      offsetY = (state.loadedImage!.transformed.size.height - state.loadedImage!.original.size.width) / 2;
    } else {
      offsetX = (state.loadedImage!.transformed.size.width - state.loadedImage!.original.size.width) / 2;
      offsetY = (state.loadedImage!.transformed.size.height - state.loadedImage!.original.size.height) / 2;
    }

    const out: CropperPosition = {
      x1: Math.round(state.cropper.x1 * ratio) - offsetX,
      y1: Math.round(state.cropper.y1 * ratio) - offsetY,
      x2: Math.round(state.cropper.x2 * ratio) - offsetX,
      y2: Math.round(state.cropper.y2 * ratio) - offsetY
    };

    if (!state.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, state.loadedImage!.transformed.size.width);
      out.y2 = Math.min(out.y2, state.loadedImage!.transformed.size.height);
    }

    return out;
  }

  getResizeRatio(width: number, height: number, state: ImageCropperState): number {
    const ratioWidth = state.resizeToWidth / width;
    const ratioHeight = state.resizeToHeight / height;
    const ratios = new Array<number>();

    if (state.resizeToWidth > 0) {
      ratios.push(ratioWidth);
    }
    if (state.resizeToHeight > 0) {
      ratios.push(ratioHeight);
    }

    const result = ratios.length === 0 ? 1 : Math.min(...ratios);

    if (result > 1 && !state.onlyScaleDown) {
      return result;
    }
    return Math.min(result, 1);
  }

  getQuality(state: ImageCropperState): number {
    return Math.min(1, Math.max(0, state.imageQuality / 100));
  }
}
