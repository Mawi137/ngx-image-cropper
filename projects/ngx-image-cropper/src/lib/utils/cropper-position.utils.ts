import { CropperPosition, MoveStart, BasicEvent } from '../interfaces';
import { HammerInput } from './hammer.utils';
import { ImageCropperState } from '../state/image-cropper-state';

export function checkWithinCropperSizeBounds(state: ImageCropperState, resetCropper: boolean): void {

  if (resetCropper || state.cropper.x2 === 0) {
    state.cropper.x1 = 0;
    state.cropper.y1 = 0;
    state.cropper.x2 = state.maxSize.width;
    state.cropper.y2 = state.maxSize.height;
  };

  let cropperWidth = state.cropper.x2 - state.cropper.x1;
  let cropperHeight = state.cropper.y2 - state.cropper.y1;
  const centerX = state.cropper.x1 + cropperWidth / 2;
  const centerY = state.cropper.y1 + cropperHeight / 2;

  if (state.cropperStaticHeight && state.cropperStaticWidth) {
    cropperWidth = state.maxSize.width > state.cropperStaticWidth ? 
      state.cropperStaticWidth : state.maxSize.width;
    cropperHeight = state.maxSize.height > state.cropperStaticHeight ?
      state.cropperStaticHeight : state.maxSize.height;
  } else {
    cropperWidth = Math.max(state.cropperScaledMinWidth, Math.min(cropperWidth, state.cropperScaledMaxWidth, state.maxSize.width));
    cropperHeight = Math.max(state.cropperScaledMinHeight, Math.min(cropperHeight, state.cropperScaledMaxHeight, state.maxSize.height));
    if (state.maintainAspectRatio) {
      state.maxSize.width / state.aspectRatio < state.maxSize.height
        ? cropperHeight = cropperWidth / state.aspectRatio
        : cropperWidth = cropperHeight * state.aspectRatio;
    }
  }

  state.cropper.x1 = centerX - cropperWidth / 2;
  state.cropper.x2 = state.cropper.x1 + cropperWidth;
  state.cropper.y1 = centerY - cropperHeight / 2;
  state.cropper.y2 = state.cropper.y1 + cropperHeight;
}

export function checkWithinMaxSizeBounds(state: ImageCropperState, maintainSize = false): void {
  if (state.cropper.x1 < 0) {
    state.cropper.x2 -= maintainSize ? state.cropper.x1 : 0;
    state.cropper.x1 = 0;
  }
  if (state.cropper.y1 < 0) {
    state.cropper.y2 -= maintainSize ? state.cropper.y1 : 0;
    state.cropper.y1 = 0;
  }
  if (state.cropper.x2 > state.maxSize.width) {
    state.cropper.x1 -= maintainSize ? (state.cropper.x2 - state.maxSize.width) : 0;
    state.cropper.x2 = state.maxSize.width;
  }
  if (state.cropper.y2 > state.maxSize.height) {
    state.cropper.y1 -= maintainSize ? (state.cropper.y2 - state.maxSize.height) : 0;
    state.cropper.y2 = state.maxSize.height;
  }
}

export function move(event: Event | BasicEvent, moveStart: MoveStart, cropper: CropperPosition) {
  const diffX = getClientX(event) - moveStart.clientX;
  const diffY = getClientY(event) - moveStart.clientY;

  cropper.x1 = moveStart.cropper.x1 + diffX;
  cropper.y1 = moveStart.cropper.y1 + diffY;
  cropper.x2 = moveStart.cropper.x2 + diffX;
  cropper.y2 = moveStart.cropper.y2 + diffY;
}

