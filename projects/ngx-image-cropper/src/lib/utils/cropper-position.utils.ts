import { CropperPosition, MoveStart, BasicEvent, Dimensions } from '../interfaces';
import { HammerInput } from './hammer.utils';
import { ImageCropperState } from '../state/image-cropper-state';

/*
RULES FOR THESE FUNCTIONS
- They update state cropper.
- checkSizeAndPosition:
    - It can "create" a new cropper OR use the existing cropper's size and position.
    - When there's a "new cropper", the cropper is made as big as possible and it is centered.
    - When there's an existing cropper, the cropper is modified in a way that there isn't a huge change. It's   
      "nudged" into a correct size and into position if any of these were wrong.
    - It makes sure the cropper is within cropper bounds –size and not sitting outside the img cointainer–, and  
      follows the correct aspect ratio if applied.
    * There's no longer a resetCropOnAspectRatioChange state value. Developers can reset the cropper whenever 
      they want by setting it to the initial cropper value. Developers might want to reset the cropper at different times: changes to mantain aspect ratio, aspect ratio itself, canvas rotation, contain within aspect ratio, flip... Instead of having and mantaining boolean values for each, developers can choose when to reset by using the getCropperInitValue() (returns all values as zero). This will make checkSizeAndPosition create a "new" cropper.
    * The only time the lib resets the cropper is when reset() is called in image-cropper.component.ts (when 
      there's a new imageSource).
    * The logic in checkSizeAndPosition works because of the logic in cropper-size-bounds.utils.ts. The internal  
      bounding sizes already consider aspect ratio and static sides. That's why, for example, if it's a new cropper, we don't need to check mantain aspect ratio. internalMaxSize and internalStaticSide already consider it.
*/


