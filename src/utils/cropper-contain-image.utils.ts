export function transformCropperContainImage(srcBase64: string, doContain: boolean, aspectRatio: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const minWidthToContain = img.height * aspectRatio;
                const minHeightToContain = img.width / aspectRatio;
                canvas.width = doContain ? Math.max(img.width, minWidthToContain) : img.width;
                canvas.height = doContain ? Math.max(img.height, minHeightToContain) : img.height;
                const dx = doContain ? (canvas.width-img.width)/2 : 0;
                const dy = doContain ? (canvas.height-img.height)/2 : 0;
                ctx.drawImage(img, dx, dy);
                resolve(canvas.toDataURL());
            } else {
                reject(new Error('No context'));
            }
        };
        img.src = srcBase64;
    });
}
