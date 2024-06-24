import { CropperOptions } from '../interfaces/cropper-options.interface';
import { CropperPosition, Dimensions, ImageTransform, LoadedImage } from '../interfaces';
import { SimpleChanges } from '@angular/core';
import { checkCropperPosition } from '../utils/cropper-position.utils';

export class CropperState {

  options: CropperOptions = {
    format: 'png',
    output: 'blob',
    autoCrop: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    resetCropOnAspectRatioChange: true,
    resizeToWidth: 0,
    resizeToHeight: 0,
    cropperMinWidth: 0,
    cropperMinHeight: 0,
    cropperMaxHeight: 0,
    cropperMaxWidth: 0,
    cropperStaticWidth: 0,
    cropperStaticHeight: 0,
    canvasRotation: 0,
    roundCropper: false,
    onlyScaleDown: false,
    imageQuality: 92,
    backgroundColor: null,
    containWithinAspectRatio: false,
    hideResizeSquares: false,
    alignImage: 'center',
    cropperFrameAriaLabel: undefined,
    checkImageType: true
  };

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

  setOptionsFromChanges(changes: SimpleChanges): void {
    if (changes['options']?.currentValue) {
      this.setOptions(changes['options'].currentValue);
    }
    const options = Object.entries(changes)
      .filter(([key]) => key in this.options)
      .reduce((acc, [key, change]) => ({
        ...acc,
        [key]: change.currentValue
      }), {} as Partial<CropperOptions>);
    if (Object.keys(options).length > 0) {
      this.setOptions(options);
    }
  }

  setOptions(options: Partial<CropperOptions>): void {
    this.options = {
      ...this.options,
      ...(options || {})
    };
    this.validateOptions();

    if (!this.loadedImage?.transformed.image.complete || !this.maxSize) {
      return;
    }

    let positionPossiblyChanged = false;
    if ((this.options.maintainAspectRatio && options['aspectRatio']) || options['maintainAspectRatio']) {
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
      if (this.options.maintainAspectRatio && (this.options.resetCropOnAspectRatioChange || !this.aspectRatioIsCorrect())) {
        this.cropper = this.maxSizeCropperPosition();
        positionPossiblyChanged = true;
      }
    } else {
      if (options['cropperMinWidth'] || options['cropperMinHeight']) {
        this.setCropperScaledMinSize();
        positionPossiblyChanged = true;
      }
      if (options['cropperMaxWidth'] || options['cropperMaxHeight']) {
        this.setCropperScaledMaxSize();
        positionPossiblyChanged = true;
      }
      if (options['cropperStaticWidth'] || options['cropperStaticHeight']) {
        positionPossiblyChanged = true;
      }
    }

    if (positionPossiblyChanged) {
      this.cropper = checkCropperPosition(this.cropper, this, false);
    }
  }

  private validateOptions(): void {
    if (this.options.maintainAspectRatio && !this.options.aspectRatio) {
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
    this.cropperScaledMinWidth = this.options.cropperMinWidth > 0
      ? Math.max(20, this.options.cropperMinWidth / this.loadedImage!.transformed.size.width * this.maxSize!.width)
      : 20;
  }

  setCropperScaledMinHeight(): void {
    if (this.options.maintainAspectRatio) {
      this.cropperScaledMinHeight = Math.max(20, this.cropperScaledMinWidth / this.options.aspectRatio);
    } else if (this.options.cropperMinHeight > 0) {
      this.cropperScaledMinHeight = Math.max(
        20,
        this.options.cropperMinHeight / this.loadedImage!.transformed.size.height * this.maxSize!.height
      );
    } else {
      this.cropperScaledMinHeight = 20;
    }
  }

  setCropperScaledMaxSize(): void {
    if (this.loadedImage?.transformed.size) {
      const ratio = this.loadedImage.transformed.size.width / this.maxSize!.width;
      this.cropperScaledMaxWidth = this.options.cropperMaxWidth > 20 ? this.options.cropperMaxWidth / ratio : this.maxSize!.width;
      this.cropperScaledMaxHeight = this.options.cropperMaxHeight > 20 ? this.options.cropperMaxHeight / ratio : this.maxSize!.height;
      if (this.options.maintainAspectRatio) {
        if (this.cropperScaledMaxWidth > this.cropperScaledMaxHeight * this.options.aspectRatio) {
          this.cropperScaledMaxWidth = this.cropperScaledMaxHeight * this.options.aspectRatio;
        } else if (this.cropperScaledMaxWidth < this.cropperScaledMaxHeight * this.options.aspectRatio) {
          this.cropperScaledMaxHeight = this.cropperScaledMaxWidth / this.options.aspectRatio;
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
    return currentCropAspectRatio === this.options.aspectRatio;
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

  maxSizeCropperPosition(): CropperPosition {
    return {
      x1: 0,
      y1: 0,
      x2: this.maxSize!.width,
      y2: this.maxSize!.height
    };
  }
}
