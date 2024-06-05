import { CropperPosition, MoveStart } from '../interfaces';
import { CropperState } from '../component/cropper.state';
import { BasicEvent } from '../interfaces/basic-event.interface';
import { HammerInput } from './hammer.utils';

export function checkCropperPosition(cropperPosition: CropperPosition, cropperState: CropperState, maintainSize: boolean): CropperPosition {
  cropperPosition = checkCropperSizeRestriction(cropperPosition, cropperState);
  return checkCropperWithinMaxSizeBounds(cropperPosition, cropperState, maintainSize);
}

export function checkCropperSizeRestriction(cropperPosition: CropperPosition, cropperState: CropperState): CropperPosition {
  let cropperWidth = cropperPosition.x2 - cropperPosition.x1;
  let cropperHeight = cropperPosition.y2 - cropperPosition.y1;
  const centerX = cropperPosition.x1 + cropperWidth / 2;
  const centerY = cropperPosition.y1 + cropperHeight / 2;

  if (cropperState.options.cropperStaticHeight && cropperState.options.cropperStaticWidth) {
    cropperWidth = cropperState.maxSize!.width > cropperState.options.cropperStaticWidth
      ? cropperState.options.cropperStaticWidth
      : cropperState.maxSize!.width;
    cropperHeight = cropperState.maxSize!.height > cropperState.options.cropperStaticHeight
      ? cropperState.options.cropperStaticHeight
      : cropperState.maxSize!.height;
  } else {
    cropperWidth = Math.max(cropperState.cropperScaledMinWidth, Math.min(cropperWidth, cropperState.cropperScaledMaxWidth, cropperState.maxSize!.width));
    cropperHeight = Math.max(cropperState.cropperScaledMinHeight, Math.min(cropperHeight, cropperState.cropperScaledMaxHeight, cropperState.maxSize!.height));
    if (cropperState.options.maintainAspectRatio) {
      if (cropperState.maxSize!.width / cropperState.options.aspectRatio < cropperState.maxSize!.height) {
        cropperHeight = cropperWidth / cropperState.options.aspectRatio;
      } else {
        cropperWidth = cropperHeight * cropperState.options.aspectRatio;
      }
    }
  }

  const x1 = centerX - cropperWidth / 2;
  const x2 = x1 + cropperWidth;
  const y1 = centerY - cropperHeight / 2;
  const y2 = y1 + cropperHeight;
  return {x1, x2, y1, y2};
}

