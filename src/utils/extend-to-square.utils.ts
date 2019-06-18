export function transformExtendToSquare(srcBase64: string, doExtend: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const maxDimension = Math.max(img.width, img.height);
                canvas.width = doExtend ? maxDimension : img.width;
                canvas.height = doExtend ? maxDimension : img.height;
                const dx = doExtend ? (maxDimension-img.width)/2 : 0;
                const dy = doExtend ? (maxDimension-img.height)/2 : 0;
                ctx.drawImage(img, dx, dy);
                resolve(canvas.toDataURL());
            } else {
                reject(new Error('No context'));
            }
        };
        img.src = srcBase64;
    });
}
