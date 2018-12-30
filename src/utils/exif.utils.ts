export function resetExifOrientation(srcBase64: string): Promise<string> {
    try {
        const exifRotation = getExifRotation(srcBase64);
        if (exifRotation > 1) {
            return transformBase64BasedOnExifRotation(srcBase64, exifRotation);
        } else {
            return Promise.resolve(srcBase64);
        }
    } catch (ex) {
        return Promise.reject(ex);
    }
}

export function transformBase64BasedOnExifRotation(srcBase64: string, exifRotation: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const width = img.width;
            const height = img.height;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                if (4 < exifRotation && exifRotation < 9) {
                    canvas.width = height;
                    canvas.height = width;
                } else {
                    canvas.width = width;
                    canvas.height = height;
                }
                transformCanvas(ctx, exifRotation, width, height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL());
            } else {
                reject(new Error('No context'));
            }
        };
        img.src = srcBase64;
    });
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

function transformCanvas(ctx: any, orientation: number, width: number, height: number) {
    switch (orientation) {
        case 2:
            ctx.transform(-1, 0, 0, 1, width, 0);
            break;
        case 3:
            ctx.transform(-1, 0, 0, -1, width, height);
            break;
        case 4:
            ctx.transform(1, 0, 0, -1, 0, height);
            break;
        case 5:
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
        case 6:
            ctx.transform(0, 1, -1, 0, height, 0);
            break;
        case 7:
            ctx.transform(0, -1, -1, 0, height, width);
            break;
        case 8:
            ctx.transform(0, -1, 1, 0, 0, width);
            break;
    }
}
