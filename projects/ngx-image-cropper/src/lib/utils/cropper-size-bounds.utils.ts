import { ImageCropperState } from "../state/image-cropper-state";

export function setCropperScaledMinSize(state: ImageCropperState): void {
  if (state.loadedImage?.transformed.size) {
    setCropperScaledMinWidth(state);
    setCropperScaledMinHeight(state);
  } else {
    state.cropperScaledMinWidth = 20;
    state.cropperScaledMinHeight = 20;
  }
}

export function setCropperScaledMinWidth(state: ImageCropperState): void {
  state.cropperScaledMinWidth = state.cropperMinWidth > 0
    ? Math.max(20, (state.cropperMinWidth / state.loadedImage!.transformed.size.width) * state.maxSize.width)
    : 20;
}

export function setCropperScaledMinHeight(state: ImageCropperState): void {
  if (state.maintainAspectRatio) {
    state.cropperScaledMinHeight = Math.max(20, state.cropperScaledMinWidth / state.aspectRatio);
  } else if (state.cropperMinHeight > 0) {
    state.cropperScaledMinHeight = Math.max(20, (state.cropperMinHeight / state.loadedImage!.transformed.size.height) * state.maxSize.height);
  } else {
    state.cropperScaledMinHeight = 20;
  }
}

export function setCropperScaledMaxSize(state: ImageCropperState): void {
  if (state.loadedImage?.transformed.size) {
    const ratio = state.loadedImage.transformed.size.width / state.maxSize.width;
    state.cropperScaledMaxWidth = state.cropperMaxWidth > 20
      ? state.cropperMaxWidth / ratio
      : state.maxSize.width;
    state.cropperScaledMaxHeight = state.cropperMaxHeight > 20
      ? state.cropperMaxHeight / ratio
      : state.maxSize.height;
    if (state.maintainAspectRatio) {
      if (state.cropperScaledMaxWidth > state.cropperScaledMaxHeight * state.aspectRatio) {
        state.cropperScaledMaxWidth = state.cropperScaledMaxHeight * state.aspectRatio;
      } else if (state.cropperScaledMaxWidth < state.cropperScaledMaxHeight * state.aspectRatio) {
        state.cropperScaledMaxHeight = state.cropperScaledMaxWidth / state.aspectRatio;
      }
    }
  } else {
    state.cropperScaledMaxWidth = state.maxSize.width;
    state.cropperScaledMaxHeight = state.maxSize.height;
  }
}
