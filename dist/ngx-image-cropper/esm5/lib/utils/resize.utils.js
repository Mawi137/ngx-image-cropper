/**
 * @fileoverview added by tsickle
 * Generated from: lib/utils/resize.utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/*
 * Hermite resize - fast image resize/resample using Hermite filter.
 * https://github.com/viliusle/Hermite-resize
 */
/**
 * @param {?} canvas
 * @param {?} width
 * @param {?} height
 * @return {?}
 */
export function resizeCanvas(canvas, width, height) {
    /** @type {?} */
    var width_source = canvas.width;
    /** @type {?} */
    var height_source = canvas.height;
    width = Math.round(width);
    height = Math.round(height);
    /** @type {?} */
    var ratio_w = width_source / width;
    /** @type {?} */
    var ratio_h = height_source / height;
    /** @type {?} */
    var ratio_w_half = Math.ceil(ratio_w / 2);
    /** @type {?} */
    var ratio_h_half = Math.ceil(ratio_h / 2);
    /** @type {?} */
    var ctx = canvas.getContext('2d');
    if (ctx) {
        /** @type {?} */
        var img = ctx.getImageData(0, 0, width_source, height_source);
        /** @type {?} */
        var img2 = ctx.createImageData(width, height);
        /** @type {?} */
        var data = img.data;
        /** @type {?} */
        var data2 = img2.data;
        for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
                /** @type {?} */
                var x2 = (i + j * width) * 4;
                /** @type {?} */
                var center_y = j * ratio_h;
                /** @type {?} */
                var weight = 0;
                /** @type {?} */
                var weights = 0;
                /** @type {?} */
                var weights_alpha = 0;
                /** @type {?} */
                var gx_r = 0;
                /** @type {?} */
                var gx_g = 0;
                /** @type {?} */
                var gx_b = 0;
                /** @type {?} */
                var gx_a = 0;
                /** @type {?} */
                var xx_start = Math.floor(i * ratio_w);
                /** @type {?} */
                var yy_start = Math.floor(j * ratio_h);
                /** @type {?} */
                var xx_stop = Math.ceil((i + 1) * ratio_w);
                /** @type {?} */
                var yy_stop = Math.ceil((j + 1) * ratio_h);
                xx_stop = Math.min(xx_stop, width_source);
                yy_stop = Math.min(yy_stop, height_source);
                for (var yy = yy_start; yy < yy_stop; yy++) {
                    /** @type {?} */
                    var dy = Math.abs(center_y - yy) / ratio_h_half;
                    /** @type {?} */
                    var center_x = i * ratio_w;
                    /** @type {?} */
                    var w0 = dy * dy;
                    for (var xx = xx_start; xx < xx_stop; xx++) {
                        /** @type {?} */
                        var dx = Math.abs(center_x - xx) / ratio_w_half;
                        /** @type {?} */
                        var w = Math.sqrt(w0 + dx * dx);
                        if (w >= 1) {
                            //pixel too far
                            continue;
                        }
                        //hermite filter
                        weight = 2 * w * w * w - 3 * w * w + 1;
                        /** @type {?} */
                        var pos_x = 4 * (xx + yy * width_source);
                        //alpha
                        gx_a += weight * data[pos_x + 3];
                        weights_alpha += weight;
                        //colors
                        if (data[pos_x + 3] < 255)
                            weight = weight * data[pos_x + 3] / 250;
                        gx_r += weight * data[pos_x];
                        gx_g += weight * data[pos_x + 1];
                        gx_b += weight * data[pos_x + 2];
                        weights += weight;
                    }
                }
                data2[x2] = gx_r / weights;
                data2[x2 + 1] = gx_g / weights;
                data2[x2 + 2] = gx_b / weights;
                data2[x2 + 3] = gx_a / weights_alpha;
            }
        }
        canvas.width = width;
        canvas.height = height;
        //draw
        ctx.putImageData(img2, 0, 0);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLnV0aWxzLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LWltYWdlLWNyb3BwZXIvIiwic291cmNlcyI6WyJsaWIvdXRpbHMvcmVzaXplLnV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUtBLE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBeUIsRUFBRSxLQUFhLEVBQUUsTUFBYzs7UUFDM0UsWUFBWSxHQUFHLE1BQU0sQ0FBQyxLQUFLOztRQUMzQixhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU07SUFDbkMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7O1FBRXRCLE9BQU8sR0FBRyxZQUFZLEdBQUcsS0FBSzs7UUFDOUIsT0FBTyxHQUFHLGFBQWEsR0FBRyxNQUFNOztRQUNoQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDOztRQUNyQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDOztRQUVyQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7SUFDbkMsSUFBSSxHQUFHLEVBQUU7O1lBQ0MsR0FBRyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDOztZQUN6RCxJQUFJLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDOztZQUN6QyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUk7O1lBQ2YsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJO1FBRXZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0IsS0FBSyxJQUFJ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O2dCQUNELEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFDO2dCQUMzQixLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxPQUFPLENBQUM7Z0JBQy9CLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLE9BQU8sQ0FBQztnQkFDL0IsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsYUFBYSxDQUFDO2FBQ3hDO1NBQ0o7UUFHRCxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNyQixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUV2QixNQUFNO1FBQ04sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ2hDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBIZXJtaXRlIHJlc2l6ZSAtIGZhc3QgaW1hZ2UgcmVzaXplL3Jlc2FtcGxlIHVzaW5nIEhlcm1pdGUgZmlsdGVyLlxuICogaHR0cHM6Ly9naXRodWIuY29tL3ZpbGl1c2xlL0hlcm1pdGUtcmVzaXplXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2l6ZUNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgIGNvbnN0IHdpZHRoX3NvdXJjZSA9IGNhbnZhcy53aWR0aDtcbiAgICBjb25zdCBoZWlnaHRfc291cmNlID0gY2FudmFzLmhlaWdodDtcbiAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGgpO1xuICAgIGhlaWdodCA9IE1hdGgucm91bmQoaGVpZ2h0KTtcblxuICAgIGNvbnN0IHJhdGlvX3cgPSB3aWR0aF9zb3VyY2UgLyB3aWR0aDtcbiAgICBjb25zdCByYXRpb19oID0gaGVpZ2h0X3NvdXJjZSAvIGhlaWdodDtcbiAgICBjb25zdCByYXRpb193X2hhbGYgPSBNYXRoLmNlaWwocmF0aW9fdyAvIDIpO1xuICAgIGNvbnN0IHJhdGlvX2hfaGFsZiA9IE1hdGguY2VpbChyYXRpb19oIC8gMik7XG5cbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBpZiAoY3R4KSB7XG4gICAgICAgIGNvbnN0IGltZyA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGhfc291cmNlLCBoZWlnaHRfc291cmNlKTtcbiAgICAgICAgY29uc3QgaW1nMiA9IGN0eC5jcmVhdGVJbWFnZURhdGEod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBpbWcuZGF0YTtcbiAgICAgICAgY29uc3QgZGF0YTIgPSBpbWcyLmRhdGE7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBoZWlnaHQ7IGorKykge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeDIgPSAoaSArIGogKiB3aWR0aCkgKiA0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlcl95ID0gaiAqIHJhdGlvX2g7XG4gICAgICAgICAgICAgICAgbGV0IHdlaWdodCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IHdlaWdodHMgPSAwO1xuICAgICAgICAgICAgICAgIGxldCB3ZWlnaHRzX2FscGhhID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgZ3hfciA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IGd4X2cgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBneF9iID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgZ3hfYSA9IDA7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB4eF9zdGFydCA9IE1hdGguZmxvb3IoaSAqIHJhdGlvX3cpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHl5X3N0YXJ0ID0gTWF0aC5mbG9vcihqICogcmF0aW9faCk7XG4gICAgICAgICAgICAgICAgbGV0IHh4X3N0b3AgPSBNYXRoLmNlaWwoKGkgKyAxKSAqIHJhdGlvX3cpO1xuICAgICAgICAgICAgICAgIGxldCB5eV9zdG9wID0gTWF0aC5jZWlsKChqICsgMSkgKiByYXRpb19oKTtcbiAgICAgICAgICAgICAgICB4eF9zdG9wID0gTWF0aC5taW4oeHhfc3RvcCwgd2lkdGhfc291cmNlKTtcbiAgICAgICAgICAgICAgICB5eV9zdG9wID0gTWF0aC5taW4oeXlfc3RvcCwgaGVpZ2h0X3NvdXJjZSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5eSA9IHl5X3N0YXJ0OyB5eSA8IHl5X3N0b3A7IHl5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHkgPSBNYXRoLmFicyhjZW50ZXJfeSAtIHl5KSAvIHJhdGlvX2hfaGFsZjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyX3ggPSBpICogcmF0aW9fdztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdzAgPSBkeSAqIGR5OyAvL3ByZS1jYWxjIHBhcnQgb2Ygd1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4eCA9IHh4X3N0YXJ0OyB4eCA8IHh4X3N0b3A7IHh4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoY2VudGVyX3ggLSB4eCkgLyByYXRpb193X2hhbGY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3ID0gTWF0aC5zcXJ0KHcwICsgZHggKiBkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9waXhlbCB0b28gZmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2hlcm1pdGUgZmlsdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHQgPSAyICogdyAqIHcgKiB3IC0gMyAqIHcgKiB3ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvc194ID0gNCAqICh4eCArIHl5ICogd2lkdGhfc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYWxwaGFcbiAgICAgICAgICAgICAgICAgICAgICAgIGd4X2EgKz0gd2VpZ2h0ICogZGF0YVtwb3NfeCArIDNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2VpZ2h0c19hbHBoYSArPSB3ZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbG9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbcG9zX3ggKyAzXSA8IDI1NSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHQgPSB3ZWlnaHQgKiBkYXRhW3Bvc194ICsgM10gLyAyNTA7XG4gICAgICAgICAgICAgICAgICAgICAgICBneF9yICs9IHdlaWdodCAqIGRhdGFbcG9zX3hdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3hfZyArPSB3ZWlnaHQgKiBkYXRhW3Bvc194ICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBneF9iICs9IHdlaWdodCAqIGRhdGFbcG9zX3ggKyAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlaWdodHMgKz0gd2VpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRhdGEyW3gyXSA9IGd4X3IgLyB3ZWlnaHRzO1xuICAgICAgICAgICAgICAgIGRhdGEyW3gyICsgMV0gPSBneF9nIC8gd2VpZ2h0cztcbiAgICAgICAgICAgICAgICBkYXRhMlt4MiArIDJdID0gZ3hfYiAvIHdlaWdodHM7XG4gICAgICAgICAgICAgICAgZGF0YTJbeDIgKyAzXSA9IGd4X2EgLyB3ZWlnaHRzX2FscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICAvL2RyYXdcbiAgICAgICAgY3R4LnB1dEltYWdlRGF0YShpbWcyLCAwLCAwKTtcbiAgICB9XG59XG4iXX0=