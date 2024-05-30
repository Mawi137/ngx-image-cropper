import { CropperPosition, Dimensions, MoveStart } from '../interfaces';
import { CropperSettings } from '../interfaces/cropper.settings';
import { BasicEvent } from '../interfaces/basic-event.interface';
import { HammerInput } from '../utils/hammer.utils';


export function checkCropperSizeRestriction(cropperPosition: CropperPosition | undefined, settings: CropperSettings): CropperPosition {

  if (!cropperPosition) {
    cropperPosition = {
      x1: 0,
      y1: 0,
      x2: settings.maxSize!.width,
      y2: settings.maxSize!.height
    };
  }

  let cropperWidth = cropperPosition.x2 - cropperPosition.x1;
  let cropperHeight = cropperPosition.y2 - cropperPosition.y1;
  const centerX = cropperPosition.x1 + cropperWidth / 2;
  const centerY = cropperPosition.y1 + cropperHeight / 2;

  if (settings.cropperStaticHeight && settings.cropperStaticWidth) {
    cropperWidth = settings.maxSize!.width > settings.cropperStaticWidth
      ? settings.cropperStaticWidth
      : settings.maxSize!.width;
    cropperHeight = settings.maxSize!.height > settings.cropperStaticHeight
      ? settings.cropperStaticHeight
      : settings.maxSize!.height;
  } else {
    cropperWidth = Math.max(settings.cropperScaledMinWidth, Math.min(cropperWidth, settings.cropperScaledMaxWidth, settings.maxSize!.width));
    cropperHeight = Math.max(settings.cropperScaledMinHeight, Math.min(cropperHeight, settings.cropperScaledMaxHeight, settings.maxSize!.height));
    if (settings.maintainAspectRatio) {
      if (settings.maxSize!.width / settings.aspectRatio < settings.maxSize!.height) {
        cropperHeight = cropperWidth / settings.aspectRatio;
      } else {
        cropperWidth = cropperHeight * settings.aspectRatio;
      }
    }
  }

  const x1 = centerX - cropperWidth / 2;
  const x2 = x1 + cropperWidth;
  const y1 = centerY - cropperHeight / 2;
  const y2 = y1 + cropperHeight;
  return {x1, x2, y1, y2};
}

export function moveCropper(event: Event | BasicEvent, moveStart: MoveStart): CropperPosition {
  const diffX = getClientX(event) - moveStart.clientX;
  const diffY = getClientY(event) - moveStart.clientY;

  return {
    x1: moveStart.cropper.x1 + diffX,
    y1: moveStart.cropper.y1 + diffY,
    x2: moveStart.cropper.x2 + diffX,
    y2: moveStart.cropper.y2 + diffY
  };
}

export function resizeCropper(event: Event | BasicEvent | HammerInput, moveStart: MoveStart, cropperPosition: CropperPosition, maxSize: Dimensions, settings: CropperSettings): CropperPosition {
  cropperPosition = {...cropperPosition};
  const moveX = getClientX(event) - moveStart.clientX;
  const moveY = getClientY(event) - moveStart.clientY;
  switch (moveStart.position) {
    case 'left':
      cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - settings.cropperScaledMaxWidth),
        cropperPosition.x2 - settings.cropperScaledMinWidth);
      break;
    case 'topleft':
      cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - settings.cropperScaledMaxWidth),
        cropperPosition.x2 - settings.cropperScaledMinWidth);
      cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - settings.cropperScaledMaxHeight),
        cropperPosition.y2 - settings.cropperScaledMinHeight);
      break;
    case 'top':
      cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - settings.cropperScaledMaxHeight),
        cropperPosition.y2 - settings.cropperScaledMinHeight);
      break;
    case 'topright':
      cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + settings.cropperScaledMaxWidth),
        cropperPosition.x1 + settings.cropperScaledMinWidth);
      cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - settings.cropperScaledMaxHeight),
        cropperPosition.y2 - settings.cropperScaledMinHeight);
      break;
    case 'right':
      cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + settings.cropperScaledMaxWidth),
        cropperPosition.x1 + settings.cropperScaledMinWidth);
      break;
    case 'bottomright':
      cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + settings.cropperScaledMaxWidth),
        cropperPosition.x1 + settings.cropperScaledMinWidth);
      cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + settings.cropperScaledMaxHeight),
        cropperPosition.y1 + settings.cropperScaledMinHeight);
      break;
    case 'bottom':
      cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + settings.cropperScaledMaxHeight),
        cropperPosition.y1 + settings.cropperScaledMinHeight);
      break;
    case 'bottomleft':
      cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - settings.cropperScaledMaxWidth),
        cropperPosition.x2 - settings.cropperScaledMinWidth);
      cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + settings.cropperScaledMaxHeight),
        cropperPosition.y1 + settings.cropperScaledMinHeight);
      break;
    case 'center':
      const scale = 'scale' in event ? event.scale : 1;
      const newWidth = Math.min(
        Math.max(settings.cropperScaledMinWidth, (Math.abs(moveStart.cropper.x2 - moveStart.cropper.x1)) * scale),
        settings.cropperScaledMaxWidth);
      const newHeight = Math.min(
        Math.max(settings.cropperScaledMinHeight, (Math.abs(moveStart.cropper.y2 - moveStart.cropper.y1)) * scale),
        settings.cropperScaledMaxHeight);
      cropperPosition.x1 = moveStart.clientX - newWidth / 2;
      cropperPosition.x2 = moveStart.clientX + newWidth / 2;
      cropperPosition.y1 = moveStart.clientY - newHeight / 2;
      cropperPosition.y2 = moveStart.clientY + newHeight / 2;
      if (cropperPosition.x1 < 0) {
        cropperPosition.x2 -= cropperPosition.x1;
        cropperPosition.x1 = 0;
      } else if (cropperPosition.x2 > maxSize.width) {
        cropperPosition.x1 -= (cropperPosition.x2 - maxSize.width);
        cropperPosition.x2 = maxSize.width;
      }
      if (cropperPosition.y1 < 0) {
        cropperPosition.y2 -= cropperPosition.y1;
        cropperPosition.y1 = 0;
      } else if (cropperPosition.y2 > maxSize.height) {
        cropperPosition.y1 -= (cropperPosition.y2 - maxSize.height);
        cropperPosition.y2 = maxSize.height;
      }
      break;
  }

  if (settings.maintainAspectRatio) {
    return checkAspectRatio(moveStart.position!, cropperPosition, maxSize, settings);
  } else {
    return cropperPosition;
  }
}

