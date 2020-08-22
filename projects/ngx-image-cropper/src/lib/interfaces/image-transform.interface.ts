export interface ImageTransform {
    scale?: number;
    rotate?: number;
    flipH?: boolean;
    flipV?: boolean;
}

export const IDENTITY_IMAGE_TRANSFORM: ImageTransform = {
    scale: 1,
    rotate: 0,
    flipH: false,
    flipV: false
}
