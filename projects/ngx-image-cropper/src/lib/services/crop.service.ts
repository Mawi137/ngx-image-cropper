import { CropperPosition, ImageCroppedEvent } from '../interfaces';
import { resizeCanvas } from '../utils/resize.utils';
import { percentage } from '../utils/percentage.utils';
import { OutputType } from '../interfaces/cropper-options.interface';
import { CropInput } from '../interfaces/crop-input.interface';

export class CropService {

  crop(input: CropInput, output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(input: CropInput, output: 'base64'): ImageCroppedEvent | null;
  crop(input: CropInput, output: OutputType): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    const imagePosition = this.getImagePosition(input);
    const width = imagePosition.x2 - imagePosition.x1;
    const height = imagePosition.y2 - imagePosition.y1;
    const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    if (input.options?.backgroundColor != null) {
      ctx.fillStyle = input.options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const scaleX = (input.transform?.scale || 1) * (input.transform?.flipH ? -1 : 1);
    const scaleY = (input.transform?.scale || 1) * (input.transform?.flipV ? -1 : 1);
    const {translateH, translateV} = this.getCanvasTranslate(input);

    const transformedImage = input.loadedImage!.transformed;
    ctx.setTransform(scaleX, 0, 0, scaleY, transformedImage.size.width / 2 + translateH, transformedImage.size.height / 2 + translateV);
    ctx.translate(-imagePosition.x1 / scaleX, -imagePosition.y1 / scaleY);
    ctx.rotate((input.transform?.rotate || 0) * Math.PI / 180);

    ctx.drawImage(
      transformedImage.image,
      -transformedImage.size.width / 2,
      -transformedImage.size.height / 2
    );

    const result: ImageCroppedEvent = {
      width, height,
      imagePosition,
      cropperPosition: {...input.cropper}
    };
    if (input.options?.containWithinAspectRatio) {
      result.offsetImagePosition = this.getOffsetImagePosition(input);
    }
    const resizeRatio = this.getResizeRatio(width, height, input.options);
    if (resizeRatio !== 1) {
      result.width = Math.round(width * resizeRatio);
      result.height = input.options?.maintainAspectRatio
        ? Math.round(result.width / (input.options?.aspectRatio ?? 1))
        : Math.round(height * resizeRatio);
      resizeCanvas(cropCanvas, result.width, result.height);
    }
    if (output === 'blob') {
      return this.cropToBlob(result, cropCanvas, input);
    } else {
      result.base64 = cropCanvas.toDataURL('image/' + (input.options?.format ?? 'png'), this.getQuality(input.options));
      return result;
    }
  }

  private async cropToBlob(output: ImageCroppedEvent, cropCanvas: HTMLCanvasElement, input: CropInput): Promise<ImageCroppedEvent> {
    output.blob = await new Promise<Blob | null>(resolve => cropCanvas.toBlob(resolve, 'image/' + (input.options?.format ?? 'png'), this.getQuality(input.options)));
    if (output.blob) {
      output.objectUrl = URL.createObjectURL(output.blob);
    }
    return output;
  }

  private getCanvasTranslate(input: CropInput): { translateH: number, translateV: number } {
    if (input.transform?.translateUnit === 'px') {
      const ratio = this.getRatio(input);
      return {
        translateH: (input.transform?.translateH || 0) * ratio,
        translateV: (input.transform?.translateV || 0) * ratio
      };
    } else {
      return {
        translateH: input.transform?.translateH ? percentage(input.transform.translateH, input.loadedImage!.transformed.size.width) : 0,
        translateV: input.transform?.translateV ? percentage(input.transform.translateV, input.loadedImage!.transformed.size.height) : 0
      };
    }
  }

  private getRatio(input: CropInput): number {
    return input.loadedImage!.transformed.size.width / input.maxSize.width;
  }

  private getImagePosition(cropperState: CropInput): CropperPosition {
    const ratio = this.getRatio(cropperState);
    const out: CropperPosition = {
      x1: Math.round(cropperState.cropper.x1 * ratio),
      y1: Math.round(cropperState.cropper.y1 * ratio),
      x2: Math.round(cropperState.cropper.x2 * ratio),
      y2: Math.round(cropperState.cropper.y2 * ratio)
    };

    if (!cropperState.options?.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, cropperState.loadedImage!.transformed.size.width);
      out.y2 = Math.min(out.y2, cropperState.loadedImage!.transformed.size.height);
    }

    return out;
  }

  private getOffsetImagePosition(input: CropInput): CropperPosition {
    const canvasRotation = (input.options?.canvasRotation ?? 0) + input.loadedImage!.exifTransform.rotate;
    const ratio = this.getRatio(input);
    let offsetX: number;
    let offsetY: number;

    if (canvasRotation % 2) {
      offsetX = (input.loadedImage!.transformed.size.width - input.loadedImage!.original.size.height) / 2;
      offsetY = (input.loadedImage!.transformed.size.height - input.loadedImage!.original.size.width) / 2;
    } else {
      offsetX = (input.loadedImage!.transformed.size.width - input.loadedImage!.original.size.width) / 2;
      offsetY = (input.loadedImage!.transformed.size.height - input.loadedImage!.original.size.height) / 2;
    }

    const cropper = input.cropper;
    const out: CropperPosition = {
      x1: Math.round(cropper.x1 * ratio) - offsetX,
      y1: Math.round(cropper.y1 * ratio) - offsetY,
      x2: Math.round(cropper.x2 * ratio) - offsetX,
      y2: Math.round(cropper.y2 * ratio) - offsetY
    };

    if (!input.options?.containWithinAspectRatio) {
      out.x1 = Math.max(out.x1, 0);
      out.y1 = Math.max(out.y1, 0);
      out.x2 = Math.min(out.x2, input.loadedImage!.transformed.size.width);
      out.y2 = Math.min(out.y2, input.loadedImage!.transformed.size.height);
    }

    return out;
  }

  getResizeRatio(width: number, height: number, options?: {
    resizeToWidth?: number;
    resizeToHeight?: number;
    onlyScaleDown?: boolean;
  }): number {
    const ratios = new Array<number>();
    if (options?.resizeToWidth && options.resizeToWidth > 0) {
      ratios.push(options.resizeToWidth / width);
    }
    if (options?.resizeToHeight && options.resizeToHeight > 0) {
      ratios.push(options.resizeToHeight / height);
    }

    const result = ratios.length === 0 ? 1 : Math.min(...ratios);

    if (result > 1 && !options?.onlyScaleDown) {
      return result;
    }
    return Math.min(result, 1);
  }

  getQuality(options?: { imageQuality?: number }): number {
    return Math.min(1, Math.max(0, (options?.imageQuality ?? 92) / 100));
  }
}