export function checkCropperWithinMaxSizeBounds(position: CropperPosition, cropperState: CropperState, maintainSize = false): CropperPosition {
  if (position.x1 < 0) {
    position = {
      ...position,
      x1: 0,
      x2: position.x2 - (maintainSize ? position.x1 : 0)
    };
  }
  if (position.y1 < 0) {
    position = {
      ...position,
      y2: position.y2 - (maintainSize ? position.y1 : 0),
      y1: 0
    };
  }
  if (position.x2 > cropperState.maxSize!.width) {
    position = {
      ...position,
      x1: position.x1 - (maintainSize ? (position.x2 - cropperState.maxSize!.width) : 0),
      x2: cropperState.maxSize!.width
    };
  }
  if (position.y2 > cropperState.maxSize!.height) {
    position = {
      ...position,
      y1: position.y1 - (maintainSize ? (position.y2 - cropperState.maxSize!.height) : 0),
      y2: cropperState.maxSize!.height
    };
  }
  return position;
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

export function resizeCropper(event: Event | BasicEvent | HammerInput, moveStart: MoveStart, cropperState: CropperState): CropperPosition {
  const cropperPosition = {...cropperState.cropper};
  const moveX = getClientX(event) - moveStart.clientX;
  const moveY = getClientY(event) - moveStart.clientY;
  switch (moveStart.position) {
    case 'left':
      cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - cropperState.cropperScaledMaxWidth),
        cropperPosition.x2 - cropperState.cropperScaledMinWidth);
      break;
    case 'topleft':
      cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - cropperState.cropperScaledMaxWidth),
        cropperPosition.x2 - cropperState.cropperScaledMinWidth);
      cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - cropperState.cropperScaledMaxHeight),
        cropperPosition.y2 - cropperState.cropperScaledMinHeight);
      break;
    case 'top':
      cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - cropperState.cropperScaledMaxHeight),
        cropperPosition.y2 - cropperState.cropperScaledMinHeight);
      break;
    case 'topright':
      cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + cropperState.cropperScaledMaxWidth),
        cropperPosition.x1 + cropperState.cropperScaledMinWidth);
      cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - cropperState.cropperScaledMaxHeight),
        cropperPosition.y2 - cropperState.cropperScaledMinHeight);
      break;
    case 'right':
      cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + cropperState.cropperScaledMaxWidth),
        cropperPosition.x1 + cropperState.cropperScaledMinWidth);
      break;
    case 'bottomright':
      cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + cropperState.cropperScaledMaxWidth),
        cropperPosition.x1 + cropperState.cropperScaledMinWidth);
      cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + cropperState.cropperScaledMaxHeight),
        cropperPosition.y1 + cropperState.cropperScaledMinHeight);
      break;
    case 'bottom':
      cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + cropperState.cropperScaledMaxHeight),
        cropperPosition.y1 + cropperState.cropperScaledMinHeight);
      break;
    case 'bottomleft':
      cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - cropperState.cropperScaledMaxWidth),
        cropperPosition.x2 - cropperState.cropperScaledMinWidth);
      cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + cropperState.cropperScaledMaxHeight),
        cropperPosition.y1 + cropperState.cropperScaledMinHeight);
      break;
    case 'center':
      const scale = 'scale' in event ? event.scale : 1;
      const newWidth = Math.min(
        Math.max(cropperState.cropperScaledMinWidth, (Math.abs(moveStart.cropper.x2 - moveStart.cropper.x1)) * scale),
        cropperState.cropperScaledMaxWidth);
      const newHeight = Math.min(
        Math.max(cropperState.cropperScaledMinHeight, (Math.abs(moveStart.cropper.y2 - moveStart.cropper.y1)) * scale),
        cropperState.cropperScaledMaxHeight);
      cropperPosition.x1 = moveStart.clientX - newWidth / 2;
      cropperPosition.x2 = moveStart.clientX + newWidth / 2;
      cropperPosition.y1 = moveStart.clientY - newHeight / 2;
      cropperPosition.y2 = moveStart.clientY + newHeight / 2;
      if (cropperPosition.x1 < 0) {
        cropperPosition.x2 -= cropperPosition.x1;
        cropperPosition.x1 = 0;
      } else if (cropperPosition.x2 > cropperState.maxSize!.width) {
        cropperPosition.x1 -= (cropperPosition.x2 - cropperState.maxSize!.width);
        cropperPosition.x2 = cropperState.maxSize!.width;
      }
      if (cropperPosition.y1 < 0) {
        cropperPosition.y2 -= cropperPosition.y1;
        cropperPosition.y1 = 0;
      } else if (cropperPosition.y2 > cropperState.maxSize!.height) {
        cropperPosition.y1 -= (cropperPosition.y2 - cropperState.maxSize!.height);
        cropperPosition.y2 = cropperState.maxSize!.height;
      }
      break;
  }

  if (cropperState.options.maintainAspectRatio) {
    return checkAspectRatio(moveStart.position!, cropperPosition, cropperState);
  } else {
    return cropperPosition;
  }
}

