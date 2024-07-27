import { CropperPosition } from "../interfaces";
import { ImageCropperState } from "../state/image-cropper-state";

/*
RULES FOR THESE FUNCTIONS
- They set the internal values for cropper static, min and max.
- They compute these values accoriding to some rules (mentioned below).
- There's a new minForAccessibility value in state, to prevent unclickable buttons when resizing (someone opened 
  an issue about this).
- Static sides are created by inputs AND when internal min > internal max.
  * Weird, but it can happen.
- Static side leads to hidden resize squares and cursor type updated in visible ones.
  * Still debating whether this is a good idea. Some sort of disabled indication through css styles might 
    be more communicative for users.
  * This happens in image-cropper.ts and image-cropper.scss just writing the rule here so it's in one place.
- Biggest possible internal min, max and static values are bound by maxSize.
- Smallest internal min is bound by minForAccessibility BUT smallest internal max and static can be smaller. If   
  so, the side becomes static.
  * Making the side static is hopefully more communicative for the user and resize is stopped 
    from being triggerd unnecessarily. 
- If two static sides and mantain aspect ratio is applied, mantain aspect ratio is ignored.  
- Always check static/min/max width and height together (as in min width and height, max width and height...). A 
  previous state could've changed the internal value of one of the sides.
- Always set internal statics after setting internal min and max sides, cos remember that if internal min > 
  internal max, the side becomes static. The rule might need to be applied or unapplied. Also check this when mantainAspectRatio is true. The same rule applied there too of course. 
- Never update non-internal state values of cropper size bounds. We need them clean so we can use them again when 
  state changes.
*/

export function setInternalMinWidthAndHeight(
  state: ImageCropperState
): void {
  state.internalMinWidth = state.cropperMinWidth
    ? Math.min(
        state.maxSize.width,
        Math.max(
          state.cropperMinSizeForAccessibility,
          (state.cropperMinWidth / state.loadedImage!.transformed.image.width) * state.maxSize.width
        )
      )
    : state.cropperMinSizeForAccessibility;
  state.internalMinHeight = state.cropperMinHeight
    ? Math.min(
        state.maxSize.height,
        Math.max(
          state.cropperMinSizeForAccessibility,
          (state.cropperMinHeight /
            state.loadedImage!.transformed.image.height) * state.maxSize.height
        )
      )
    : state.cropperMinSizeForAccessibility;
}

export function setInternalMaxWidthAndHeight(state: ImageCropperState): void {
  state.internalMaxWidth = state.cropperMaxWidth
    ? Math.min(
        state.maxSize.width,
        (state.cropperMaxWidth / state.loadedImage!.transformed.image.width) * state.maxSize.width
      )
    : state.maxSize.width;
  state.internalMaxHeight = state.cropperMaxHeight
    ? Math.min(
        state.maxSize.height,
        (state.cropperMaxHeight / state.loadedImage!.transformed.image.height) * state.maxSize.height
      )
    : state.maxSize.height;
}

export function setInternalStaticWidthAndHeight(state: ImageCropperState): void {
  if (state.cropperStaticWidth) {
    state.internalStaticWidth = Math.min(
      state.maxSize.width,
      state.cropperStaticWidth
    );
  } else if (state.internalMinWidth >= state.internalMaxWidth) {
    state.internalStaticWidth = state.internalMaxWidth;
  } else {
    state.internalStaticWidth = 0;
  }

  if (state.cropperStaticHeight) {
    state.internalStaticHeight = Math.min(
      state.maxSize.height,
      state.cropperStaticHeight
    );
  } else if (state.internalMinHeight >= state.internalMaxHeight) {
    state.internalStaticHeight = state.internalMaxHeight;
  } else {
    state.internalStaticHeight = 0;
  }
}