export function resize(event: Event | BasicEvent | HammerInput, moveStart: MoveStart, state: ImageCropperState): void {
  const moveX = getClientX(event) - moveStart.clientX;
  const moveY = getClientY(event) - moveStart.clientY;
  switch (moveStart.position) {
    case 'left':
      state.cropper.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, state.cropper.x2 - state.cropperScaledMaxWidth),
        state.cropper.x2 - state.cropperScaledMinWidth);
      break;
    case 'topleft':
      state.cropper.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, state.cropper.x2 - state.cropperScaledMaxWidth),
        state.cropper.x2 - state.cropperScaledMinWidth);
      state.cropper.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, state.cropper.y2 - state.cropperScaledMaxHeight),
        state.cropper.y2 - state.cropperScaledMinHeight);
      break;
    case 'top':
      state.cropper.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, state.cropper.y2 - state.cropperScaledMaxHeight),
        state.cropper.y2 - state.cropperScaledMinHeight);
      break;
    case 'topright':
      state.cropper.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, state.cropper.x1 + state.cropperScaledMaxWidth),
        state.cropper.x1 + state.cropperScaledMinWidth);
      state.cropper.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, state.cropper.y2 - state.cropperScaledMaxHeight),
        state.cropper.y2 - state.cropperScaledMinHeight);
      break;
    case 'right':
      state.cropper.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, state.cropper.x1 + state.cropperScaledMaxWidth),
        state.cropper.x1 + state.cropperScaledMinWidth);
      break;
    case 'bottomright':
      state.cropper.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, state.cropper.x1 + state.cropperScaledMaxWidth),
        state.cropper.x1 + state.cropperScaledMinWidth);
      state.cropper.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, state.cropper.y1 + state.cropperScaledMaxHeight),
        state.cropper.y1 + state.cropperScaledMinHeight);
      break;
    case 'bottom':
      state.cropper.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, state.cropper.y1 + state.cropperScaledMaxHeight),
        state.cropper.y1 + state.cropperScaledMinHeight);
      break;
    case 'bottomleft':
      state.cropper.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, state.cropper.x2 - state.cropperScaledMaxWidth),
        state.cropper.x2 - state.cropperScaledMinWidth);
      state.cropper.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, state.cropper.y1 + state.cropperScaledMaxHeight),
        state.cropper.y1 + state.cropperScaledMinHeight);
      break;
    case 'center':
      const scale = 'scale' in event ? event.scale : 1;
      const newWidth = Math.min(
        Math.max(state.cropperScaledMinWidth, (Math.abs(moveStart.cropper.x2 - moveStart.cropper.x1)) * scale),
        state.cropperScaledMaxWidth);
      const newHeight = Math.min(
        Math.max(state.cropperScaledMinHeight, (Math.abs(moveStart.cropper.y2 - moveStart.cropper.y1)) * scale),
        state.cropperScaledMaxHeight);
      state.cropper.x1 = moveStart.clientX - newWidth / 2;
      state.cropper.x2 = moveStart.clientX + newWidth / 2;
      state.cropper.y1 = moveStart.clientY - newHeight / 2;
      state.cropper.y2 = moveStart.clientY + newHeight / 2;
      if (state.cropper.x1 < 0) {
        state.cropper.x2 -= state.cropper.x1;
        state.cropper.x1 = 0;
      } else if (state.cropper.x2 > state.maxSize.width) {
        state.cropper.x1 -= (state.cropper.x2 - state.maxSize.width);
        state.cropper.x2 = state.maxSize.width;
      }
      if (state.cropper.y1 < 0) {
        state.cropper.y2 -= state.cropper.y1;
        state.cropper.y1 = 0;
      } else if (state.cropper.y2 > state.maxSize.height) {
        state.cropper.y1 -= (state.cropper.y2 - state.maxSize.height);
        state.cropper.y2 = state.maxSize.height;
      }
      break;
  }

  if (state.maintainAspectRatio) {
    checkAspectRatio(moveStart.position!, state);
  }
}