export function checkAspectRatio(position: string, cropperPosition: CropperPosition, cropperState: CropperState): CropperPosition {
  cropperPosition = {...cropperPosition};
  let overflowX = 0;
  let overflowY = 0;
  switch (position) {
    case 'top':
      cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * cropperState.options.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - cropperState.maxSize!.width, 0);
      overflowY = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? (overflowY * cropperState.options.aspectRatio) : overflowX;
        cropperPosition.y1 += (overflowY * cropperState.options.aspectRatio) > overflowX ? overflowY : overflowX / cropperState.options.aspectRatio;
      }
      break;
    case 'bottom':
      cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * cropperState.options.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - cropperState.maxSize!.width, 0);
      overflowY = Math.max(cropperPosition.y2 - cropperState.maxSize!.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? (overflowY * cropperState.options.aspectRatio) : overflowX;
        cropperPosition.y2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? overflowY : (overflowX / cropperState.options.aspectRatio);
      }
      break;
    case 'topleft':
      cropperPosition.y1 = cropperPosition.y2 - (cropperPosition.x2 - cropperPosition.x1) / cropperState.options.aspectRatio;
      overflowX = Math.max(0 - cropperPosition.x1, 0);
      overflowY = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x1 += (overflowY * cropperState.options.aspectRatio) > overflowX ? (overflowY * cropperState.options.aspectRatio) : overflowX;
        cropperPosition.y1 += (overflowY * cropperState.options.aspectRatio) > overflowX ? overflowY : overflowX / cropperState.options.aspectRatio;
      }
      break;
    case 'topright':
      cropperPosition.y1 = cropperPosition.y2 - (cropperPosition.x2 - cropperPosition.x1) / cropperState.options.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - cropperState.maxSize!.width, 0);
      overflowY = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? (overflowY * cropperState.options.aspectRatio) : overflowX;
        cropperPosition.y1 += (overflowY * cropperState.options.aspectRatio) > overflowX ? overflowY : overflowX / cropperState.options.aspectRatio;
      }
      break;
    case 'right':
    case 'bottomright':
      cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / cropperState.options.aspectRatio;
      overflowX = Math.max(cropperPosition.x2 - cropperState.maxSize!.width, 0);
      overflowY = Math.max(cropperPosition.y2 - cropperState.maxSize!.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? (overflowY * cropperState.options.aspectRatio) : overflowX;
        cropperPosition.y2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? overflowY : overflowX / cropperState.options.aspectRatio;
      }
      break;
    case 'left':
    case 'bottomleft':
      cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / cropperState.options.aspectRatio;
      overflowX = Math.max(0 - cropperPosition.x1, 0);
      overflowY = Math.max(cropperPosition.y2 - cropperState.maxSize!.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        cropperPosition.x1 += (overflowY * cropperState.options.aspectRatio) > overflowX ? (overflowY * cropperState.options.aspectRatio) : overflowX;
        cropperPosition.y2 -= (overflowY * cropperState.options.aspectRatio) > overflowX ? overflowY : overflowX / cropperState.options.aspectRatio;
      }
      break;
    case 'center':
      cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * cropperState.options.aspectRatio;
      cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / cropperState.options.aspectRatio;
      const overflowX1 = Math.max(0 - cropperPosition.x1, 0);
      const overflowX2 = Math.max(cropperPosition.x2 - cropperState.maxSize!.width, 0);
      const overflowY1 = Math.max(cropperPosition.y2 - cropperState.maxSize!.height, 0);
      const overflowY2 = Math.max(0 - cropperPosition.y1, 0);
      if (overflowX1 > 0 || overflowX2 > 0 || overflowY1 > 0 || overflowY2 > 0) {
        cropperPosition.x1 += (overflowY1 * cropperState.options.aspectRatio) > overflowX1 ? (overflowY1 * cropperState.options.aspectRatio) : overflowX1;
        cropperPosition.x2 -= (overflowY2 * cropperState.options.aspectRatio) > overflowX2 ? (overflowY2 * cropperState.options.aspectRatio) : overflowX2;
        cropperPosition.y1 += (overflowY2 * cropperState.options.aspectRatio) > overflowX2 ? overflowY2 : overflowX2 / cropperState.options.aspectRatio;
        cropperPosition.y2 -= (overflowY1 * cropperState.options.aspectRatio) > overflowX1 ? overflowY1 : overflowX1 / cropperState.options.aspectRatio;
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