export function checkBoundsFollowAspectRatio(state: ImageCropperState): void {
  // logging here cos this fn is always triggered when there are changes to cropper size bounds (min, max, static).

  /*
  const prevStaticWidth = state.internalStaticWidth; //
  const prevStaticHeight = state.internalStaticHeight; //
  const prevMinWidth = state.internalMinWidth; //
  const prevMinHeight = state.internalMinHeight; //
  const prevMaxWidth = state.internalMaxWidth; //
  const prevMaxHeight = state.internalMaxHeight; //

  if (!state.maintainAspectRatio || (state.internalStaticWidth && state.internalStaticHeight)) { //      
    console.log('\n setting cropper bounds',
      '\n ' , 
      '\n state before',
      '\n   cropperStatic ', state.cropperStaticWidth, state.cropperStaticHeight,
      '\n   cropperMin    ', state.cropperMinWidth, state.cropperMinHeight,
      '\n   cropperMax    ', state.cropperMaxWidth, state.cropperMaxHeight,
      '\n ' , 
      '\n local after',
      '\n   cropperStatic ', state.internalStaticWidth, state.internalStaticHeight,
      '\n   cropperMin    ', state.internalMinWidth, state.internalMinHeight,
      '\n   cropperMax    ', state.internalMaxWidth, state.internalMaxHeight,
      '\n ' , 
    );
  }
  */

  if (!state.maintainAspectRatio) return;
  if (state.internalStaticWidth && state.internalStaticHeight) return;

  state.internalStaticWidth || state.internalStaticHeight
    ? followAspectRatioWhenOneStaticSide(state)
    : followAspectRatioWhenNoStaticSide(state);
 
  /*  
  console.log('\n setting cropper bounds',
    '\n ' , 
    '\n state beofre',
    '\n   cropperStatic ', state.cropperStaticWidth, state.cropperStaticHeight,
    '\n   cropperMin    ', state.cropperMinWidth, state.cropperMinHeight,
    '\n   cropperMax    ', state.cropperMaxWidth, state.cropperMaxHeight,
    '\n ' , 
    '\n local after',
    '\n   cropperStatic ', prevStaticWidth, prevStaticHeight,
    '\n   cropperMin    ', prevMinWidth, prevMinHeight,
    '\n   cropperMax    ', prevMaxWidth, prevMaxHeight,
    '\n ' , 
    '\n local after mantain aspect ratio',
    '\n   cropperStatic ', state.internalStaticWidth, state.internalStaticHeight,
    '\n   cropperMin    ', state.internalMinWidth, state.internalMinHeight,
    '\n   cropperMax    ', state.internalMaxWidth, state.internalMaxHeight,
    '\n ' , 
  );
  */
}

function followAspectRatioWhenOneStaticSide(state: ImageCropperState) {
  if (state.internalStaticWidth) {
    state.internalStaticHeight = state.internalStaticWidth / state.aspectRatio;
    if (state.internalStaticHeight > state.maxSize.height) {
      state.internalStaticHeight = state.maxSize.height;
      state.internalStaticWidth = state.maxSize.height * state.aspectRatio;
    }
  } else if (state.internalStaticHeight) {
    state.internalStaticWidth = state.internalStaticHeight * state.aspectRatio;
    if (state.internalStaticWidth > state.maxSize.width) {
      state.internalStaticWidth = state.maxSize.width;
      state.internalStaticHeight = state.maxSize.width / state.aspectRatio;
    }
  }
}

function followAspectRatioWhenNoStaticSide(state: ImageCropperState) {
  if (state.internalMinWidth <= state.internalMinHeight * state.aspectRatio) {
    state.internalMinWidth = state.internalMinHeight * state.aspectRatio;
  } else {
    state.internalMinHeight = state.internalMinWidth / state.aspectRatio;
  } // res will always respect min values BUT could be bigger than max values (including maxSize)

  if (state.internalMaxWidth >= state.internalMaxHeight * state.aspectRatio) {
    state.internalMaxWidth = state.internalMaxHeight * state.aspectRatio;
  } else {
    state.internalMaxHeight = state.internalMaxWidth / state.aspectRatio;
  } // res will always respect max values BUT could be smaller than min values (including minForAccesiblity BUT only if the img is of a smaller dimension)

  if (state.internalMinWidth >= state.internalMaxWidth
    || state.internalMinHeight >= state.internalMaxHeight
  ) {
    state.internalStaticWidth = state.internalMaxWidth;
    state.internalStaticHeight = state.internalMaxHeight;
  } // res will always respect max values BUT could be smaller than min values if smaller img. But this is okay as the cropper becomes static (no unclickable buttons problem).
}