export function checkAspectRatio(position: string, state: ImageCropperState): void {
  let overflowX = 0;
  let overflowY = 0;

  switch (position) {
    case 'top':
      state.cropper.x2 = state.cropper.x1 + (state.cropper.y2 - state.cropper.y1) * state.aspectRatio;
      overflowX = Math.max(state.cropper.x2 - state.maxSize.width, 0);
      overflowY = Math.max(0 - state.cropper.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        state.cropper.x2 -= (overflowY * state.aspectRatio) > overflowX ? (overflowY * state.aspectRatio) : overflowX;
        state.cropper.y1 += (overflowY * state.aspectRatio) > overflowX ? overflowY : overflowX / state.aspectRatio;
      }
      break;
    case 'bottom':
      state.cropper.x2 = state.cropper.x1 + (state.cropper.y2 - state.cropper.y1) * state.aspectRatio;
      overflowX = Math.max(state.cropper.x2 - state.maxSize.width, 0);
      overflowY = Math.max(state.cropper.y2 - state.maxSize.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        state.cropper.x2 -= (overflowY * state.aspectRatio) > overflowX ? (overflowY * state.aspectRatio) : overflowX;
        state.cropper.y2 -= (overflowY * state.aspectRatio) > overflowX ? overflowY : (overflowX / state.aspectRatio);
      }
      break;
    case 'topleft':
      state.cropper.y1 = state.cropper.y2 - (state.cropper.x2 - state.cropper.x1) / state.aspectRatio;
      overflowX = Math.max(0 - state.cropper.x1, 0);
      overflowY = Math.max(0 - state.cropper.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        state.cropper.x1 += (overflowY * state.aspectRatio) > overflowX ? (overflowY * state.aspectRatio) : overflowX;
        state.cropper.y1 += (overflowY * state.aspectRatio) > overflowX ? overflowY : overflowX / state.aspectRatio;
      }
      break;
    case 'topright':
      state.cropper.y1 = state.cropper.y2 - (state.cropper.x2 - state.cropper.x1) / state.aspectRatio;
      overflowX = Math.max(state.cropper.x2 - state.maxSize.width, 0);
      overflowY = Math.max(0 - state.cropper.y1, 0);
      if (overflowX > 0 || overflowY > 0) {
        state.cropper.x2 -= (overflowY * state.aspectRatio) > overflowX ? (overflowY * state.aspectRatio) : overflowX;
        state.cropper.y1 += (overflowY * state.aspectRatio) > overflowX ? overflowY : overflowX / state.aspectRatio;
      }
      break;
    case 'right':
    case 'bottomright':
      state.cropper.y2 = state.cropper.y1 + (state.cropper.x2 - state.cropper.x1) / state.aspectRatio;
      overflowX = Math.max(state.cropper.x2 - state.maxSize.width, 0);
      overflowY = Math.max(state.cropper.y2 - state.maxSize.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        state.cropper.x2 -= (overflowY * state.aspectRatio) > overflowX ? (overflowY * state.aspectRatio) : overflowX;
        state.cropper.y2 -= (overflowY * state.aspectRatio) > overflowX ? overflowY : overflowX / state.aspectRatio;
      }
      break;
    case 'left':
    case 'bottomleft':
      state.cropper.y2 = state.cropper.y1 + (state.cropper.x2 - state.cropper.x1) / state.aspectRatio;
      overflowX = Math.max(0 - state.cropper.x1, 0);
      overflowY = Math.max(state.cropper.y2 - state.maxSize.height, 0);
      if (overflowX > 0 || overflowY > 0) {
        state.cropper.x1 += (overflowY * state.aspectRatio) > overflowX ? (overflowY * state.aspectRatio) : overflowX;
        state.cropper.y2 -= (overflowY * state.aspectRatio) > overflowX ? overflowY : overflowX / state.aspectRatio;
      }
      break;
    case 'center':
      state.cropper.x2 = state.cropper.x1 + (state.cropper.y2 - state.cropper.y1) * state.aspectRatio;
      state.cropper.y2 = state.cropper.y1 + (state.cropper.x2 - state.cropper.x1) / state.aspectRatio;
      const overflowX1 = Math.max(0 - state.cropper.x1, 0);
      const overflowX2 = Math.max(state.cropper.x2 - state.maxSize.width, 0);
      const overflowY1 = Math.max(state.cropper.y2 - state.maxSize.height, 0);
      const overflowY2 = Math.max(0 - state.cropper.y1, 0);
      if (overflowX1 > 0 || overflowX2 > 0 || overflowY1 > 0 || overflowY2 > 0) {
        state.cropper.x1 += (overflowY1 * state.aspectRatio) > overflowX1 ? (overflowY1 * state.aspectRatio) : overflowX1;
        state.cropper.x2 -= (overflowY2 * state.aspectRatio) > overflowX2 ? (overflowY2 * state.aspectRatio) : overflowX2;
        state.cropper.y1 += (overflowY2 * state.aspectRatio) > overflowX2 ? overflowY2 : overflowX2 / state.aspectRatio;
        state.cropper.y2 -= (overflowY1 * state.aspectRatio) > overflowX1 ? overflowY1 : overflowX1 / state.aspectRatio;
      }
      break;
  }
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