export function checkAspectRatio(position: string, cropperPosition: CropperPosition, maxSize: Dimensions, settings: CropperSettings): CropperPosition {
  cropperPosition = {...cropperPosition};
  let overflowX = 0;
  let overflowY = 0;
  switch (position) {
    case 'top':
      cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * settings.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
      overflowY = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
        cropperPosition.y1 += (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
      }
      break;
    case 'bottom':
      cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * settings.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
      overflowY = Math.max(cropperPosition.y2 - maxSize.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
        cropperPosition.y2 -= (overflowY * settings.aspectRatio) > overflowX ? overflowY : (overflowX / settings.aspectRatio);
      }
      break;
    case 'topleft':
      cropperPosition.y1 = cropperPosition.y2 - (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
      overflowX = Math.max(0 - cropperPosition.x1, 0);
      overflowY = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x1 += (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
        cropperPosition.y1 += (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
      }
      break;
    case 'topright':
      cropperPosition.y1 = cropperPosition.y2 - (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
      overflowY = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
        cropperPosition.y1 += (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
      }
      break;
    case 'right':
    case 'bottomright':
      cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
      overflowY = Math.max(cropperPosition.y2 - maxSize.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
        cropperPosition.y2 -= (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
      }
      break;
    case 'left':
    case 'bottomleft':
      cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
      overflowX = Math.max(0 - cropperPosition.x1, 0);
      overflowY = Math.max(cropperPosition.y2 - maxSize.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x1 += (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
        cropperPosition.y2 -= (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
      }
      break;
    case 'center':
      cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * settings.aspectRatio;
      cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
      const overflowX1 = Math.max(0 - cropperPosition.x1, 0);
      const overflowX2 = Math.max(cropperPosition.x2 - maxSize.width, 0);
      const overflowY1 = Math.max(cropperPosition.y2 - maxSize.height, 0);
      const overflowY2 = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX1 > 0 || overflowX2 > 0 || overflowY1 > 0 || overflowY2 > 0) {
        cropperPosition.x1 += (overflowY1 * settings.aspectRatio) > overflowX1 ? (overflowY1 * settings.aspectRatio) : overflowX1;
        cropperPosition.x2 -= (overflowY2 * settings.aspectRatio) > overflowX2 ? (overflowY2 * settings.aspectRatio) : overflowX2;
        cropperPosition.y1 += (overflowY2 * settings.aspectRatio) > overflowX2 ? overflowY2 : overflowX2 / settings.aspectRatio;
        cropperPosition.y2 -= (overflowY1 * settings.aspectRatio) > overflowX1 ? overflowY1 : overflowX1 / settings.aspectRatio;
      }
      break;
  }
  return cropperPosition;
}

export function getClientX(event: Event | BasicEvent | TouchEvent | HammerInput): number {
  if ('touches' in event && event.touches[0]) {
    return event.touches[0].clientX;
  } else if ('clientX' in event) {
    return event.clientX;
  }

  return 0;
}

export function getClientY(event: Event | BasicEvent | TouchEvent | HammerInput): number {
  if ('touches' in event && event.touches[0]) {
    return event.touches[0].clientY;
  } else if ('clientX' in event) {
    return event.clientY;
  }

  return 0;
}
