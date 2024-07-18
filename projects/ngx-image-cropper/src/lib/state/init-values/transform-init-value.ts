import { ImageTransform } from './../../interfaces';

const transformInitValueToCopy: ImageTransform = {
    flipX: false,
    flipY: false,
    rotate: 0,
    scale: 1,
    translateUnit: 'px',
    translateX: 0,
    translateY: 0,  
};

export function getTransformInitValue() {
    return { ...transformInitValueToCopy };
};
