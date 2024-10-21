import { CropperPosition } from './../../interfaces';

export function getCropperInitValue() {
    return { ...cropperInitValue };
}

const cropperInitValue: CropperPosition = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
}