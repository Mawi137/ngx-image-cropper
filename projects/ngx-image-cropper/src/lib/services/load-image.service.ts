import { Injectable } from '@angular/core';
import { Dimensions, LoadedImage } from '../interfaces';
import { CropperSettings } from '../interfaces/cropper.settings';
import { ExifTransform } from '../interfaces/exif-transform.interface';
import { getTransformationsFromExifData, supportsAutomaticRotation } from '../utils/exif.utils';

interface LoadImageArrayBuffer {
  originalImage: HTMLImageElement;
  originalArrayBuffer: ArrayBufferLike;
  originalObjectUrl: string;
}

@Injectable({providedIn: 'root'})
export class LoadImageService {

  private autoRotateSupported: Promise<boolean> = supportsAutomaticRotation();

  loadImageFile(file: File, cropperSettings: CropperSettings): Promise<LoadedImage> {
    return file.arrayBuffer()
      .then(arrayBuffer => this.checkImageTypeAndLoadImageFromArrayBuffer(arrayBuffer, file.type, cropperSettings));
  }

  private checkImageTypeAndLoadImageFromArrayBuffer(arrayBuffer: ArrayBufferLike, imageType: string, cropperSettings: CropperSettings): Promise<LoadedImage> {
    if (!this.isValidImageType(imageType)) {
      return Promise.reject(new Error('Invalid image type'));
    }
    return this.loadImageFromArrayBuffer(arrayBuffer, cropperSettings);
  }

  private isValidImageType(type: string): boolean {
    return /image\/(png|jpg|jpeg|bmp|gif|tiff|webp|x-icon|vnd.microsoft.icon)/.test(type);
  }

  loadImageFromURL(url: string, cropperSettings: CropperSettings): Promise<LoadedImage> {
    return fetch(url)
      .then(res => res.arrayBuffer())
      .then(buffer => this.loadImageFromArrayBuffer(buffer, cropperSettings));
  }

  loadBase64Image(imageBase64: string, cropperSettings: CropperSettings): Promise<LoadedImage> {
    const arrayBuffer = this.base64ToArrayBuffer(imageBase64);
    return this.loadImageFromArrayBuffer(arrayBuffer, cropperSettings);
  }

  private base64ToArrayBuffer(imageBase64: string): ArrayBufferLike {
    imageBase64 = imageBase64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
    const binaryString = atob(imageBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private loadImageFromArrayBuffer(arrayBuffer: ArrayBufferLike, cropperSettings: CropperSettings): Promise<LoadedImage> {
    return new Promise<LoadImageArrayBuffer>((resolve, reject) => {
      const blob = new Blob([arrayBuffer]);
      const objectUrl = URL.createObjectURL(blob);
      const originalImage = new Image();
      originalImage.onload = () => resolve({
        originalImage,
        originalObjectUrl: objectUrl,
        originalArrayBuffer: arrayBuffer
      });
      originalImage.onerror = reject;
      originalImage.src = objectUrl;
    }).then((res: LoadImageArrayBuffer) => this.transformImageFromArrayBuffer(res, cropperSettings));
  }

  private async transformImageFromArrayBuffer(res: LoadImageArrayBuffer, cropperSettings: CropperSettings): Promise<LoadedImage> {
    const autoRotate = await this.autoRotateSupported;
    const exifTransform = await getTransformationsFromExifData(autoRotate ? -1 : res.originalArrayBuffer);
    if (!res.originalImage || !res.originalImage.complete) {
      return Promise.reject(new Error('No image loaded'));
    }
    const loadedImage = {
      original: {
        objectUrl: res.originalObjectUrl,
        image: res.originalImage,
        size: {
          width: res.originalImage.naturalWidth,
          height: res.originalImage.naturalHeight
        }
      },
      exifTransform
    };
    return this.transformLoadedImage(loadedImage, cropperSettings);
  }

  async transformLoadedImage(loadedImage: Partial<LoadedImage>, cropperSettings: CropperSettings): Promise<LoadedImage> {
    const canvasRotation = cropperSettings.canvasRotation + loadedImage.exifTransform!.rotate;
    const originalSize = {
      width: loadedImage.original!.image.naturalWidth,
      height: loadedImage.original!.image.naturalHeight
    };
    if (canvasRotation === 0 && !loadedImage.exifTransform!.flip && !cropperSettings.containWithinAspectRatio) {
      return {
        original: {
          objectUrl: loadedImage.original!.objectUrl,
          image: loadedImage.original!.image,
          size: {...originalSize}
        },
        transformed: {
          objectUrl: loadedImage.original!.objectUrl,
          image: loadedImage.original!.image,
          size: {...originalSize}
        },
        exifTransform: loadedImage.exifTransform!
      };
    }

    const transformedSize = this.getTransformedSize(originalSize, loadedImage.exifTransform!, cropperSettings);
    const canvas = document.createElement('canvas');
    canvas.width = transformedSize.width;
    canvas.height = transformedSize.height;
    const ctx = canvas.getContext('2d');
    ctx?.setTransform(
      loadedImage.exifTransform!.flip ? -1 : 1,
      0,
      0,
      1,
      canvas.width / 2,
      canvas.height / 2
    );
    ctx?.rotate(Math.PI * (canvasRotation / 2));
    ctx?.drawImage(
      loadedImage.original!.image,
      -originalSize.width / 2,
      -originalSize.height / 2
    );
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, cropperSettings.format));
    if (!blob) {
      throw new Error('Failed to get Blob for transformed image.');
    }
    const objectUrl = URL.createObjectURL(blob);
    const transformedImage = await this.loadImageFromObjectUrl(objectUrl);
    return {
      original: {
        objectUrl: loadedImage.original!.objectUrl,
        image: loadedImage.original!.image,
        size: {...originalSize}
      },
      transformed: {
        objectUrl: objectUrl,
        image: transformedImage,
        size: {
          width: transformedImage.width,
          height: transformedImage.height
        }
      },
      exifTransform: loadedImage.exifTransform!
    };
  }

  private loadImageFromObjectUrl(objectUrl: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>(((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    }));
  }

  private getTransformedSize(
    originalSize: { width: number, height: number },
    exifTransform: ExifTransform,
    cropperSettings: CropperSettings
  ): Dimensions {
    const canvasRotation = cropperSettings.canvasRotation + exifTransform.rotate;
    if (cropperSettings.containWithinAspectRatio) {
      if (canvasRotation % 2) {
        const minWidthToContain = originalSize.width * cropperSettings.aspectRatio;
        const minHeightToContain = originalSize.height / cropperSettings.aspectRatio;
        return {
          width: Math.max(originalSize.height, minWidthToContain),
          height: Math.max(originalSize.width, minHeightToContain)
        };
      } else {
        const minWidthToContain = originalSize.height * cropperSettings.aspectRatio;
        const minHeightToContain = originalSize.width / cropperSettings.aspectRatio;
        return {
          width: Math.max(originalSize.width, minWidthToContain),
          height: Math.max(originalSize.height, minHeightToContain)
        };
      }
    }

    if (canvasRotation % 2) {
      return {
        height: originalSize.width,
        width: originalSize.height
      };
    }
    return {
      width: originalSize.width,
      height: originalSize.height
    };
  }
}
