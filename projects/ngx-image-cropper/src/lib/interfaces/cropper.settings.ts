import { CropperOptions, OutputFormat, OutputType } from './cropper-options.interface';
import { CropperPosition, Dimensions, ImageTransform, LoadedImage } from './';
import { SimpleChanges } from '@angular/core';

export class CropperSettings implements CropperOptions {
  // From options
  format: OutputFormat = 'png';
  output: OutputType = 'blob';
  maintainAspectRatio = true;
  aspectRatio = 1;
  resetCropOnAspectRatioChange = true;
  resizeToWidth = 0;
  resizeToHeight = 0;
  cropperMinWidth = 0;
  cropperMinHeight = 0;
  cropperMaxHeight = 0;
  cropperMaxWidth = 0;
  cropperStaticWidth = 0;
  cropperStaticHeight = 0;
  canvasRotation = 0;
  roundCropper = false;
  onlyScaleDown = false;
  imageQuality = 92;
  backgroundColor: string | null = null;
  containWithinAspectRatio = false;
  hideResizeSquares = false;
  alignImage: 'left' | 'center' = 'center';
  cropperFrameAriaLabel = 'Crop photo';

  loadedImage?: LoadedImage;
  maxSize?: Dimensions;
  cropper: CropperPosition = {x1: 0, x2: 0, y1: 0, y2: 0};
  transform: ImageTransform = {};

  // Internal
  cropperScaledMinWidth = 20;
  cropperScaledMinHeight = 20;
  cropperScaledMaxWidth = 20;
  cropperScaledMaxHeight = 20;
  stepSize = 3;

  setOptionsFromChanges(changes: SimpleChanges): {
    crop: boolean;
    resetCropper: boolean;
    checkCropperWithinBounds: boolean;
  } {
    const options = Object.entries(changes)
      .filter(([key]) => key in this)
      .reduce((acc, [key, change]) => ({
        ...acc,
        [key]: change.currentValue
      }), {} as Partial<CropperOptions>);
    return this.setOptions(options);
  }

  setOptions(options: Partial<CropperOptions & { cropper: CropperPosition }>): {
    crop: boolean;
    resetCropper: boolean;
    checkCropperWithinBounds: boolean;
  } {
    let checkCropperWithinBounds = false;
    let resetCropper = false;
    let crop = false;

    if (options['transform'] && !this.equalsTransform(options['transform'])) {
      crop = true;
    }
    if (options['cropper'] && !this.equalsCropperPosition(options['cropper'])) {
      checkCropperWithinBounds = true;
      crop = true;
    }

    Object.entries(options)
      .filter(([key]) => key in this)
      .forEach(([key, value]) => (this as any)[key] = value);

    if (!this.loadedImage?.transformed.image.complete || !this.maxSize) {
      return {crop, resetCropper, checkCropperWithinBounds};
    }

    if ((this.maintainAspectRatio && options['aspectRatio']) || options['maintainAspectRatio']) {
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
      if (this.maintainAspectRatio && (this.resetCropOnAspectRatioChange || !this.aspectRatioIsCorrect())) {
        checkCropperWithinBounds = true;
        resetCropper = true;
      }
    } else {
      if (options['cropperMinWidth'] || options['cropperMinHeight']) {
        this.setCropperScaledMinSize();
        checkCropperWithinBounds = true;
      }
      if (options['cropperMaxWidth'] || options['cropperMaxHeight']) {
        this.setCropperScaledMaxSize();
        checkCropperWithinBounds = true;
      }
      if (options['cropperStaticWidth'] || options['cropperStaticHeight']) {
        checkCropperWithinBounds = true;
      }
    }

    if (options['backgroundColor']) {
      crop = true;
    }

    this.validateOptions();
    return {crop, resetCropper, checkCropperWithinBounds};
  }

  private validateOptions(): void {
    if (this.maintainAspectRatio && !this.aspectRatio) {
      throw new Error('`aspectRatio` should > 0 when `maintainAspectRatio` is enabled');
    }
  }

  setMaxSize(width: number, height: number): void {
    this.maxSize = {width, height};
    this.setCropperScaledMinSize();
    this.setCropperScaledMaxSize();
  }

