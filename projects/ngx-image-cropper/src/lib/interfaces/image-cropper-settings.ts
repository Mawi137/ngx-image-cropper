import { ImageTransform, CropperPosition, ImageSource } from "./../interfaces";

export type AlignImage = "left" | "center";
export type OutputFormat = "png" | "jpeg" | "bmp" | "webp" | "ico";
export type OutputType = "base64" | "blob";

export interface ImageCropperSettings {
  alignImage: AlignImage;
  allowMoveImage: boolean;
  aspectRatio: number;
  autoCrop: boolean;
  backgroundColor: string | null;
  canvasRotation: number;
  checkImageType: boolean;
  containWithinAspectRatio: boolean;
  cropper: CropperPosition;
  cropperFrameAriaLabel: string | null;
  cropperMaxHeight: number;
  cropperMaxWidth: number;
  cropperMinHeight: number;
  cropperMinWidth: number;
  cropperStaticHeight: number;
  cropperStaticWidth: number;
  disabled: boolean;
  format: OutputFormat;
  hidden: boolean;
  hideResizeSquares: boolean;
  imageAltText: string | null;
  imageQuality: number;
  imageSource: ImageSource;
  initialStepSize: number;
  maintainAspectRatio: boolean;
  onlyScaleDown: boolean;
  output: OutputType;
  resetCropOnAspectRatioChange: boolean;
  resizeToHeight: number;
  resizeToWidth: number;
  roundCropper: boolean;
  transform: ImageTransform;
}

interface ImageCropperSettingsWithOptionalPropertyKeys
 extends Omit<ImageCropperSettings, "cropper" | "transform"> {
  cropper: Partial<CropperPosition>;
  transform: Partial<ImageTransform>;
}

export type PartialImageCropperSettings =
  Partial<ImageCropperSettingsWithOptionalPropertyKeys>;
