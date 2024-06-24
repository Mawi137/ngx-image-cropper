export interface CropperOptions {
  format: OutputFormat;
  output: OutputType;
  autoCrop: boolean;
  maintainAspectRatio: boolean;
  resetCropOnAspectRatioChange: boolean;
  aspectRatio: number;
  resizeToWidth: number;
  resizeToHeight: number;
  cropperMinWidth: number;
  cropperMinHeight: number;
  cropperMaxHeight: number;
  cropperMaxWidth: number;
  cropperStaticWidth: number;
  cropperStaticHeight: number;
  canvasRotation: number;
  roundCropper: boolean;
  onlyScaleDown: boolean;
  imageQuality: number;
  backgroundColor: string | null;
  containWithinAspectRatio: boolean;
  hideResizeSquares: boolean;
  alignImage: 'left' | 'center';
  cropperFrameAriaLabel: string | undefined;
  checkImageType: boolean;
}

export type OutputFormat = 'png' | 'jpeg' | 'bmp' | 'webp' | 'ico';
export type OutputType = 'base64' | 'blob';