export function setAllInternalSizes(
  state: ImageCropperState
): void {
  setInternalMinWidthAndHeight(state);
  setInternalMaxWidthAndHeight(state);
  setInternalStaticWidthAndHeight(state);
  checkBoundsFollowAspectRatio(state);
}

// delete
function isOK(cropper: CropperPosition, state: ImageCropperState) {
  const width = cropper.x2 - cropper.x1;
  const height = cropper.y2 - cropper.y1;

  const roundWidth = round(width);
  const roundHeight = round(height);
  const roundMinWidth = round(state.internalMinWidth);
  const roundMinHeight = round(state.internalMinHeight);
  const roundMaxWidth = round(state.internalMaxWidth);
  const roundMaxHeight = round(state.internalMaxHeight);
  const roundStaticWidth = round(state.internalStaticWidth);
  const roundStaticHeight = round(state.internalStaticHeight);

  if (roundStaticWidth) {
    if (roundWidth !== roundStaticWidth) {
      console.warn(
        "\n isOk",
        "\n   cropperWidth ",
        roundWidth,
        width,
        "\n   cropperStaticWidth ",
        roundMaxWidth,
        state.internalMaxWidth
      );
    }
  } else if (roundWidth < roundMinWidth || roundWidth > roundMaxWidth) {
    console.warn(
      "\n isOk",
      "\n   cropperWidth ",
      roundWidth,
      width,
      "\n   cropperMinWidth ",
      roundMinWidth,
      state.internalMinWidth,
      "\n   cropperMaxWidth ",
      roundMaxWidth,
      state.internalMaxWidth
    );
  }

  if (roundStaticHeight) {
    if (roundHeight !== roundStaticHeight) {
      console.warn(
        "\n isOk",
        "\n   cropperHeight ",
        roundHeight,
        height,
        "\n   cropperStaticHeight ",
        roundMaxHeight,
        state.internalMaxHeight
      );
    }
  } else if (roundHeight < roundMinHeight || roundHeight > roundMaxHeight) {
    console.warn(
      "\n isOk",
      "\n   cropperHeight ",
      roundHeight,
      height,
      "\n   cropperMinHeight ",
      roundMinHeight,
      state.internalMinHeight,
      "\n   cropperMaxHeight ",
      roundMaxHeight,
      state.internalMaxHeight
    );
  }

  if (cropper.x1 < 0) {
    console.log("\n isOk", "\n cropper.x1 < 0", cropper.x1, "<", "0");
  }

  if (cropper.y1 < 0) {
    console.log("\n isOk", "\n cropper.y1 < 0", cropper.y1, "<", "0");
  }

  if (cropper.x2 > state.maxSize.width) {
    console.log(
      "\n isOk",
      "\n cropper.x2 > maxWidth",
      cropper.x2,
      ">",
      state.maxSize.width
    );
  }

  if (cropper.y2 > state.maxSize.height) {
    console.log(
      "\n isOk",
      "\n cropper.y2 > maxHeight",
      cropper.y2,
      ">",
      state.maxSize.height
    );
  }
}

// delete
function round(x: number) {
  // return Math.round(x * 1000) / 1000
  return x;
}

/* TODO
  - internalStatic sizes is not scaled but the min and max are. was that on purpose? 
  - the lib is not fully covering the relationship between transform, min, max, static cropper sizes and 
    onlyScaleDown. The user could go into the "scaled down zone" and crop "rejects the move".
*/
