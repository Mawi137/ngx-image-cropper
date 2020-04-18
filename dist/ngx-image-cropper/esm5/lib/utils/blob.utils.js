/**
 * @fileoverview added by tsickle
 * Generated from: lib/utils/blob.utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @param {?} base64Image
 * @return {?}
 */
export function base64ToFile(base64Image) {
    /** @type {?} */
    var split = base64Image.split(',');
    /** @type {?} */
    var type = split[0].replace('data:', '').replace(';base64', '');
    /** @type {?} */
    var byteString = atob(split[1]);
    /** @type {?} */
    var ab = new ArrayBuffer(byteString.length);
    /** @type {?} */
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: type });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvYi51dGlscy5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1pbWFnZS1jcm9wcGVyLyIsInNvdXJjZXMiOlsibGliL3V0aWxzL2Jsb2IudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsTUFBTSxVQUFVLFlBQVksQ0FBQyxXQUFtQjs7UUFDdEMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDOztRQUM5QixJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7O1FBQzNELFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOztRQUMzQixFQUFFLEdBQUcsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzs7UUFDdkMsRUFBRSxHQUFHLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQztJQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUMsSUFBSSxNQUFBLEVBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gYmFzZTY0VG9GaWxlKGJhc2U2NEltYWdlOiBzdHJpbmcpOiBCbG9iIHtcbiAgICBjb25zdCBzcGxpdCA9IGJhc2U2NEltYWdlLnNwbGl0KCcsJyk7XG4gICAgY29uc3QgdHlwZSA9IHNwbGl0WzBdLnJlcGxhY2UoJ2RhdGE6JywgJycpLnJlcGxhY2UoJztiYXNlNjQnLCAnJyk7XG4gICAgY29uc3QgYnl0ZVN0cmluZyA9IGF0b2Ioc3BsaXRbMV0pO1xuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKGJ5dGVTdHJpbmcubGVuZ3RoKTtcbiAgICBjb25zdCBpYSA9IG5ldyBVaW50OEFycmF5KGFiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVTdHJpbmcubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWFbaV0gPSBieXRlU3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQmxvYihbYWJdLCB7dHlwZX0pO1xufVxuIl19