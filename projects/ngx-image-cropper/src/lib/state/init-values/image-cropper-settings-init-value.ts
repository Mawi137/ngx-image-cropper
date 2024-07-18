import { ImageCropperSettings } from '../../interfaces';
import { getCropperInitValue, getTransformInitValue } from './';

export function getImageCropperSettingsInitValue(){
    return structuredClone(imageCropperSettingsInitValue);
}

export const imageCropperSettingsInitValue: ImageCropperSettings = {
    alignImage: 'center',
    allowMoveImage: false,
    aspectRatio: 1,
    autoCrop: true,
    backgroundColor: null,
    canvasRotation: 0,
    checkImageType: true,
    containWithinAspectRatio: false,
    cropper: getCropperInitValue(),
    cropperFrameAriaLabel: null,
    cropperMaxHeight: 0,
    cropperMaxWidth: 0,
    cropperMinHeight: 0,
    cropperMinWidth: 0,
    cropperStaticHeight: 0,
    cropperStaticWidth: 0,
    disabled: false,
    format: 'png',
    hidden: false,
    hideResizeSquares: false,
    imageAltText: null,
    imageQuality: 92,
    imageSource: {},
    initialStepSize: 3,
    maintainAspectRatio: true,
    onlyScaleDown: false,
    output: 'blob',
    resetCropOnAspectRatioChange: true,
    resizeToHeight: 0,
    resizeToWidth: 0,
    roundCropper: false,
    transform: getTransformInitValue(),
}