  setCropperScaledMinSize(): void {
    if (this.loadedImage?.transformed.size) {
      this.setCropperScaledMinWidth();
      this.setCropperScaledMinHeight();
    } else {
      this.cropperScaledMinWidth = 20;
      this.cropperScaledMinHeight = 20;
    }
  }

  setCropperScaledMinWidth(): void {
    this.cropperScaledMinWidth = this.cropperMinWidth > 0
      ? Math.max(20, this.cropperMinWidth / this.loadedImage!.transformed.size.width * this.maxSize!.width)
      : 20;
  }

  setCropperScaledMinHeight(): void {
    if (this.maintainAspectRatio) {
      this.cropperScaledMinHeight = Math.max(20, this.cropperScaledMinWidth / this.aspectRatio);
    } else if (this.cropperMinHeight > 0) {
      this.cropperScaledMinHeight = Math.max(
        20,
        this.cropperMinHeight / this.loadedImage!.transformed.size.height * this.maxSize!.height
      );
    } else {
      this.cropperScaledMinHeight = 20;
    }
  }

  setCropperScaledMaxSize(): void {
    if (this.loadedImage?.transformed.size) {
      const ratio = this.loadedImage.transformed.size.width / this.maxSize!.width;
      this.cropperScaledMaxWidth = this.cropperMaxWidth > 20 ? this.cropperMaxWidth / ratio : this.maxSize!.width;
      this.cropperScaledMaxHeight = this.cropperMaxHeight > 20 ? this.cropperMaxHeight / ratio : this.maxSize!.height;
      if (this.maintainAspectRatio) {
        if (this.cropperScaledMaxWidth > this.cropperScaledMaxHeight * this.aspectRatio) {
          this.cropperScaledMaxWidth = this.cropperScaledMaxHeight * this.aspectRatio;
        } else if (this.cropperScaledMaxWidth < this.cropperScaledMaxHeight * this.aspectRatio) {
          this.cropperScaledMaxHeight = this.cropperScaledMaxWidth / this.aspectRatio;
        }
      }
    } else {
      this.cropperScaledMaxWidth = this.maxSize!.width;
      this.cropperScaledMaxHeight = this.maxSize!.height;
    }
  }

  equalsCropperPosition(cropper?: CropperPosition): boolean {
    return this.cropper == null && cropper == null
      || this.cropper != null && cropper != null
      && this.cropper.x1.toFixed(3) === cropper.x1.toFixed(3)
      && this.cropper.y1.toFixed(3) === cropper.y1.toFixed(3)
      && this.cropper.x2.toFixed(3) === cropper.x2.toFixed(3)
      && this.cropper.y2.toFixed(3) === cropper.y2.toFixed(3);
  }

  equalsTransformTranslate(transform: ImageTransform): boolean {
    return (this.transform.translateH ?? 0) === (transform.translateH ?? 0)
      && (this.transform.translateV ?? 0) === (transform.translateV ?? 0);
  }

  equalsTransform(transform: ImageTransform): boolean {
    return this.equalsTransformTranslate(transform)
      && (this.transform.scale ?? 1) === (transform.scale ?? 1)
      && (this.transform.rotate ?? 0) === (transform.rotate ?? 0)
      && (this.transform.flipH ?? false) === (transform.flipH ?? false)
      && (this.transform.flipV ?? false) === (transform.flipV ?? false);
  }

  aspectRatioIsCorrect(): boolean {
    const currentCropAspectRatio = (this.cropper.x2 - this.cropper.x1) / (this.cropper.y2 - this.cropper.y1);
    return currentCropAspectRatio === this.aspectRatio;
  }

  resizeCropperPosition(oldMaxSize: Dimensions): void {
    if (!this.cropper) {
      return;
    }
    if (oldMaxSize.width !== this.maxSize!.width || oldMaxSize.height !== this.maxSize!.height) {
      this.cropper = {
        x1: this.cropper.x1 * this.maxSize!.width / oldMaxSize.width,
        x2: this.cropper.x2 * this.maxSize!.width / oldMaxSize.width,
        y1: this.cropper.y1 * this.maxSize!.height / oldMaxSize.height,
        y2: this.cropper.y2 * this.maxSize!.height / oldMaxSize.height
      };
    }
  }
}
