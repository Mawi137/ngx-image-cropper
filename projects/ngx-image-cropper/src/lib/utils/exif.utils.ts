import {Transformations} from '../interfaces';

export function getTransformationsFromExifRotation(exifRotationOrBase64Image: number | string): Transformations {
    if (typeof exifRotationOrBase64Image === 'string') {
        exifRotationOrBase64Image = getExifRotation(exifRotationOrBase64Image);
    }
    switch (exifRotationOrBase64Image) {
        case 1: return {rotation: 0, flipH: false, flipV: false};
        case 2: return {rotation: 0, flipH: true,  flipV: false};
        case 3: return {rotation: 2, flipH: false, flipV: false};
        case 4: return {rotation: 2, flipH: true,  flipV: false};
        case 5: return {rotation: 1, flipH: false, flipV: false};
        case 6: return {rotation: 1, flipH: true,  flipV: false};
        case 7: return {rotation: 3, flipH: false, flipV: false};
        case 8: return {rotation: 3, flipH: true,  flipV: false};
    }
    return {rotation: 0, flipH: false, flipV: false};
}

function getExifRotation(imageBase64: string): number {
    const view = new DataView(base64ToArrayBuffer(imageBase64));
    if (view.getUint16(0, false) != 0xFFD8) {
        return -2;
    }
    const length = view.byteLength;
    let offset = 2;
    while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) return -1;
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) {
                return -1;
            }

            const little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            const tags = view.getUint16(offset, little);
            offset += 2;
            for (let i = 0; i < tags; i++) {
                if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                    return view.getUint16(offset + (i * 12) + 8, little);
                }
            }
        }
        else if ((marker & 0xFF00) != 0xFF00) {
            break;
        }
        else {
            offset += view.getUint16(offset, false);
        }
    }
    return -1;
}

function base64ToArrayBuffer(imageBase64: string) {
    imageBase64 = imageBase64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
    const binaryString = atob(imageBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
