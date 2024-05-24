import { CropperOptions, OutputFormat, OutputType } from './cropper-options.interface';
import { ImageTransform, CropperPosition } from './';
import { SimpleChanges } from '@angular/core';

export class CropperSettings {

  // From options
  format: OutputFormat = 'png';
  output: OutputType = 'blob';
  maintainAspectRatio = true;
  transform: ImageTransform = {};
  aspectRatio = 1;
  resetCropOnAspectRatioChange = true;
  resizeToWidth = 0;
  resizeToHeight = 0;
  cropper: CropperPosition = {x1: 0, y1: 0, x2: 0, y2: 0};
  cropperMinWidth = 0;
  cropperMinHeight = 0;
  cropperMaxHeight = 0;
  cropperMaxWidth = 0;
  cropperStaticWidth = 0;
  cropperStaticHeight = 0;
  canvasRotation = 0;
  initialStepSize = 3;
  roundCropper = false;
  onlyScaleDown = false;
  imageQuality = 92;
  autoCrop = true;
  backgroundColor: string | null = null;
  containWithinAspectRatio = false;
  hideResizeSquares = false;
  alignImage: 'left' | 'center' = 'center';
  cropperFrameAriaLabel = 'Crop photo';

  // Internal
  cropperScaledMinWidth = 20;
  cropperScaledMinHeight = 20;
  cropperScaledMaxWidth = 20;
  cropperScaledMaxHeight = 20;
  stepSize = this.initialStepSize;

  setOptionsFromChanges(changes: SimpleChanges): void {
    for(const k in changes){
      if (k === 'transform' || k === 'cropper') (this as any)[k] = { ...changes[k].currentValue };
      else if (k in this) (this as any)[k] = changes[k].currentValue;
    }
    this.validateOptions();
  }

  private validateOptions(): void {
    if (this.maintainAspectRatio && !this.aspectRatio) {
      throw new Error('`aspectRatio` should > 0 when `maintainAspectRatio` is enabled');
    }
  }
}
