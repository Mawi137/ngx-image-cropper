import {
  CropperPosition,
  Dimensions,
  ImageTransform,
  LoadedImage,
} from "../interfaces";
import {
  ImageCropperSettings,
  PartialImageCropperSettings,
} from "../interfaces/image-cropper-settings";
import { imageCropperSettingsInitValue } from "./init-values";

export class ImageCropperState implements ImageCropperSettings {
  // Image Cropper Settings
  alignImage = imageCropperSettingsInitValue.alignImage;
  allowMoveImage = imageCropperSettingsInitValue.allowMoveImage;
  aspectRatio = imageCropperSettingsInitValue.aspectRatio;
  autoCrop = imageCropperSettingsInitValue.autoCrop;
  backgroundColor = imageCropperSettingsInitValue.backgroundColor;
  canvasRotation = imageCropperSettingsInitValue.canvasRotation;
  checkImageType = imageCropperSettingsInitValue.checkImageType;
  containWithinAspectRatio = imageCropperSettingsInitValue.containWithinAspectRatio;
  cropper = imageCropperSettingsInitValue.cropper;
  cropperFrameAriaLabel = imageCropperSettingsInitValue.cropperFrameAriaLabel;
  cropperMaxHeight = imageCropperSettingsInitValue.cropperMaxHeight;
  cropperMaxWidth = imageCropperSettingsInitValue.cropperMaxWidth;
  cropperMinHeight = imageCropperSettingsInitValue.cropperMinHeight;
  cropperMinWidth = imageCropperSettingsInitValue.cropperMinWidth;
  cropperStaticHeight = imageCropperSettingsInitValue.cropperStaticHeight;
  cropperStaticWidth = imageCropperSettingsInitValue.cropperStaticWidth;
  disabled = imageCropperSettingsInitValue.disabled;
  format = imageCropperSettingsInitValue.format;
  hidden = imageCropperSettingsInitValue.hidden;
  hideResizeSquares = imageCropperSettingsInitValue.hideResizeSquares;
  imageAltText = imageCropperSettingsInitValue.imageAltText;
  imageQuality = imageCropperSettingsInitValue.imageQuality;
  imageSource = imageCropperSettingsInitValue.imageSource;
  initialStepSize = imageCropperSettingsInitValue.initialStepSize;
  maintainAspectRatio = imageCropperSettingsInitValue.maintainAspectRatio;
  onlyScaleDown = imageCropperSettingsInitValue.onlyScaleDown;
  output = imageCropperSettingsInitValue.output;
  resetCropOnAspectRatioChange = imageCropperSettingsInitValue.resetCropOnAspectRatioChange;
  resizeToHeight = imageCropperSettingsInitValue.resizeToHeight;
  resizeToWidth = imageCropperSettingsInitValue.resizeToWidth;
  roundCropper = imageCropperSettingsInitValue.roundCropper;
  transform = imageCropperSettingsInitValue.transform;
  // Internal
  cropperScaledMinHeight = 20;
  cropperScaledMinWidth = 20;
  cropperScaledMaxHeight = 20;
  cropperScaledMaxWidth = 20;
  loadedImage?: LoadedImage;
  maxSize: Dimensions = { width: 0, height: 0 };

  getChangesAndUpdateSettings( input: PartialImageCropperSettings ): PartialImageCropperSettings {
    console.log("settings before", this.getDeepCopyOfSettings());
    console.log("input", { ...input });
    const changes: PartialImageCropperSettings = {};
    for (let k in input) {
      if (!(k in imageCropperSettingsInitValue)) continue;
      if (!!(this as any)[k] && (this as any)[k].constructor === Object) {
        (changes as any)[k] = {};
        for (let j in (input as any)[k]) {
          if ((this as any)[k][j] !== (input as any)[k][j]) {
            console.log("old", (this as any)[k][j], " new", (input as any)[k][j]);
            if (k === 'imageSource') this.imageSource = {};
            (this as any)[k][j] = (input as any)[k][j];
            (changes as any)[k][j] = true;
          }
        }
        if (k !== 'imageSource' && !Object.keys((changes as any)[k]).length) delete (changes as any)[k];
      } else {
        if ((this as any)[k] !== (input as any)[k]) {
          console.log("old", (this as any)[k], " new", (input as any)[k]);
          (this as any)[k] = (input as any)[k];
          (changes as any)[k] = true;
        }
      }
    }
    if (changes.imageSource) this.imageSource = { ...input.imageSource };
    console.log("changes", { ...changes });
    console.log("settings after", this.getDeepCopyOfSettings());
    this.validateOptions();
    return changes;
  }

  private validateOptions(): void {
    if (this.maintainAspectRatio && !this.aspectRatio) {
      throw new Error(
        "`aspectRatio` should > 0 when `maintainAspectRatio` is enabled"
      );
    }
  }

  getDeepCopyOfSettings(): ImageCropperSettings {
    let settings = {};
    for (let k in imageCropperSettingsInitValue) {
      if (k in (this as any)) {
        if (!!(this as any)[k] && (this as any)[k].constructor === Object) {
          (settings as any)[k] = { ...(this as any)[k] };
        } else {
          (settings as any)[k] = (this as any)[k];
        }
      }
    }
    return settings as ImageCropperSettings;
  }

  equalsCropper(cropper: CropperPosition): boolean { //TODO
    return (
      this.cropper.x1.toFixed(3) === cropper.x1.toFixed(3) &&
      this.cropper.y1.toFixed(3) === cropper.y1.toFixed(3) &&
      this.cropper.x2.toFixed(3) === cropper.x2.toFixed(3) &&
      this.cropper.y2.toFixed(3) === cropper.y2.toFixed(3)
    );
  }

  equalsTransformTranslate(transform: ImageTransform): boolean {
    return (
      this.transform.translateX === transform.translateX &&
      this.transform.translateY === transform.translateY
    );
  }

  equalsTransform(transform: ImageTransform): boolean {
    return (
      this.equalsTransformTranslate(transform) &&
      this.transform.scale === transform.scale &&
      this.transform.rotate === transform.rotate &&
      this.transform.flipX === transform.flipX &&
      this.transform.flipY === transform.flipY
    );
  }
}