export function checkSizeAndPosition(state: ImageCropperState): void {

  let newCropper = false; 

  if (state.cropper.x2 === 0) {
    state.cropper.x1 = 0;
    state.cropper.y1 = 0;
    state.cropper.x2 = state.maxSize.width;
    state.cropper.y2 = state.maxSize.height;
    newCropper = true;
  };

  let cropperWidth = state.cropper.x2 - state.cropper.x1;
  let cropperHeight = state.cropper.y2 - state.cropper.y1;
  const prevWidth = cropperWidth;
  const prevHeight = cropperHeight;
  const prevCenterX = state.cropper.x1 + cropperWidth / 2;
  const prevCenterY = state.cropper.y1 + cropperHeight / 2;

  if (newCropper) {
    cropperWidth = state.internalStaticWidth 
      ? state.internalStaticWidth
      : Math.min(cropperWidth, state.internalMaxWidth);
    cropperHeight = state.internalStaticHeight
      ? state.internalStaticHeight
      : Math.min(cropperHeight, state.internalMaxHeight);
  } 
  else if (state.internalStaticWidth && state.internalStaticHeight) {
    cropperWidth = state.internalStaticWidth;
    cropperHeight = state.internalStaticHeight;
  } 
  else if (state.internalStaticWidth) {
    cropperWidth = state.internalStaticWidth;
    cropperHeight = state.maintainAspectRatio 
      ? cropperWidth / state.aspectRatio 
      : Math.max(state.internalMinHeight, Math.min(cropperHeight, state.internalMaxHeight));
  } 
  else if (state.internalStaticHeight) {
    cropperHeight = state.internalStaticHeight;
    cropperWidth = state.maintainAspectRatio 
      ? cropperHeight * state.aspectRatio 
      : Math.max(state.internalMinWidth, Math.min(cropperWidth, state.internalMaxWidth));
  } 
  else if (!state.maintainAspectRatio) {
    cropperWidth = Math.max(state.internalMinWidth, Math.min(cropperWidth, state.internalMaxWidth));
    cropperHeight = Math.max(state.internalMinHeight, Math.min(cropperHeight, state.internalMaxHeight));
  } 
  else {
    // const start = {cropperWidth, cropperHeight}; // 
    const prevAspectRatio = prevWidth / prevHeight;
    const maxSizeAspectRatio = state.maxSize.width / state.maxSize.height;
    if (prevAspectRatio > maxSizeAspectRatio) {
      cropperWidth = prevWidth;
      cropperHeight = cropperWidth / maxSizeAspectRatio;
    } else {
      cropperHeight = prevHeight;
      cropperWidth = cropperHeight * maxSizeAspectRatio;
    }
    // const bbox = {cropperWidth, cropperHeight}; // 
    if (state.aspectRatio > maxSizeAspectRatio) {
      cropperWidth = Math.max(state.internalMinWidth, Math.min(cropperWidth, state.internalMaxWidth));
      cropperHeight = cropperWidth / state.aspectRatio;
    } else {
      cropperHeight = Math.max(state.internalMinHeight, Math.min(cropperHeight, state.internalMaxHeight));
      cropperWidth = cropperHeight * state.aspectRatio;
    }
    /*
    console.log('\n fit to aspect ratio in checkWithinCropperSizeBounds', 
      '\n   cropperStatic ', state.internalStaticWidth, state.internalStaticHeight,
      '\n   cropperMin    ', state.internalMinWidth, state.internalMinHeight,
      '\n   cropperMax    ', state.internalMaxWidth, state.internalMaxHeight,
      '\n  ',
      '\n   prev and max ratios     ', prevAspectRatio, maxSizeAspectRatio,
      '\n   state and end ratios    ', state.aspectRatio, cropperWidth / cropperHeight,
      '\n  ',
      '\n   prev  ', prevWidth, prevHeight,
      '\n   start ', start.cropperWidth, start.cropperHeight,
      '\n   bbox  ', bbox.cropperWidth, bbox.cropperHeight,
      '\n   end   ', cropperWidth, cropperHeight,
      '\n  '
    );
    */
  }

  state.cropper.x1 = prevCenterX - cropperWidth / 2;
  state.cropper.x2 = state.cropper.x1 + cropperWidth;
  state.cropper.y1 = prevCenterY - cropperHeight / 2;
  state.cropper.y2 = state.cropper.y1 + cropperHeight;

  if (!newCropper) { checkWithinMaxSizeBounds(state, true) };

  /*
  console.log('\n checkWithinBounds', 
  '\n ', 
  '\n   cropper static ', state.internalStaticWidth, state.internalStaticHeight,
  '\n   cropper min    ', state.internalMinWidth, state.internalMinHeight,
  '\n   cropper max    ', state.internalMaxWidth, state.internalMaxHeight,
  '\n  ',
  '\n   prev cropper ', prevWidth, prevHeight,
  '\n   prev center  ', prevCenterX, prevCenterY,
  '\n  ', 
  '\n   cropper size         ', cropperWidth, cropperHeight,
  '\n   cropper aspect ratio ', cropperWidth / cropperHeight,
  '\n   cropper center       ', state.cropper.x1 + cropperWidth / 2, state.cropper.y1 + cropperHeight / 2,
  '\n ',
  );
  */
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
      state.cropper.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, state.cropper.x2 - state.internalMaxWidth),
        state.cropper.x2 - state.internalMinWidth);
      break;
    case 'topleft':
      state.cropper.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, state.cropper.x2 - state.internalMaxWidth),
        state.cropper.x2 - state.internalMinWidth);
      state.cropper.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, state.cropper.y2 - state.internalMaxHeight),
        state.cropper.y2 - state.internalMinHeight);
      break;
    case 'top':
      state.cropper.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, state.cropper.y2 - state.internalMaxHeight),
        state.cropper.y2 - state.internalMinHeight);
      break;
    case 'topright':
      state.cropper.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, state.cropper.x1 + state.internalMaxWidth),
        state.cropper.x1 + state.internalMinWidth);
      state.cropper.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, state.cropper.y2 - state.internalMaxHeight),
        state.cropper.y2 - state.internalMinHeight);
      break;
    case 'right':
      state.cropper.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, state.cropper.x1 + state.internalMaxWidth),
        state.cropper.x1 + state.internalMinWidth);
      break;
    case 'bottomright':
      state.cropper.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, state.cropper.x1 + state.internalMaxWidth),
        state.cropper.x1 + state.internalMinWidth);
      state.cropper.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, state.cropper.y1 + state.internalMaxHeight),
        state.cropper.y1 + state.internalMinHeight);
      break;
    case 'bottom':
      state.cropper.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, state.cropper.y1 + state.internalMaxHeight),
        state.cropper.y1 + state.internalMinHeight);
      break;
    case 'bottomleft':
      state.cropper.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, state.cropper.x2 - state.internalMaxWidth),
        state.cropper.x2 - state.internalMinWidth);
      state.cropper.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, state.cropper.y1 + state.internalMaxHeight),
        state.cropper.y1 + state.internalMinHeight);
      break;
    case 'center':
      const scale = 'scale' in event ? event.scale : 1;
      const newWidth = Math.min(
        Math.max(state.internalMinWidth, (Math.abs(moveStart.cropper.x2 - moveStart.cropper.x1)) * scale),
        state.internalMaxWidth);
      const newHeight = Math.min(
        Math.max(state.internalMinHeight, (Math.abs(moveStart.cropper.y2 - moveStart.cropper.y1)) * scale),
        state.internalMaxHeight);
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

export function aspectRatioIsCorrect(state: ImageCropperState): boolean {
  const currentCropAspectRatio = (state.cropper.x2 - state.cropper.x1) / (state.cropper.y2 - state.cropper.y1);
  return currentCropAspectRatio === state.aspectRatio;
}

export function resizeCropperAccordingToNewMaxSize(state: ImageCropperState, oldMaxSize: Dimensions): void {
  if (oldMaxSize.width !== state.maxSize.width || oldMaxSize.height !== state.maxSize.height) {
    state.cropper.x1 = state.cropper.x1 * state.maxSize.width / oldMaxSize.width;
    state.cropper.x2 = state.cropper.x2 * state.maxSize.width / oldMaxSize.width;
    state.cropper.y1 = state.cropper.y1 * state.maxSize.height / oldMaxSize.height;
    state.cropper.y2 = state.cropper.y2 * state.maxSize.height / oldMaxSize.height;
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