import { CropperPosition, MoveStart, BasicEvent } from '../interfaces';
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
  - resize:
    - The cropper can be resized as long as at least one of the internal static side values is false (0). Remeber 
      both internal static sides will be true if one static side is set by parent and mantain aspect ratio is true. 
    - When mantain aspect ratio is true and resizing from one side, it's perpendicular sides will change too. So, 
      for example, if you move the left side, top and bottom also change to keep the aspect ratio. Before it would resize from a corner. 
    - When resizing from a corner, both x and y pointer movements are accounted for. There are still some "blind 
      spots", I'll try and send a video, but it's good enough for now. I've noticed google photos has the same blind spots :) Before it only resized with x pointer movements. 
    * The logic in resize works because of the logic in cropper-size-bounds.utils.ts. The internal min, max and   
      static cropper bounding sizes account for maxSize and mantain aspect ratio. It also deals with weird values for min and max that a user could have sent in accidentally, making the cropper impossible to resize, but turning the side/s to static.
    * As resizing the cropper will always be within maxSize, the maintainSize value in checkWithinMaxSizeBounds   
      is no longer necessary. 
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

  if (!newCropper) { checkWithinMaxSizeBounds(state) };

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

export function checkWithinMaxSizeBounds(state: ImageCropperState): void {
  if (state.cropper.x1 < 0) {
    state.cropper.x2 -= state.cropper.x1;
    state.cropper.x1 = 0;
  }
  if (state.cropper.y1 < 0) {
    state.cropper.y2 -= state.cropper.y1;
    state.cropper.y1 = 0;
  }
  if (state.cropper.x2 > state.maxSize.width) {
    state.cropper.x1 -= (state.cropper.x2 - state.maxSize.width);
    state.cropper.x2 = state.maxSize.width;
  }
  if (state.cropper.y2 > state.maxSize.height) {
    state.cropper.y1 -= (state.cropper.y2 - state.maxSize.height);
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

  console.log('HERE', state.internalStaticWidth, state.internalStaticHeight)
  //if (state.internalStaticWidth && state.internalStaticHeight) console.log('no resize, both static') // 
  if (state.internalStaticWidth && state.internalStaticHeight) return; 

  const moveX = getClientX(event) - moveStart.clientX;
  const moveY = getClientY(event) - moveStart.clientY;

  if (!state.internalStaticWidth) {
    if (moveStart.position!.endsWith('left')) { 
      state.cropper.x1 = Math.min(
        state.cropper.x2 - state.internalMinWidth, 
        Math.max(
          0, 
          moveStart.cropper.x1 + moveX, 
          state.cropper.x2 - state.internalMaxWidth
        )
      );
    } else if (moveStart.position!.endsWith('right')) { 
      state.cropper.x2 = Math.max(
        state.cropper.x1 + state.internalMinWidth, 
        Math.min(
          state.maxSize.width, 
          moveStart.cropper.x2 + moveX, 
          state.cropper.x1 + state.internalMaxWidth
        )
      );
    } else if (moveStart.position! === "center") {
      const newWidth = Math.min(
        state.internalMaxWidth, 
        Math.max(
          state.internalMinWidth, 
          (moveStart.cropper.x2 - moveStart.cropper.x1) * ('scale' in event ? event.scale : 1) // always positive
        )
      ); 
      state.cropper.x1 = moveStart.clientX - newWidth / 2;
      state.cropper.x2 = moveStart.clientX + newWidth / 2;
      if (state.cropper.x1 < 0) {
        state.cropper.x2 -= state.cropper.x1;
        state.cropper.x1 = 0;
      } else if (state.cropper.x2 > state.maxSize.width) {
        state.cropper.x1 -= state.cropper.x2 - state.maxSize.width;
        state.cropper.x2 = state.maxSize.width;
      } 
    }
  }

  if (!state.internalStaticHeight) {
    if (moveStart.position!.startsWith('top')) {
      state.cropper.y1 = Math.min(
        state.cropper.y2 - state.internalMinHeight, 
        Math.max(
          0, 
          moveStart.cropper.y1 + moveY, 
          state.cropper.y2 - state.internalMaxHeight
        )
      );
    } else if (moveStart.position!.startsWith('bottom')) {
      state.cropper.y2 = Math.max(
        state.cropper.y1 + state.internalMinHeight,
        Math.min(
          state.maxSize.height,
          moveStart.cropper.y2 + moveY,
          state.cropper.y1 + state.internalMaxHeight
        )
      );
    } else if (moveStart.position! === "center") { 
      const newHeight = Math.min(
        state.internalMaxHeight,
        Math.max(
          state.internalMinHeight,
          (moveStart.cropper.y2 - moveStart.cropper.y1) * ('scale' in event ? event.scale : 1) // always positive
        )
      );
      state.cropper.y1 = moveStart.clientY - newHeight / 2;
      state.cropper.y2 = moveStart.clientY  + newHeight / 2;
      if (state.cropper.y1 < 0) {
        state.cropper.y2 -= state.cropper.y1;
        state.cropper.y1 = 0;
      } else if (state.cropper.y2 > state.maxSize.height) {
        state.cropper.y1 -= state.cropper.y2 - state.maxSize.height;
        state.cropper.y2 = state.maxSize.height;
      }
    }
  }

  if (state.maintainAspectRatio && moveStart.position! !== 'center') { // center already keeps aspect ratio
    checkAspectRatioOnResize(moveStart.position!, state);
  }
}

function checkAspectRatioOnResize(position: string, state: ImageCropperState): void {
  const newWidth = (state.cropper.y2 - state.cropper.y1) * state.aspectRatio;
  const newHeight = (state.cropper.x2 - state.cropper.x1) / state.aspectRatio;

  if (position === 'left' || position === 'right') {
    let diff = (state.cropper.y2 - (state.cropper.y1 + newHeight)) / 2;
    state.cropper.y1 += diff;
    state.cropper.y2 -= diff;
    if (state.cropper.y1 < 0 || state.cropper.y2 > state.maxSize.height) {
      diff = state.cropper.y1 < state.maxSize.height - state.cropper.y2
        ? -state.cropper.y1 
        : state.cropper.y2 - state.maxSize.height;
      state.cropper.y1 += diff;
      state.cropper.y2 -= diff;
      position === 'left'
        ? state.cropper.x1 += diff * 2 * state.aspectRatio  
        : state.cropper.x2 -= diff * 2 * state.aspectRatio;
    }
    return;
  }

  if (position === 'top' || position === 'bottom') {
    let diff = (state.cropper.x2 - (state.cropper.x1 + newWidth)) / 2;
    state.cropper.x1 += diff;
    state.cropper.x2 -= diff;
    if (state.cropper.x1 < 0 || state.cropper.x2 > state.maxSize.width) {
      diff = state.cropper.x1 < state.maxSize.width - state.cropper.x2
        ? state.cropper.x1
        : state.maxSize.width - state.cropper.x2;
      state.cropper.x1 -= diff;
      state.cropper.x2 += diff;
      position === 'top'
        ? state.cropper.y1 -= diff * 2 / state.aspectRatio  
        : state.cropper.y2 += diff * 2 / state.aspectRatio;
      }
    return;
  }

  if (state.aspectRatio >= (state.cropper.x2 - state.cropper.x1) / (state.cropper.y2 - state.cropper.y1)) {
    position.startsWith('top') 
      ? state.cropper.y1 = state.cropper.y2 - newHeight
      : state.cropper.y2 = state.cropper.y1 + newHeight;
  } else {
    position.endsWith('left') 
      ? state.cropper.x1 = state.cropper.x2 - newWidth
      : state.cropper.x2 = state.cropper.x1 + newWidth;
  }
}

export function aspectRatioIsCorrect(state: ImageCropperState): boolean {
  const currentCropAspectRatio = (state.cropper.x2 - state.cropper.x1) / (state.cropper.y2 - state.cropper.y1);
  return currentCropAspectRatio === state.aspectRatio;
}

export function resizeCropperAccordingToNewMaxSize(state: ImageCropperState, ratio: number): void {
  state.cropper.x1 *= ratio;
  state.cropper.x2 *= ratio;
  state.cropper.y1 *= ratio;
  state.cropper.y2 *= ratio;
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