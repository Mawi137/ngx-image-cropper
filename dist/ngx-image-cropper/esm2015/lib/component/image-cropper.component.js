/**
 * @fileoverview added by tsickle
 * Generated from: lib/component/image-cropper.component.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, isDevMode, Output, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { getTransformationsFromExifData, supportsAutomaticRotation } from '../utils/exif.utils';
import { resizeCanvas } from '../utils/resize.utils';
import { MoveTypes } from '../interfaces/move-start.interface';
export class ImageCropperComponent {
    /**
     * @param {?} sanitizer
     * @param {?} cd
     */
    constructor(sanitizer, cd) {
        this.sanitizer = sanitizer;
        this.cd = cd;
        this.Hammer = typeof window !== 'undefined'
            ? (/** @type {?} */ (((/** @type {?} */ (window))).Hammer))
            : null;
        this.setImageMaxSizeRetries = 0;
        this.cropperScaledMinWidth = 20;
        this.cropperScaledMinHeight = 20;
        this.exifTransform = { rotate: 0, flip: false };
        this.autoRotateSupported = supportsAutomaticRotation();
        this.stepSize = 3;
        this.marginLeft = '0px';
        this.imageVisible = false;
        this.moveTypes = MoveTypes;
        this.format = 'png';
        this.maintainAspectRatio = true;
        this.transform = {};
        this.aspectRatio = 1;
        this.resizeToWidth = 0;
        this.resizeToHeight = 0;
        this.cropperMinWidth = 0;
        this.cropperMinHeight = 0;
        this.canvasRotation = 0;
        this.initialStepSize = 3;
        this.roundCropper = false;
        this.onlyScaleDown = false;
        this.imageQuality = 92;
        this.autoCrop = true;
        this.containWithinAspectRatio = false;
        this.hideResizeSquares = false;
        this.cropper = {
            x1: -100,
            y1: -100,
            x2: 10000,
            y2: 10000
        };
        this.alignImage = 'center';
        this.disabled = false;
        this.imageCropped = new EventEmitter();
        this.startCropImage = new EventEmitter();
        this.imageLoaded = new EventEmitter();
        this.cropperReady = new EventEmitter();
        this.loadImageFailed = new EventEmitter();
        this.initCropper();
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        this.onChangesInputImage(changes);
        if (this.originalImage && this.originalImage.complete && this.exifTransform
            && (changes.containWithinAspectRatio || changes.canvasRotation)) {
            this.transformOriginalImage();
        }
        if (changes.cropper) {
            this.setMaxSize();
            this.setCropperScaledMinSize();
            this.checkCropperPosition(false);
            this.doAutoCrop();
            this.cd.markForCheck();
        }
        if (changes.aspectRatio && this.imageVisible) {
            this.resetCropperPosition();
        }
        if (changes.transform) {
            this.transform = this.transform || {};
            this.setCssTransform();
            this.doAutoCrop();
        }
    }
    /**
     * @private
     * @param {?} changes
     * @return {?}
     */
    onChangesInputImage(changes) {
        if (changes.imageChangedEvent || changes.imageURL || changes.imageBase64 || changes.imageFile) {
            this.initCropper();
        }
        if (changes.imageChangedEvent && this.isValidImageChangedEvent()) {
            this.loadImageFile(this.imageChangedEvent.target.files[0]);
        }
        if (changes.imageURL && this.imageURL) {
            this.loadImageFromURL(this.imageURL);
        }
        if (changes.imageBase64 && this.imageBase64) {
            this.loadBase64Image(this.imageBase64);
        }
        if (changes.imageFile && this.imageFile) {
            this.loadImageFile(this.imageFile);
        }
    }
    /**
     * @private
     * @return {?}
     */
    isValidImageChangedEvent() {
        return this.imageChangedEvent
            && this.imageChangedEvent.target
            && this.imageChangedEvent.target.files
            && this.imageChangedEvent.target.files.length > 0;
    }
    /**
     * @private
     * @return {?}
     */
    setCssTransform() {
        this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle('scaleX(' + (this.transform.scale || 1) * (this.transform.flipH ? -1 : 1) + ')' +
            'scaleY(' + (this.transform.scale || 1) * (this.transform.flipV ? -1 : 1) + ')' +
            'rotate(' + (this.transform.rotate || 0) + 'deg)');
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.stepSize = this.initialStepSize;
        this.activatePinchGesture();
    }
    /**
     * @private
     * @return {?}
     */
    initCropper() {
        this.imageVisible = false;
        this.transformedImage = null;
        this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
            + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
            + 'AAarVyFEAAAAASUVORK5CYII=';
        this.moveStart = {
            active: false,
            type: null,
            position: null,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            clientX: 0,
            clientY: 0
        };
        this.maxSize = {
            width: 0,
            height: 0
        };
        this.originalSize = {
            width: 0,
            height: 0
        };
        this.transformedSize = {
            width: 0,
            height: 0
        };
        this.cropper.x1 = -100;
        this.cropper.y1 = -100;
        this.cropper.x2 = 10000;
        this.cropper.y2 = 10000;
    }
    /**
     * @private
     * @param {?} imageBase64
     * @param {?} imageType
     * @return {?}
     */
    loadImage(imageBase64, imageType) {
        if (this.isValidImageType(imageType)) {
            this.loadBase64Image(imageBase64);
        }
        else {
            this.loadImageFailed.emit();
        }
    }
    /**
     * @private
     * @param {?} file
     * @return {?}
     */
    loadImageFile(file) {
        /** @type {?} */
        const fileReader = new FileReader();
        fileReader.onload = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => this.loadImage(event.target.result, file.type));
        fileReader.readAsDataURL(file);
    }
    /**
     * @private
     * @param {?} type
     * @return {?}
     */
    isValidImageType(type) {
        return /image\/(png|jpg|jpeg|bmp|gif|tiff|webp)/.test(type);
    }
    /**
     * @private
     * @param {?} imageBase64
     * @return {?}
     */
    loadBase64Image(imageBase64) {
        this.autoRotateSupported
            .then((/**
         * @param {?} supported
         * @return {?}
         */
        (supported) => this.checkExifAndLoadBase64Image(imageBase64, supported)))
            .then((/**
         * @return {?}
         */
        () => this.transformOriginalImage()))
            .catch((/**
         * @param {?} error
         * @return {?}
         */
        (error) => {
            this.loadImageFailed.emit();
            this.originalImage = null;
            this.originalBase64 = null;
            console.error(error);
        }));
    }
    /**
     * @private
     * @param {?} imageBase64
     * @param {?} autoRotateSupported
     * @return {?}
     */
    checkExifAndLoadBase64Image(imageBase64, autoRotateSupported) {
        return new Promise((/**
         * @param {?} resolve
         * @param {?} reject
         * @return {?}
         */
        (resolve, reject) => {
            this.originalImage = new Image();
            this.originalImage.onload = (/**
             * @return {?}
             */
            () => {
                this.originalBase64 = imageBase64;
                this.exifTransform = getTransformationsFromExifData(autoRotateSupported ? -1 : imageBase64);
                this.originalSize.width = this.originalImage.naturalWidth;
                this.originalSize.height = this.originalImage.naturalHeight;
                resolve();
            });
            this.originalImage.onerror = reject;
            this.originalImage.src = imageBase64;
        }));
    }
    /**
     * @private
     * @param {?} url
     * @return {?}
     */
    loadImageFromURL(url) {
        /** @type {?} */
        const img = new Image();
        img.onerror = (/**
         * @return {?}
         */
        () => this.loadImageFailed.emit());
        img.onload = (/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const canvas = document.createElement('canvas');
            /** @type {?} */
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            this.loadBase64Image(canvas.toDataURL());
        });
        img.crossOrigin = 'anonymous';
        img.src = url;
    }
    /**
     * @private
     * @return {?}
     */
    getTransformedSize() {
        /** @type {?} */
        const canvasRotation = this.canvasRotation + this.exifTransform.rotate;
        if (this.containWithinAspectRatio) {
            if (canvasRotation % 2) {
                /** @type {?} */
                const minWidthToContain = this.originalSize.width * this.aspectRatio;
                /** @type {?} */
                const minHeightToContain = this.originalSize.height / this.aspectRatio;
                return {
                    width: Math.max(this.originalSize.height, minWidthToContain),
                    height: Math.max(this.originalSize.width, minHeightToContain),
                };
            }
            else {
                /** @type {?} */
                const minWidthToContain = this.originalSize.height * this.aspectRatio;
                /** @type {?} */
                const minHeightToContain = this.originalSize.width / this.aspectRatio;
                return {
                    width: Math.max(this.originalSize.width, minWidthToContain),
                    height: Math.max(this.originalSize.height, minHeightToContain),
                };
            }
        }
        if (canvasRotation % 2) {
            return {
                height: this.originalSize.width,
                width: this.originalSize.height,
            };
        }
        return {
            width: this.originalSize.width,
            height: this.originalSize.height,
        };
    }
    /**
     * @private
     * @return {?}
     */
    transformOriginalImage() {
        if (!this.originalImage || !this.originalImage.complete || !this.exifTransform) {
            return Promise.reject(new Error('No image loaded'));
        }
        /** @type {?} */
        const transformedBase64 = this.transformImageBase64();
        return this.setTransformedImage(transformedBase64);
    }
    /**
     * @private
     * @return {?}
     */
    transformImageBase64() {
        /** @type {?} */
        const canvasRotation = this.canvasRotation + this.exifTransform.rotate;
        /** @type {?} */
        const transformedSize = this.getTransformedSize();
        /** @type {?} */
        const canvas = document.createElement('canvas');
        canvas.width = transformedSize.width;
        canvas.height = transformedSize.height;
        /** @type {?} */
        const ctx = canvas.getContext('2d');
        ctx.setTransform(this.exifTransform.flip ? -1 : 1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI * (canvasRotation / 2));
        ctx.drawImage(this.originalImage, -this.originalSize.width / 2, -this.originalSize.height / 2);
        return canvas.toDataURL();
    }
    /**
     * @private
     * @param {?} transformedBase64
     * @return {?}
     */
    setTransformedImage(transformedBase64) {
        return new Promise((/**
         * @param {?} resolve
         * @return {?}
         */
        (resolve) => {
            this.transformedBase64 = transformedBase64;
            this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(transformedBase64);
            this.transformedImage = new Image();
            this.transformedImage.onload = (/**
             * @return {?}
             */
            () => {
                this.transformedSize.width = this.transformedImage.naturalWidth;
                this.transformedSize.height = this.transformedImage.naturalHeight;
                this.cd.markForCheck();
                resolve();
            });
            this.transformedImage.src = this.transformedBase64;
        }));
    }
    /**
     * @return {?}
     */
    imageLoadedInView() {
        if (this.transformedImage != null) {
            this.imageLoaded.emit();
            this.setImageMaxSizeRetries = 0;
            setTimeout((/**
             * @return {?}
             */
            () => this.checkImageMaxSizeRecursively()));
        }
    }
    /**
     * @private
     * @return {?}
     */
    checkImageMaxSizeRecursively() {
        if (this.setImageMaxSizeRetries > 40) {
            this.loadImageFailed.emit();
        }
        else if (this.sourceImageLoaded()) {
            this.setMaxSize();
            this.setCropperScaledMinSize();
            this.resetCropperPosition();
            this.cropperReady.emit(Object.assign({}, this.maxSize));
            this.cd.markForCheck();
        }
        else {
            this.setImageMaxSizeRetries++;
            setTimeout((/**
             * @return {?}
             */
            () => this.checkImageMaxSizeRecursively()), 50);
        }
    }
    /**
     * @private
     * @return {?}
     */
    sourceImageLoaded() {
        return this.sourceImage && this.sourceImage.nativeElement && this.sourceImage.nativeElement.offsetWidth > 0;
    }
    /**
     * @return {?}
     */
    onResize() {
        this.resizeCropperPosition();
        this.setMaxSize();
        this.setCropperScaledMinSize();
    }
    /**
     * @private
     * @return {?}
     */
    activatePinchGesture() {
        if (this.Hammer) {
            /** @type {?} */
            const hammer = new this.Hammer(this.wrapper.nativeElement);
            hammer.get('pinch').set({ enable: true });
        }
        else if (isDevMode()) {
            console.warn('[NgxImageCropper] Could not find HammerJS - Pinch Gesture won\'t work');
        }
    }
    /**
     * @private
     * @return {?}
     */
    resizeCropperPosition() {
        /** @type {?} */
        const sourceImageElement = this.sourceImage.nativeElement;
        if (this.maxSize.width !== sourceImageElement.offsetWidth || this.maxSize.height !== sourceImageElement.offsetHeight) {
            this.cropper.x1 = this.cropper.x1 * sourceImageElement.offsetWidth / this.maxSize.width;
            this.cropper.x2 = this.cropper.x2 * sourceImageElement.offsetWidth / this.maxSize.width;
            this.cropper.y1 = this.cropper.y1 * sourceImageElement.offsetHeight / this.maxSize.height;
            this.cropper.y2 = this.cropper.y2 * sourceImageElement.offsetHeight / this.maxSize.height;
        }
    }
    /**
     * @return {?}
     */
    resetCropperPosition() {
        /** @type {?} */
        const sourceImageElement = this.sourceImage.nativeElement;
        if (!this.maintainAspectRatio) {
            this.cropper.x1 = 0;
            this.cropper.x2 = sourceImageElement.offsetWidth;
            this.cropper.y1 = 0;
            this.cropper.y2 = sourceImageElement.offsetHeight;
        }
        else if (sourceImageElement.offsetWidth / this.aspectRatio < sourceImageElement.offsetHeight) {
            this.cropper.x1 = 0;
            this.cropper.x2 = sourceImageElement.offsetWidth;
            /** @type {?} */
            const cropperHeight = sourceImageElement.offsetWidth / this.aspectRatio;
            this.cropper.y1 = (sourceImageElement.offsetHeight - cropperHeight) / 2;
            this.cropper.y2 = this.cropper.y1 + cropperHeight;
        }
        else {
            this.cropper.y1 = 0;
            this.cropper.y2 = sourceImageElement.offsetHeight;
            /** @type {?} */
            const cropperWidth = sourceImageElement.offsetHeight * this.aspectRatio;
            this.cropper.x1 = (sourceImageElement.offsetWidth - cropperWidth) / 2;
            this.cropper.x2 = this.cropper.x1 + cropperWidth;
        }
        this.doAutoCrop();
        this.imageVisible = true;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    keyboardAccess(event) {
        this.changeKeyboardStepSize(event);
        this.keyboardMoveCropper(event);
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    changeKeyboardStepSize(event) {
        if (event.key >= '1' && event.key <= '9') {
            this.stepSize = +event.key;
            return;
        }
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    keyboardMoveCropper(event) {
        /** @type {?} */
        const keyboardWhiteList = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
        if (!(keyboardWhiteList.includes(event.key))) {
            return;
        }
        /** @type {?} */
        const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move;
        /** @type {?} */
        const position = event.altKey ? this.getInvertedPositionForKey(event.key) : this.getPositionForKey(event.key);
        /** @type {?} */
        const moveEvent = this.getEventForKey(event.key, this.stepSize);
        event.preventDefault();
        event.stopPropagation();
        this.startMove({ clientX: 0, clientY: 0 }, moveType, position);
        this.moveImg(moveEvent);
        this.moveStop();
    }
    /**
     * @private
     * @param {?} key
     * @return {?}
     */
    getPositionForKey(key) {
        switch (key) {
            case 'ArrowUp':
                return 'top';
            case 'ArrowRight':
                return 'right';
            case 'ArrowDown':
                return 'bottom';
            case 'ArrowLeft':
            default:
                return 'left';
        }
    }
    /**
     * @private
     * @param {?} key
     * @return {?}
     */
    getInvertedPositionForKey(key) {
        switch (key) {
            case 'ArrowUp':
                return 'bottom';
            case 'ArrowRight':
                return 'left';
            case 'ArrowDown':
                return 'top';
            case 'ArrowLeft':
            default:
                return 'right';
        }
    }
    /**
     * @private
     * @param {?} key
     * @param {?} stepSize
     * @return {?}
     */
    getEventForKey(key, stepSize) {
        switch (key) {
            case 'ArrowUp':
                return { clientX: 0, clientY: stepSize * -1 };
            case 'ArrowRight':
                return { clientX: stepSize, clientY: 0 };
            case 'ArrowDown':
                return { clientX: 0, clientY: stepSize };
            case 'ArrowLeft':
            default:
                return { clientX: stepSize * -1, clientY: 0 };
        }
    }
    /**
     * @param {?} event
     * @param {?} moveType
     * @param {?=} position
     * @return {?}
     */
    startMove(event, moveType, position = null) {
        if (this.moveStart && this.moveStart.active && this.moveStart.type === MoveTypes.Pinch) {
            return;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        this.moveStart = Object.assign({ active: true, type: moveType, position, clientX: this.getClientX(event), clientY: this.getClientY(event) }, this.cropper);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    startPinch(event) {
        if (!this.safeImgDataUrl) {
            return;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        this.moveStart = Object.assign({ active: true, type: MoveTypes.Pinch, position: 'center', clientX: this.cropper.x1 + (this.cropper.x2 - this.cropper.x1) / 2, clientY: this.cropper.y1 + (this.cropper.y2 - this.cropper.y1) / 2 }, this.cropper);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    moveImg(event) {
        if (this.moveStart.active) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            if (this.moveStart.type === MoveTypes.Move) {
                this.move(event);
                this.checkCropperPosition(true);
            }
            else if (this.moveStart.type === MoveTypes.Resize) {
                this.resize(event);
                this.checkCropperPosition(false);
            }
            this.cd.detectChanges();
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onPinch(event) {
        if (this.moveStart.active) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            if (this.moveStart.type === MoveTypes.Pinch) {
                this.resize(event);
                this.checkCropperPosition(false);
            }
            this.cd.detectChanges();
        }
    }
    /**
     * @private
     * @return {?}
     */
    setMaxSize() {
        if (this.sourceImage) {
            /** @type {?} */
            const sourceImageElement = this.sourceImage.nativeElement;
            this.maxSize.width = sourceImageElement.offsetWidth;
            this.maxSize.height = sourceImageElement.offsetHeight;
            this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
        }
    }
    /**
     * @private
     * @return {?}
     */
    setCropperScaledMinSize() {
        if (this.transformedImage) {
            this.setCropperScaledMinWidth();
            this.setCropperScaledMinHeight();
        }
        else {
            this.cropperScaledMinWidth = 20;
            this.cropperScaledMinHeight = 20;
        }
    }
    /**
     * @private
     * @return {?}
     */
    setCropperScaledMinWidth() {
        this.cropperScaledMinWidth = this.cropperMinWidth > 0
            ? Math.max(20, this.cropperMinWidth / this.transformedImage.width * this.maxSize.width)
            : 20;
    }
    /**
     * @private
     * @return {?}
     */
    setCropperScaledMinHeight() {
        if (this.maintainAspectRatio) {
            this.cropperScaledMinHeight = Math.max(20, this.cropperScaledMinWidth / this.aspectRatio);
        }
        else if (this.cropperMinHeight > 0) {
            this.cropperScaledMinHeight = Math.max(20, this.cropperMinHeight / this.transformedImage.height * this.maxSize.height);
        }
        else {
            this.cropperScaledMinHeight = 20;
        }
    }
    /**
     * @private
     * @param {?=} maintainSize
     * @return {?}
     */
    checkCropperPosition(maintainSize = false) {
        if (this.cropper.x1 < 0) {
            this.cropper.x2 -= maintainSize ? this.cropper.x1 : 0;
            this.cropper.x1 = 0;
        }
        if (this.cropper.y1 < 0) {
            this.cropper.y2 -= maintainSize ? this.cropper.y1 : 0;
            this.cropper.y1 = 0;
        }
        if (this.cropper.x2 > this.maxSize.width) {
            this.cropper.x1 -= maintainSize ? (this.cropper.x2 - this.maxSize.width) : 0;
            this.cropper.x2 = this.maxSize.width;
        }
        if (this.cropper.y2 > this.maxSize.height) {
            this.cropper.y1 -= maintainSize ? (this.cropper.y2 - this.maxSize.height) : 0;
            this.cropper.y2 = this.maxSize.height;
        }
    }
    /**
     * @return {?}
     */
    moveStop() {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.doAutoCrop();
        }
    }
    /**
     * @return {?}
     */
    pinchStop() {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.doAutoCrop();
        }
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    move(event) {
        /** @type {?} */
        const diffX = this.getClientX(event) - this.moveStart.clientX;
        /** @type {?} */
        const diffY = this.getClientY(event) - this.moveStart.clientY;
        this.cropper.x1 = this.moveStart.x1 + diffX;
        this.cropper.y1 = this.moveStart.y1 + diffY;
        this.cropper.x2 = this.moveStart.x2 + diffX;
        this.cropper.y2 = this.moveStart.y2 + diffY;
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    resize(event) {
        /** @type {?} */
        const diffX = this.getClientX(event) - this.moveStart.clientX;
        /** @type {?} */
        const diffY = this.getClientY(event) - this.moveStart.clientY;
        switch (this.moveStart.position) {
            case 'left':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - this.cropperScaledMinWidth);
                break;
            case 'topleft':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - this.cropperScaledMinWidth);
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - this.cropperScaledMinHeight);
                break;
            case 'top':
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - this.cropperScaledMinHeight);
                break;
            case 'topright':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + this.cropperScaledMinWidth);
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - this.cropperScaledMinHeight);
                break;
            case 'right':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + this.cropperScaledMinWidth);
                break;
            case 'bottomright':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + this.cropperScaledMinWidth);
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + this.cropperScaledMinHeight);
                break;
            case 'bottom':
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + this.cropperScaledMinHeight);
                break;
            case 'bottomleft':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - this.cropperScaledMinWidth);
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + this.cropperScaledMinHeight);
                break;
            case 'center':
                /** @type {?} */
                const scale = event.scale;
                /** @type {?} */
                const newWidth = (Math.abs(this.moveStart.x2 - this.moveStart.x1)) * scale;
                /** @type {?} */
                const newHeight = (Math.abs(this.moveStart.y2 - this.moveStart.y1)) * scale;
                /** @type {?} */
                const x1 = this.cropper.x1;
                /** @type {?} */
                const y1 = this.cropper.y1;
                this.cropper.x1 = Math.min(this.moveStart.clientX - (newWidth / 2), this.cropper.x2 - this.cropperScaledMinWidth);
                this.cropper.y1 = Math.min(this.moveStart.clientY - (newHeight / 2), this.cropper.y2 - this.cropperScaledMinHeight);
                this.cropper.x2 = Math.max(this.moveStart.clientX + (newWidth / 2), x1 + this.cropperScaledMinWidth);
                this.cropper.y2 = Math.max(this.moveStart.clientY + (newHeight / 2), y1 + this.cropperScaledMinHeight);
                break;
        }
        if (this.maintainAspectRatio) {
            this.checkAspectRatio();
        }
    }
    /**
     * @private
     * @return {?}
     */
    checkAspectRatio() {
        /** @type {?} */
        let overflowX = 0;
        /** @type {?} */
        let overflowY = 0;
        switch (this.moveStart.position) {
            case 'top':
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1) * this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y1 += (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'bottom':
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1) * this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y2 -= (overflowY * this.aspectRatio) > overflowX ? overflowY : (overflowX / this.aspectRatio);
                }
                break;
            case 'topleft':
                this.cropper.y1 = this.cropper.y2 - (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(0 - this.cropper.x1, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x1 += (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y1 += (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'topright':
                this.cropper.y1 = this.cropper.y2 - (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y1 += (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'right':
            case 'bottomright':
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y2 -= (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'left':
            case 'bottomleft':
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(0 - this.cropper.x1, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x1 += (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y2 -= (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'center':
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1) * this.aspectRatio;
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                /** @type {?} */
                const overflowX1 = Math.max(0 - this.cropper.x1, 0);
                /** @type {?} */
                const overflowX2 = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                /** @type {?} */
                const overflowY1 = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                /** @type {?} */
                const overflowY2 = Math.max(0 - this.cropper.y1, 0);
                if (overflowX1 > 0 || overflowX2 > 0 || overflowY1 > 0 || overflowY2 > 0) {
                    this.cropper.x1 += (overflowY1 * this.aspectRatio) > overflowX1 ? (overflowY1 * this.aspectRatio) : overflowX1;
                    this.cropper.x2 -= (overflowY2 * this.aspectRatio) > overflowX2 ? (overflowY2 * this.aspectRatio) : overflowX2;
                    this.cropper.y1 += (overflowY2 * this.aspectRatio) > overflowX2 ? overflowY2 : overflowX2 / this.aspectRatio;
                    this.cropper.y2 -= (overflowY1 * this.aspectRatio) > overflowX1 ? overflowY1 : overflowX1 / this.aspectRatio;
                }
                break;
        }
    }
    /**
     * @private
     * @return {?}
     */
    doAutoCrop() {
        if (this.autoCrop) {
            this.crop();
        }
    }
    /**
     * @return {?}
     */
    cropWithBlob() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { output, ctx } = (/** @type {?} */ (this.crop(true)));
            if (!output) {
                return null;
            }
            output.blob = yield new Promise((/**
             * @param {?} resolve
             * @return {?}
             */
            (resolve) => {
                ctx.canvas.toBlob((/**
                 * @param {?} blob
                 * @return {?}
                 */
                blob => {
                    if (!blob) {
                        return resolve(undefined);
                    }
                    return resolve(blob);
                }));
            }));
            this.imageCropped.emit(output);
            return output;
        });
    }
    /**
     * @param {?=} internal
     * @return {?}
     */
    crop(internal = false) {
        if (this.sourceImage && this.sourceImage.nativeElement && this.transformedImage != null) {
            this.startCropImage.emit();
            /** @type {?} */
            const imagePosition = this.getImagePosition();
            /** @type {?} */
            const width = imagePosition.x2 - imagePosition.x1;
            /** @type {?} */
            const height = imagePosition.y2 - imagePosition.y1;
            /** @type {?} */
            const cropCanvas = (/** @type {?} */ (document.createElement('canvas')));
            cropCanvas.width = width;
            cropCanvas.height = height;
            /** @type {?} */
            const ctx = cropCanvas.getContext('2d');
            if (ctx) {
                if (this.backgroundColor != null) {
                    ctx.fillStyle = this.backgroundColor;
                    ctx.fillRect(0, 0, width, height);
                }
                /** @type {?} */
                const scaleX = (this.transform.scale || 1) * (this.transform.flipH ? -1 : 1);
                /** @type {?} */
                const scaleY = (this.transform.scale || 1) * (this.transform.flipV ? -1 : 1);
                ctx.setTransform(scaleX, 0, 0, scaleY, this.transformedSize.width / 2, this.transformedSize.height / 2);
                ctx.translate(-imagePosition.x1 / scaleX, -imagePosition.y1 / scaleY);
                ctx.rotate((this.transform.rotate || 0) * Math.PI / 180);
                ctx.drawImage(this.transformedImage, -this.transformedSize.width / 2, -this.transformedSize.height / 2);
                /** @type {?} */
                const output = {
                    width, height,
                    imagePosition,
                    cropperPosition: Object.assign({}, this.cropper)
                };
                if (this.containWithinAspectRatio) {
                    output.offsetImagePosition = this.getOffsetImagePosition();
                }
                /** @type {?} */
                const resizeRatio = this.getResizeRatio(width, height);
                if (resizeRatio !== 1) {
                    output.width = Math.round(width * resizeRatio);
                    output.height = this.maintainAspectRatio
                        ? Math.round(output.width / this.aspectRatio)
                        : Math.round(height * resizeRatio);
                    resizeCanvas(cropCanvas, output.width, output.height);
                }
                output.base64 = this.cropToBase64(cropCanvas);
                this.imageCropped.emit(output);
                if (internal) {
                    return { output, ctx };
                }
                return output;
            }
        }
        return null;
    }
    /**
     * @private
     * @return {?}
     */
    getImagePosition() {
        /** @type {?} */
        const sourceImageElement = this.sourceImage.nativeElement;
        /** @type {?} */
        const ratio = this.transformedSize.width / sourceImageElement.offsetWidth;
        /** @type {?} */
        const out = {
            x1: Math.round(this.cropper.x1 * ratio),
            y1: Math.round(this.cropper.y1 * ratio),
            x2: Math.round(this.cropper.x2 * ratio),
            y2: Math.round(this.cropper.y2 * ratio)
        };
        if (!this.containWithinAspectRatio) {
            out.x1 = Math.max(out.x1, 0);
            out.y1 = Math.max(out.y1, 0);
            out.x2 = Math.min(out.x2, this.transformedSize.width);
            out.y2 = Math.min(out.y2, this.transformedSize.height);
        }
        return out;
    }
    /**
     * @private
     * @return {?}
     */
    getOffsetImagePosition() {
        /** @type {?} */
        const canvasRotation = this.canvasRotation + this.exifTransform.rotate;
        /** @type {?} */
        const sourceImageElement = this.sourceImage.nativeElement;
        /** @type {?} */
        const ratio = this.transformedSize.width / sourceImageElement.offsetWidth;
        /** @type {?} */
        let offsetX;
        /** @type {?} */
        let offsetY;
        if (canvasRotation % 2) {
            offsetX = (this.transformedSize.width - this.originalSize.height) / 2;
            offsetY = (this.transformedSize.height - this.originalSize.width) / 2;
        }
        else {
            offsetX = (this.transformedSize.width - this.originalSize.width) / 2;
            offsetY = (this.transformedSize.height - this.originalSize.height) / 2;
        }
        /** @type {?} */
        const out = {
            x1: Math.round(this.cropper.x1 * ratio) - offsetX,
            y1: Math.round(this.cropper.y1 * ratio) - offsetY,
            x2: Math.round(this.cropper.x2 * ratio) - offsetX,
            y2: Math.round(this.cropper.y2 * ratio) - offsetY
        };
        if (!this.containWithinAspectRatio) {
            out.x1 = Math.max(out.x1, 0);
            out.y1 = Math.max(out.y1, 0);
            out.x2 = Math.min(out.x2, this.transformedSize.width);
            out.y2 = Math.min(out.y2, this.transformedSize.height);
        }
        return out;
    }
    /**
     * @private
     * @param {?} cropCanvas
     * @return {?}
     */
    cropToBase64(cropCanvas) {
        return cropCanvas.toDataURL('image/' + this.format, this.getQuality());
    }
    /**
     * @private
     * @return {?}
     */
    getQuality() {
        return Math.min(1, Math.max(0, this.imageQuality / 100));
    }
    /**
     * @private
     * @param {?} width
     * @param {?} height
     * @return {?}
     */
    getResizeRatio(width, height) {
        if (this.resizeToWidth > 0) {
            if (!this.onlyScaleDown || width > this.resizeToWidth) {
                return this.resizeToWidth / width;
            }
        }
        else if (this.resizeToHeight > 0) {
            if (!this.onlyScaleDown || height > this.resizeToHeight) {
                return this.resizeToHeight / height;
            }
        }
        return 1;
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    getClientX(event) {
        return (event.touches && event.touches[0] ? event.touches[0].clientX : event.clientX) || 0;
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    getClientY(event) {
        return (event.touches && event.touches[0] ? event.touches[0].clientY : event.clientY) || 0;
    }
}
ImageCropperComponent.decorators = [
    { type: Component, args: [{
                selector: 'image-cropper',
                template: "<div [style.background]=\"imageVisible && backgroundColor\"\n     (pinchstart)=\"startPinch($event)\"\n     #wrapper\n>\n    <img\n      #sourceImage\n      class=\"source-image\"\n      *ngIf=\"safeImgDataUrl\"\n      [src]=\"safeImgDataUrl\"\n      [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\n      [style.transform]=\"safeTransformStyle\"\n      (load)=\"imageLoadedInView()\"\n    />\n    <div\n        class=\"overlay\"\n        [style.width.px]=\"maxSize.width\"\n        [style.height.px]=\"maxSize.height\"\n        [style.margin-left]=\"alignImage === 'center' ? marginLeft : null\"\n    ></div>\n    <div class=\"cropper\"\n         *ngIf=\"imageVisible\"\n         [class.rounded]=\"roundCropper\"\n         [style.top.px]=\"cropper.y1\"\n         [style.left.px]=\"cropper.x1\"\n         [style.width.px]=\"cropper.x2 - cropper.x1\"\n         [style.height.px]=\"cropper.y2 - cropper.y1\"\n         [style.margin-left]=\"alignImage === 'center' ? marginLeft : null\"\n         [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\n         (keydown)=\"keyboardAccess($event)\"\n         tabindex=\"0\"\n    >\n        <div\n            (mousedown)=\"startMove($event, moveTypes.Move)\"\n            (touchstart)=\"startMove($event, moveTypes.Move)\"\n            class=\"move\">\n        </div>\n        <ng-container *ngIf=\"!hideResizeSquares\">\n            <span class=\"resize topleft\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'topleft')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'topleft')\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize top\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize topright\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'topright')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'topright')\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize right\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize bottomright\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottomright')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottomright')\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize bottom\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize bottomleft\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottomleft')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottomleft')\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize left\">\n                <span class=\"square\"></span>\n            </span>\n            <span class=\"resize-bar top\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'top')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'top')\">\n            </span>\n            <span class=\"resize-bar right\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'right')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'right')\">\n            </span>\n            <span class=\"resize-bar bottom\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'bottom')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'bottom')\">\n            </span>\n            <span class=\"resize-bar left\"\n                  (mousedown)=\"startMove($event, moveTypes.Resize, 'left')\"\n                  (touchstart)=\"startMove($event, moveTypes.Resize, 'left')\">\n            </span>\n        </ng-container>\n    </div>\n</div>\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [":host{display:flex;position:relative;width:100%;max-width:100%;max-height:100%;overflow:hidden;padding:5px;text-align:center}:host>div{width:100%;position:relative}:host>div img.source-image{max-width:100%;max-height:100%;transform-origin:center}:host .overlay{position:absolute;pointer-events:none;touch-action:none;outline:#fff solid 100vw;top:0;left:0}:host .cropper{position:absolute;display:flex;color:#53535c;background:0 0;outline:rgba(255,255,255,.3) solid 100vw;outline:var(--cropper-outline-color,rgba(255,255,255,.3)) solid 100vw;touch-action:none}:host .cropper:after{position:absolute;content:\"\";top:0;bottom:0;left:0;right:0;pointer-events:none;border:1px dashed;opacity:.75;color:inherit;z-index:1}:host .cropper .move{width:100%;cursor:move;border:1px solid rgba(255,255,255,.5)}:host .cropper:focus .move{border-color:#1e90ff;border-width:2px}:host .cropper .resize{position:absolute;display:inline-block;line-height:6px;padding:8px;opacity:.85;z-index:1}:host .cropper .resize .square{display:inline-block;background:#53535c;width:6px;height:6px;border:1px solid rgba(255,255,255,.5);box-sizing:content-box}:host .cropper .resize.topleft{top:-12px;left:-12px;cursor:nwse-resize}:host .cropper .resize.top{top:-12px;left:calc(50% - 12px);cursor:ns-resize}:host .cropper .resize.topright{top:-12px;right:-12px;cursor:nesw-resize}:host .cropper .resize.right{top:calc(50% - 12px);right:-12px;cursor:ew-resize}:host .cropper .resize.bottomright{bottom:-12px;right:-12px;cursor:nwse-resize}:host .cropper .resize.bottom{bottom:-12px;left:calc(50% - 12px);cursor:ns-resize}:host .cropper .resize.bottomleft{bottom:-12px;left:-12px;cursor:nesw-resize}:host .cropper .resize.left{top:calc(50% - 12px);left:-12px;cursor:ew-resize}:host .cropper .resize-bar{position:absolute;z-index:1}:host .cropper .resize-bar.top{top:-11px;left:11px;width:calc(100% - 22px);height:22px;cursor:ns-resize}:host .cropper .resize-bar.right{top:11px;right:-11px;height:calc(100% - 22px);width:22px;cursor:ew-resize}:host .cropper .resize-bar.bottom{bottom:-11px;left:11px;width:calc(100% - 22px);height:22px;cursor:ns-resize}:host .cropper .resize-bar.left{top:11px;left:-11px;height:calc(100% - 22px);width:22px;cursor:ew-resize}:host .cropper.rounded{outline-color:transparent}:host .cropper.rounded:after{border-radius:100%;box-shadow:0 0 0 100vw rgba(255,255,255,.3);box-shadow:0 0 0 100vw var(--cropper-outline-color,rgba(255,255,255,.3))}@media (orientation:portrait){:host .cropper{outline-width:100vh}:host .cropper.rounded:after{box-shadow:0 0 0 100vh rgba(255,255,255,.3);box-shadow:0 0 0 100vh var(--cropper-outline-color,rgba(255,255,255,.3))}}:host .cropper.rounded .move{border-radius:100%}:host.disabled .cropper .move,:host.disabled .cropper .resize,:host.disabled .cropper .resize-bar{display:none}"]
            }] }
];
/** @nocollapse */
ImageCropperComponent.ctorParameters = () => [
    { type: DomSanitizer },
    { type: ChangeDetectorRef }
];
ImageCropperComponent.propDecorators = {
    wrapper: [{ type: ViewChild, args: ['wrapper', { static: true },] }],
    sourceImage: [{ type: ViewChild, args: ['sourceImage', { static: false },] }],
    imageChangedEvent: [{ type: Input }],
    imageURL: [{ type: Input }],
    imageBase64: [{ type: Input }],
    imageFile: [{ type: Input }],
    format: [{ type: Input }],
    maintainAspectRatio: [{ type: Input }],
    transform: [{ type: Input }],
    aspectRatio: [{ type: Input }],
    resizeToWidth: [{ type: Input }],
    resizeToHeight: [{ type: Input }],
    cropperMinWidth: [{ type: Input }],
    cropperMinHeight: [{ type: Input }],
    canvasRotation: [{ type: Input }],
    initialStepSize: [{ type: Input }],
    roundCropper: [{ type: Input }],
    onlyScaleDown: [{ type: Input }],
    imageQuality: [{ type: Input }],
    autoCrop: [{ type: Input }],
    backgroundColor: [{ type: Input }],
    containWithinAspectRatio: [{ type: Input }],
    hideResizeSquares: [{ type: Input }],
    cropper: [{ type: Input }],
    alignImage: [{ type: HostBinding, args: ['style.text-align',] }, { type: Input }],
    disabled: [{ type: HostBinding, args: ['class.disabled',] }, { type: Input }],
    imageCropped: [{ type: Output }],
    startCropImage: [{ type: Output }],
    imageLoaded: [{ type: Output }],
    cropperReady: [{ type: Output }],
    loadImageFailed: [{ type: Output }],
    onResize: [{ type: HostListener, args: ['window:resize',] }],
    moveImg: [{ type: HostListener, args: ['document:mousemove', ['$event'],] }, { type: HostListener, args: ['document:touchmove', ['$event'],] }],
    onPinch: [{ type: HostListener, args: ['document:pinchmove', ['$event'],] }],
    moveStop: [{ type: HostListener, args: ['document:mouseup',] }, { type: HostListener, args: ['document:touchend',] }],
    pinchStop: [{ type: HostListener, args: ['document:pinchend',] }]
};
if (false) {
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.Hammer;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.originalImage;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.transformedImage;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.originalBase64;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.transformedBase64;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.moveStart;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.originalSize;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.transformedSize;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.setImageMaxSizeRetries;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.cropperScaledMinWidth;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.cropperScaledMinHeight;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.exifTransform;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.autoRotateSupported;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.stepSize;
    /** @type {?} */
    ImageCropperComponent.prototype.safeImgDataUrl;
    /** @type {?} */
    ImageCropperComponent.prototype.safeTransformStyle;
    /** @type {?} */
    ImageCropperComponent.prototype.marginLeft;
    /** @type {?} */
    ImageCropperComponent.prototype.maxSize;
    /** @type {?} */
    ImageCropperComponent.prototype.imageVisible;
    /** @type {?} */
    ImageCropperComponent.prototype.moveTypes;
    /** @type {?} */
    ImageCropperComponent.prototype.wrapper;
    /** @type {?} */
    ImageCropperComponent.prototype.sourceImage;
    /** @type {?} */
    ImageCropperComponent.prototype.imageChangedEvent;
    /** @type {?} */
    ImageCropperComponent.prototype.imageURL;
    /** @type {?} */
    ImageCropperComponent.prototype.imageBase64;
    /** @type {?} */
    ImageCropperComponent.prototype.imageFile;
    /** @type {?} */
    ImageCropperComponent.prototype.format;
    /** @type {?} */
    ImageCropperComponent.prototype.maintainAspectRatio;
    /** @type {?} */
    ImageCropperComponent.prototype.transform;
    /** @type {?} */
    ImageCropperComponent.prototype.aspectRatio;
    /** @type {?} */
    ImageCropperComponent.prototype.resizeToWidth;
    /** @type {?} */
    ImageCropperComponent.prototype.resizeToHeight;
    /** @type {?} */
    ImageCropperComponent.prototype.cropperMinWidth;
    /** @type {?} */
    ImageCropperComponent.prototype.cropperMinHeight;
    /** @type {?} */
    ImageCropperComponent.prototype.canvasRotation;
    /** @type {?} */
    ImageCropperComponent.prototype.initialStepSize;
    /** @type {?} */
    ImageCropperComponent.prototype.roundCropper;
    /** @type {?} */
    ImageCropperComponent.prototype.onlyScaleDown;
    /** @type {?} */
    ImageCropperComponent.prototype.imageQuality;
    /** @type {?} */
    ImageCropperComponent.prototype.autoCrop;
    /** @type {?} */
    ImageCropperComponent.prototype.backgroundColor;
    /** @type {?} */
    ImageCropperComponent.prototype.containWithinAspectRatio;
    /** @type {?} */
    ImageCropperComponent.prototype.hideResizeSquares;
    /** @type {?} */
    ImageCropperComponent.prototype.cropper;
    /** @type {?} */
    ImageCropperComponent.prototype.alignImage;
    /** @type {?} */
    ImageCropperComponent.prototype.disabled;
    /** @type {?} */
    ImageCropperComponent.prototype.imageCropped;
    /** @type {?} */
    ImageCropperComponent.prototype.startCropImage;
    /** @type {?} */
    ImageCropperComponent.prototype.imageLoaded;
    /** @type {?} */
    ImageCropperComponent.prototype.cropperReady;
    /** @type {?} */
    ImageCropperComponent.prototype.loadImageFailed;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.sanitizer;
    /**
     * @type {?}
     * @private
     */
    ImageCropperComponent.prototype.cd;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UtY3JvcHBlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtaW1hZ2UtY3JvcHBlci8iLCJzb3VyY2VzIjpbImxpYi9jb21wb25lbnQvaW1hZ2UtY3JvcHBlci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsT0FBTyxFQUNILHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osV0FBVyxFQUNYLFlBQVksRUFDWixLQUFLLEVBQ0wsU0FBUyxFQUdULE1BQU0sRUFFTixTQUFTLEVBQ1osTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFlBQVksRUFBc0IsTUFBTSwyQkFBMkIsQ0FBQztBQUU3RSxPQUFPLEVBQUUsOEJBQThCLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFHckQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG9DQUFvQyxDQUFDO0FBUS9ELE1BQU0sT0FBTyxxQkFBcUI7Ozs7O0lBbUU5QixZQUFvQixTQUF1QixFQUN2QixFQUFxQjtRQURyQixjQUFTLEdBQVQsU0FBUyxDQUFjO1FBQ3ZCLE9BQUUsR0FBRixFQUFFLENBQW1CO1FBbkVqQyxXQUFNLEdBQWlCLE9BQU8sTUFBTSxLQUFLLFdBQVc7WUFDeEQsQ0FBQyxDQUFDLG1CQUFBLENBQUMsbUJBQUEsTUFBTSxFQUFPLENBQUMsQ0FBQyxNQUFNLEVBQWdCO1lBQ3hDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFRSCwyQkFBc0IsR0FBRyxDQUFDLENBQUM7UUFDM0IsMEJBQXFCLEdBQUcsRUFBRSxDQUFDO1FBQzNCLDJCQUFzQixHQUFHLEVBQUUsQ0FBQztRQUM1QixrQkFBYSxHQUFrQixFQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQyxDQUFDO1FBQ3hELHdCQUFtQixHQUFxQix5QkFBeUIsRUFBRSxDQUFDO1FBQ3BFLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFJckIsZUFBVSxHQUF1QixLQUFLLENBQUM7UUFFdkMsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFDckIsY0FBUyxHQUFHLFNBQVMsQ0FBQztRQVViLFdBQU0sR0FBNEMsS0FBSyxDQUFDO1FBQ3hELHdCQUFtQixHQUFHLElBQUksQ0FBQztRQUMzQixjQUFTLEdBQW1CLEVBQUUsQ0FBQztRQUMvQixnQkFBVyxHQUFHLENBQUMsQ0FBQztRQUNoQixrQkFBYSxHQUFHLENBQUMsQ0FBQztRQUNsQixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUNuQixvQkFBZSxHQUFHLENBQUMsQ0FBQztRQUNwQixxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDckIsbUJBQWMsR0FBRyxDQUFDLENBQUM7UUFDbkIsb0JBQWUsR0FBRyxDQUFDLENBQUM7UUFDcEIsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFDckIsa0JBQWEsR0FBRyxLQUFLLENBQUM7UUFDdEIsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFDbEIsYUFBUSxHQUFHLElBQUksQ0FBQztRQUVoQiw2QkFBd0IsR0FBRyxLQUFLLENBQUM7UUFDakMsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQzFCLFlBQU8sR0FBb0I7WUFDaEMsRUFBRSxFQUFFLENBQUMsR0FBRztZQUNSLEVBQUUsRUFBRSxDQUFDLEdBQUc7WUFDUixFQUFFLEVBQUUsS0FBSztZQUNULEVBQUUsRUFBRSxLQUFLO1NBQ1osQ0FBQztRQUVPLGVBQVUsR0FBc0IsUUFBUSxDQUFDO1FBRXpDLGFBQVEsR0FBRyxLQUFLLENBQUM7UUFFaEIsaUJBQVksR0FBRyxJQUFJLFlBQVksRUFBcUIsQ0FBQztRQUNyRCxtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFRLENBQUM7UUFDMUMsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBUSxDQUFDO1FBQ3ZDLGlCQUFZLEdBQUcsSUFBSSxZQUFZLEVBQWMsQ0FBQztRQUM5QyxvQkFBZSxHQUFHLElBQUksWUFBWSxFQUFRLENBQUM7UUFJakQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7Ozs7O0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQzlCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVsQyxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLGFBQWE7ZUFDcEUsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ2pFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1NBQ2pDO1FBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQ2pCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDMUI7UUFDRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMxQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUMvQjtRQUNELElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7U0FDckI7SUFDTCxDQUFDOzs7Ozs7SUFFTyxtQkFBbUIsQ0FBQyxPQUFzQjtRQUM5QyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUMzRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDdEI7UUFDRCxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsRUFBRTtZQUM5RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDOUQ7UUFDRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNuQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3hDO1FBQ0QsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDekMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDMUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNyQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN0QztJQUNMLENBQUM7Ozs7O0lBRU8sd0JBQXdCO1FBQzVCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQjtlQUN0QixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTTtlQUM3QixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUs7ZUFDbkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUMxRCxDQUFDOzs7OztJQUVPLGVBQWU7UUFDbkIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQzdELFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO1lBQy9FLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO1lBQy9FLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FDcEQsQ0FBQztJQUNOLENBQUM7Ozs7SUFFRCxRQUFRO1FBQ0osSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7Ozs7O0lBRU8sV0FBVztRQUNmLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzFCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxrQ0FBa0M7Y0FDbEQsMkRBQTJEO2NBQzNELDJCQUEyQixDQUFDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUc7WUFDYixNQUFNLEVBQUUsS0FBSztZQUNiLElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLElBQUk7WUFDZCxFQUFFLEVBQUUsQ0FBQztZQUNMLEVBQUUsRUFBRSxDQUFDO1lBQ0wsRUFBRSxFQUFFLENBQUM7WUFDTCxFQUFFLEVBQUUsQ0FBQztZQUNMLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxFQUFFLENBQUM7U0FDYixDQUFDO1FBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUNYLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxFQUFFLENBQUM7U0FDWixDQUFDO1FBQ0YsSUFBSSxDQUFDLFlBQVksR0FBRztZQUNoQixLQUFLLEVBQUUsQ0FBQztZQUNSLE1BQU0sRUFBRSxDQUFDO1NBQ1osQ0FBQztRQUNGLElBQUksQ0FBQyxlQUFlLEdBQUc7WUFDbkIsS0FBSyxFQUFFLENBQUM7WUFDUixNQUFNLEVBQUUsQ0FBQztTQUNaLENBQUM7UUFDRixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQzVCLENBQUM7Ozs7Ozs7SUFFTyxTQUFTLENBQUMsV0FBbUIsRUFBRSxTQUFpQjtRQUNwRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3JDO2FBQU07WUFDSCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQy9CO0lBQ0wsQ0FBQzs7Ozs7O0lBRU8sYUFBYSxDQUFDLElBQVU7O2NBQ3RCLFVBQVUsR0FBRyxJQUFJLFVBQVUsRUFBRTtRQUNuQyxVQUFVLENBQUMsTUFBTTs7OztRQUFHLENBQUMsS0FBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFDO1FBQ25GLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQzs7Ozs7O0lBRU8sZ0JBQWdCLENBQUMsSUFBWTtRQUNqQyxPQUFPLHlDQUF5QyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoRSxDQUFDOzs7Ozs7SUFFTyxlQUFlLENBQUMsV0FBbUI7UUFDdkMsSUFBSSxDQUFDLG1CQUFtQjthQUNuQixJQUFJOzs7O1FBQUMsQ0FBQyxTQUFrQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFDO2FBQ3RGLElBQUk7OztRQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFDO2FBQ3pDLEtBQUs7Ozs7UUFBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUMzQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLENBQUMsRUFBQyxDQUFDO0lBQ1gsQ0FBQzs7Ozs7OztJQUVPLDJCQUEyQixDQUFDLFdBQW1CLEVBQUUsbUJBQTRCO1FBQ2pGLE9BQU8sSUFBSSxPQUFPOzs7OztRQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU07OztZQUFHLEdBQUcsRUFBRTtnQkFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsOEJBQThCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDNUYsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUM7Z0JBQzFELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDO2dCQUM1RCxPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQSxDQUFDO1lBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQztRQUN6QyxDQUFDLEVBQUMsQ0FBQztJQUNQLENBQUM7Ozs7OztJQUVPLGdCQUFnQixDQUFDLEdBQVc7O2NBQzFCLEdBQUcsR0FBRyxJQUFJLEtBQUssRUFBRTtRQUN2QixHQUFHLENBQUMsT0FBTzs7O1FBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQSxDQUFDO1FBQ2hELEdBQUcsQ0FBQyxNQUFNOzs7UUFBRyxHQUFHLEVBQUU7O2tCQUNSLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQzs7a0JBQ3pDLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztZQUN2QyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDekIsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQzNCLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQSxDQUFDO1FBQ0YsR0FBRyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDOUIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbEIsQ0FBQzs7Ozs7SUFFTyxrQkFBa0I7O2NBQ2hCLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTTtRQUN0RSxJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUMvQixJQUFJLGNBQWMsR0FBRyxDQUFDLEVBQUU7O3NCQUNkLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXOztzQkFDOUQsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVc7Z0JBQ3RFLE9BQU87b0JBQ0gsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUM7b0JBQzVELE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLGtCQUFrQixDQUFDO2lCQUNoRSxDQUFDO2FBQ0w7aUJBQU07O3NCQUNHLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXOztzQkFDL0Qsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVc7Z0JBQ3JFLE9BQU87b0JBQ0gsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUM7b0JBQzNELE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDO2lCQUNqRSxDQUFDO2FBQ0w7U0FDSjtRQUVELElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtZQUNwQixPQUFPO2dCQUNILE1BQU0sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUs7Z0JBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU07YUFDbEMsQ0FBQztTQUNMO1FBQ0QsT0FBTztZQUNILEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUs7WUFDOUIsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTTtTQUNuQyxDQUFDO0lBQ04sQ0FBQzs7Ozs7SUFFTyxzQkFBc0I7UUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDNUUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztTQUN2RDs7Y0FDSyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUU7UUFDckQsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUN2RCxDQUFDOzs7OztJQUVPLG9CQUFvQjs7Y0FDbEIsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNOztjQUNoRSxlQUFlLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFOztjQUMzQyxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7UUFDL0MsTUFBTSxDQUFDLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQzs7Y0FDakMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxZQUFZLENBQ1osSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ2hDLENBQUMsRUFDRCxDQUFDLEVBQ0QsQ0FBQyxFQUNELE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUNoQixNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FDcEIsQ0FBQztRQUNGLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLEdBQUcsQ0FBQyxTQUFTLENBQ1QsSUFBSSxDQUFDLGFBQWEsRUFDbEIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQzVCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUNoQyxDQUFDO1FBQ0YsT0FBTyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDOUIsQ0FBQzs7Ozs7O0lBRU8sbUJBQW1CLENBQUMsaUJBQWlCO1FBQ3pDLE9BQU8sSUFBSSxPQUFPOzs7O1FBQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUNqQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7WUFDM0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLDhCQUE4QixDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU07OztZQUFHLEdBQUcsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQztnQkFDaEUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUEsQ0FBQztZQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQ3ZELENBQUMsRUFBQyxDQUFDO0lBQ1AsQ0FBQzs7OztJQUVELGlCQUFpQjtRQUNiLElBQUksSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUksRUFBRTtZQUMvQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUM7WUFDaEMsVUFBVTs7O1lBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEVBQUMsQ0FBQztTQUN6RDtJQUNMLENBQUM7Ozs7O0lBRU8sNEJBQTRCO1FBQ2hDLElBQUksSUFBSSxDQUFDLHNCQUFzQixHQUFHLEVBQUUsRUFBRTtZQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQy9CO2FBQU0sSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtZQUNqQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO1NBQzFCO2FBQU07WUFDSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUM5QixVQUFVOzs7WUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRSxFQUFFLENBQUMsQ0FBQztTQUM3RDtJQUNMLENBQUM7Ozs7O0lBRU8saUJBQWlCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ2hILENBQUM7Ozs7SUFHRCxRQUFRO1FBQ0osSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ25DLENBQUM7Ozs7O0lBRU8sb0JBQW9CO1FBQ3hCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTs7a0JBQ1AsTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUMxRCxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1NBQzNDO2FBQU0sSUFBSSxTQUFTLEVBQUUsRUFBRTtZQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLHVFQUF1RSxDQUFDLENBQUM7U0FDekY7SUFDTCxDQUFDOzs7OztJQUVPLHFCQUFxQjs7Y0FDbkIsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhO1FBQ3pELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssa0JBQWtCLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLGtCQUFrQixDQUFDLFlBQVksRUFBRTtZQUNsSCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDeEYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ3hGLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLGtCQUFrQixDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUMxRixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7U0FDN0Y7SUFDTCxDQUFDOzs7O0lBRUQsb0JBQW9COztjQUNWLGtCQUFrQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYTtRQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7WUFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLGtCQUFrQixDQUFDLFlBQVksQ0FBQztTQUNyRDthQUFNLElBQUksa0JBQWtCLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsa0JBQWtCLENBQUMsWUFBWSxFQUFFO1lBQzVGLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7O2tCQUMzQyxhQUFhLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXO1lBQ3ZFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxhQUFhLENBQUM7U0FDckQ7YUFBTTtZQUNILElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxZQUFZLENBQUM7O2tCQUM1QyxZQUFZLEdBQUcsa0JBQWtCLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXO1lBQ3ZFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsV0FBVyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUM7U0FDcEQ7UUFDRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDN0IsQ0FBQzs7Ozs7SUFFRCxjQUFjLENBQUMsS0FBVTtRQUNyQixJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Ozs7OztJQUVPLHNCQUFzQixDQUFDLEtBQVU7UUFDckMsSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRTtZQUN0QyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztZQUMzQixPQUFPO1NBQ1Y7SUFDTCxDQUFDOzs7Ozs7SUFFTyxtQkFBbUIsQ0FBQyxLQUFLOztjQUN2QixpQkFBaUIsR0FBYSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQztRQUN2RixJQUFJLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDMUMsT0FBTztTQUNWOztjQUNLLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSTs7Y0FDN0QsUUFBUSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDOztjQUN2RyxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0QsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3BCLENBQUM7Ozs7OztJQUVPLGlCQUFpQixDQUFDLEdBQVc7UUFDakMsUUFBUSxHQUFHLEVBQUU7WUFDVCxLQUFLLFNBQVM7Z0JBQ1YsT0FBTyxLQUFLLENBQUM7WUFDakIsS0FBSyxZQUFZO2dCQUNiLE9BQU8sT0FBTyxDQUFDO1lBQ25CLEtBQUssV0FBVztnQkFDWixPQUFPLFFBQVEsQ0FBQztZQUNwQixLQUFLLFdBQVcsQ0FBQztZQUNqQjtnQkFDSSxPQUFPLE1BQU0sQ0FBQztTQUNyQjtJQUNMLENBQUM7Ozs7OztJQUVPLHlCQUF5QixDQUFDLEdBQVc7UUFDekMsUUFBUSxHQUFHLEVBQUU7WUFDVCxLQUFLLFNBQVM7Z0JBQ1YsT0FBTyxRQUFRLENBQUM7WUFDcEIsS0FBSyxZQUFZO2dCQUNiLE9BQU8sTUFBTSxDQUFDO1lBQ2xCLEtBQUssV0FBVztnQkFDWixPQUFPLEtBQUssQ0FBQztZQUNqQixLQUFLLFdBQVcsQ0FBQztZQUNqQjtnQkFDSSxPQUFPLE9BQU8sQ0FBQztTQUN0QjtJQUNMLENBQUM7Ozs7Ozs7SUFFTyxjQUFjLENBQUMsR0FBVyxFQUFFLFFBQWdCO1FBQ2hELFFBQVEsR0FBRyxFQUFFO1lBQ1QsS0FBSyxTQUFTO2dCQUNWLE9BQU8sRUFBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQztZQUNoRCxLQUFLLFlBQVk7Z0JBQ2IsT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBQyxDQUFDO1lBQzNDLEtBQUssV0FBVztnQkFDWixPQUFPLEVBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7WUFDM0MsS0FBSyxXQUFXLENBQUM7WUFDakI7Z0JBQ0ksT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBQyxDQUFDO1NBQ25EO0lBQ0wsQ0FBQzs7Ozs7OztJQUVELFNBQVMsQ0FBQyxLQUFVLEVBQUUsUUFBbUIsRUFBRSxXQUEwQixJQUFJO1FBQ3JFLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxFQUFFO1lBQ3BGLE9BQU87U0FDVjtRQUNELElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRTtZQUN0QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDMUI7UUFDRCxJQUFJLENBQUMsU0FBUyxtQkFDVixNQUFNLEVBQUUsSUFBSSxFQUNaLElBQUksRUFBRSxRQUFRLEVBQ2QsUUFBUSxFQUNSLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUMvQixPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FDbEIsQ0FBQztJQUNOLENBQUM7Ozs7O0lBRUQsVUFBVSxDQUFDLEtBQVU7UUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDdEIsT0FBTztTQUNWO1FBQ0QsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFO1lBQ3RCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUMxQjtRQUNELElBQUksQ0FBQyxTQUFTLG1CQUNWLE1BQU0sRUFBRSxJQUFJLEVBQ1osSUFBSSxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQ3JCLFFBQVEsRUFBRSxRQUFRLEVBQ2xCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUNsRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFDL0QsSUFBSSxDQUFDLE9BQU8sQ0FDbEIsQ0FBQztJQUNOLENBQUM7Ozs7O0lBSUQsT0FBTyxDQUFDLEtBQVU7UUFDZCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO1lBQ3ZCLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtnQkFDdkIsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO2FBQzNCO1lBQ0QsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFO2dCQUN0QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7YUFDMUI7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQztpQkFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNwQztZQUNELElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDM0I7SUFDTCxDQUFDOzs7OztJQUdELE9BQU8sQ0FBQyxLQUFVO1FBQ2QsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtZQUN2QixJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7Z0JBQ3ZCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQzthQUMzQjtZQUNELElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRTtnQkFDdEIsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO2FBQzFCO1lBQ0QsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEM7WUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzNCO0lBQ0wsQ0FBQzs7Ozs7SUFFTyxVQUFVO1FBQ2QsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFOztrQkFDWixrQkFBa0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWE7WUFDekQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxDQUFDO1lBQ3BELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLGtCQUFrQixDQUFDLFlBQVksQ0FBQztZQUN0RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztTQUM3RztJQUNMLENBQUM7Ozs7O0lBRU8sdUJBQXVCO1FBQzNCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ3ZCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1NBQ3BDO2FBQU07WUFDSCxJQUFJLENBQUMscUJBQXFCLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxFQUFFLENBQUM7U0FDcEM7SUFDTCxDQUFDOzs7OztJQUVPLHdCQUF3QjtRQUM1QixJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDdkYsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNiLENBQUM7Ozs7O0lBRU8seUJBQXlCO1FBQzdCLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQzFCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzdGO2FBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFO1lBQ2xDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFIO2FBQU07WUFDSCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsRUFBRSxDQUFDO1NBQ3BDO0lBQ0wsQ0FBQzs7Ozs7O0lBRU8sb0JBQW9CLENBQUMsWUFBWSxHQUFHLEtBQUs7UUFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN2QjtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDdkI7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO1lBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDeEM7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7U0FDekM7SUFDTCxDQUFDOzs7O0lBSUQsUUFBUTtRQUNKLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7WUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQzlCLElBQUksQ0FBQyxVQUFVLEVB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QyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3JHLE1BQU07WUFDVixLQUFLLE9BQU87Z0JBQ1IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ3BHLE1BQU07WUFDVixLQUFLLGFBQWE7Z0JBQ2QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ3BHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNO1lBQ1YsS0FBSyxRQUFRO2dCQUNULElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNO1lBQ1YsS0FBSyxZQUFZO2dCQUNiLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFF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SUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDOztzQkFDckYsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzs7c0JBQzdDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzs7c0JBQzlELFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzs7c0JBQy9ELFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ25ELElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRTtvQkFDdEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7b0JBQy9HLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO29CQUMvRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO29CQUM3RyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2lCQUNoSDtnQkFDRCxNQUFNO1NBQ2I7SUFDTCxDQUFDOzs7OztJQUVPLFVBQVU7UUFDZCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDZixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDZjtJQUNMLENBQUM7Ozs7SUFFSyxZQUFZOztrQkFFUixFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUMsR0FBRyxtQkFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUF1QjtZQUU1RCxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNULE9BQU8sSUFBSSxDQUFDO2FBQ2Y7WUFFRCxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sSUFBSSxPQUFPOzs7O1lBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDeEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNOzs7O2dCQUFDLElBQUksQ0FBQyxFQUFFO29CQUNyQixJQUFJLENBQUMsSUFBSSxFQUFFO3dCQUNQLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUM3QjtvQkFDRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxFQUFDLENBQUM7WUFDUCxDQUFDLEVBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLE9BQU8sTUFBTSxDQUFDO1FBRWxCLENBQUM7S0FBQTs7Ozs7SUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUs7UUFDakIsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLEVBQUU7WUFDckYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7a0JBQ3JCLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7O2tCQUN2QyxLQUFLLEdBQUcsYUFBYSxDQUFDLEVBQUUsR0FBRyxhQUFhLENBQUMsRUFBRTs7a0JBQzNDLE1BQU0sR0FBRyxhQUFhLENBQUMsRUFBRSxHQUFHLGFBQWEsQ0FBQyxFQUFFOztrQkFFNUMsVUFBVSxHQUFHLG1CQUFBLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQXFCO1lBQ3hFLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLFVBQVUsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDOztrQkFFckIsR0FBRyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3ZDLElBQUksR0FBRyxFQUFFO2dCQUNMLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUU7b0JBQzlCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztvQkFDckMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDckM7O3NCQUVLLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O3NCQUN0RSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1RSxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3RFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUN6RCxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOztzQkFFbEcsTUFBTSxHQUFzQjtvQkFDOUIsS0FBSyxFQUFFLE1BQU07b0JBQ2IsYUFBYTtvQkFDYixlQUFlLG9CQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7aUJBQ3JDO2dCQUNELElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFO29CQUMvQixNQUFNLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7aUJBQzlEOztzQkFDSyxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO2dCQUN0RCxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUU7b0JBQ25CLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLENBQUM7b0JBQy9DLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQjt3QkFDcEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO3dCQUM3QyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLENBQUM7b0JBQ3ZDLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ3pEO2dCQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLElBQUksUUFBUSxFQUFFO29CQUNWLE9BQU8sRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUM7aUJBQ3hCO2dCQUNELE9BQU8sTUFBTSxDQUFDO2FBQ2pCO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDOzs7OztJQUVPLGdCQUFnQjs7Y0FDZCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWE7O2NBQ25ELEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxXQUFXOztjQUVuRSxHQUFHLEdBQW9CO1lBQ3pCLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztZQUN2QyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDdkMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDO1lBQ3ZDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztTQUMxQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUU7WUFDaEMsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0IsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0IsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RCxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDOzs7OztJQUVPLHNCQUFzQjs7Y0FDcEIsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNOztjQUNoRSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWE7O2NBQ25ELEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxXQUFXOztZQUNyRSxPQUFlOztZQUNmLE9BQWU7UUFFbkIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RFLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3pFO2FBQU07WUFDSCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNyRSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMxRTs7Y0FFSyxHQUFHLEdBQW9CO1lBQ3pCLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLE9BQU87WUFDakQsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsT0FBTztZQUNqRCxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxPQUFPO1lBQ2pELEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxHQUFHLE9BQU87U0FDcEQ7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFO1lBQ2hDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEQsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMxRDtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQzs7Ozs7O0lBRU8sWUFBWSxDQUFDLFVBQTZCO1FBQzlDLE9BQU8sVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUMzRSxDQUFDOzs7OztJQUVPLFVBQVU7UUFDZCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDOzs7Ozs7O0lBRU8sY0FBYyxDQUFDLEtBQWEsRUFBRSxNQUFjO1FBQ2hELElBQUksSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLEVBQUU7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ25ELE9BQU8sSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7YUFDckM7U0FDSjthQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLEVBQUU7WUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQ3JELE9BQU8sSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7YUFDdkM7U0FDSjtRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQzs7Ozs7O0lBRU8sVUFBVSxDQUFDLEtBQVU7UUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0YsQ0FBQzs7Ozs7O0lBRU8sVUFBVSxDQUFDLEtBQVU7UUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0YsQ0FBQzs7O1lBcjRCSixTQUFTLFNBQUM7Z0JBQ1AsUUFBUSxFQUFFLGVBQWU7Z0JBQ3pCLGcySEFBNkM7Z0JBRTdDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNOzthQUNsRDs7OztZQWJRLFlBQVk7WUFkakIsaUJBQWlCOzs7c0JBcURoQixTQUFTLFNBQUMsU0FBUyxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQzswQkFDbkMsU0FBUyxTQUFDLGFBQWEsRUFBRSxFQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUM7Z0NBRXhDLEtBQUs7dUJBQ0wsS0FBSzswQkFDTCxLQUFLO3dCQUNMLEtBQUs7cUJBRUwsS0FBSztrQ0FDTCxLQUFLO3dCQUNMLEtBQUs7MEJBQ0wsS0FBSzs0QkFDTCxLQUFLOzZCQUNMLEtBQUs7OEJBQ0wsS0FBSzsrQkFDTCxLQUFLOzZCQUNMLEtBQUs7OEJBQ0wsS0FBSzsyQkFDTCxLQUFLOzRCQUNMLEtBQUs7MkJBQ0wsS0FBSzt1QkFDTCxLQUFLOzhCQUNMLEtBQUs7dUNBQ0wsS0FBSztnQ0FDTCxLQUFLO3NCQUNMLEtBQUs7eUJBTUwsV0FBVyxTQUFDLGtCQUFrQixjQUM5QixLQUFLO3VCQUNMLFdBQVcsU0FBQyxnQkFBZ0IsY0FDNUIsS0FBSzsyQkFFTCxNQUFNOzZCQUNOLE1BQU07MEJBQ04sTUFBTTsyQkFDTixNQUFNOzhCQUNOLE1BQU07dUJBOFFOLFlBQVksU0FBQyxlQUFlO3NCQXlKNUIsWUFBWSxTQUFDLG9CQUFvQixFQUFFLENBQUMsUUFBUSxDQUFDLGNBQzdDLFlBQVksU0FBQyxvQkFBb0IsRUFBRSxDQUFDLFFBQVEsQ0FBQztzQkFvQjdDLFlBQVksU0FBQyxvQkFBb0IsRUFBRSxDQUFDLFFBQVEsQ0FBQzt1QkF1RTdDLFlBQVksU0FBQyxrQkFBa0IsY0FDL0IsWUFBWSxTQUFDLG1CQUFtQjt3QkFRaEMsWUFBWSxTQUFDLG1CQUFtQjs7Ozs7OztJQTVrQmpDLHVDQUVXOzs7OztJQUNYLDhDQUErQzs7Ozs7SUFDL0MsaURBQTJDOzs7OztJQUMzQywrQ0FBK0I7Ozs7O0lBQy9CLGtEQUFrQzs7Ozs7SUFDbEMsMENBQTZCOzs7OztJQUM3Qiw2Q0FBaUM7Ozs7O0lBQ2pDLGdEQUFvQzs7Ozs7SUFDcEMsdURBQW1DOzs7OztJQUNuQyxzREFBbUM7Ozs7O0lBQ25DLHVEQUFvQzs7Ozs7SUFDcEMsOENBQWdFOzs7OztJQUNoRSxvREFBNEU7Ozs7O0lBQzVFLHlDQUFxQjs7SUFFckIsK0NBQWlDOztJQUNqQyxtREFBdUM7O0lBQ3ZDLDJDQUF1Qzs7SUFDdkMsd0NBQW9COztJQUNwQiw2Q0FBcUI7O0lBQ3JCLDBDQUFzQjs7SUFFdEIsd0NBQTBEOztJQUMxRCw0Q0FBbUU7O0lBRW5FLGtEQUFnQzs7SUFDaEMseUNBQTBCOztJQUMxQiw0Q0FBNkI7O0lBQzdCLDBDQUF5Qjs7SUFFekIsdUNBQWlFOztJQUNqRSxvREFBb0M7O0lBQ3BDLDBDQUF3Qzs7SUFDeEMsNENBQXlCOztJQUN6Qiw4Q0FBMkI7O0lBQzNCLCtDQUE0Qjs7SUFDNUIsZ0RBQTZCOztJQUM3QixpREFBOEI7O0lBQzlCLCtDQUE0Qjs7SUFDNUIsZ0RBQTZCOztJQUM3Qiw2Q0FBOEI7O0lBQzlCLDhDQUErQjs7SUFDL0IsNkNBQTJCOztJQUMzQix5Q0FBeUI7O0lBQ3pCLGdEQUFpQzs7SUFDakMseURBQTBDOztJQUMxQyxrREFBbUM7O0lBQ25DLHdDQUtFOztJQUNGLDJDQUNrRDs7SUFDbEQseUNBQzBCOztJQUUxQiw2Q0FBK0Q7O0lBQy9ELCtDQUFvRDs7SUFDcEQsNENBQWlEOztJQUNqRCw2Q0FBd0Q7O0lBQ3hELGdEQUFxRDs7Ozs7SUFFekMsMENBQStCOzs7OztJQUMvQixtQ0FBNkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICAgIENoYW5nZURldGVjdG9yUmVmLFxuICAgIENvbXBvbmVudCxcbiAgICBFbGVtZW50UmVmLFxuICAgIEV2ZW50RW1pdHRlcixcbiAgICBIb3N0QmluZGluZyxcbiAgICBIb3N0TGlzdGVuZXIsXG4gICAgSW5wdXQsXG4gICAgaXNEZXZNb2RlLFxuICAgIE9uQ2hhbmdlcyxcbiAgICBPbkluaXQsXG4gICAgT3V0cHV0LFxuICAgIFNpbXBsZUNoYW5nZXMsXG4gICAgVmlld0NoaWxkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRG9tU2FuaXRpemVyLCBTYWZlU3R5bGUsIFNhZmVVcmwgfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbmltcG9ydCB7IENyb3BwZXJQb3NpdGlvbiwgRGltZW5zaW9ucywgSW1hZ2VDcm9wcGVkRXZlbnQsIEludGVybmFsQ3JvcFJlc3VsdHMsIEltYWdlVHJhbnNmb3JtLCBNb3ZlU3RhcnQgfSBmcm9tICcuLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7IGdldFRyYW5zZm9ybWF0aW9uc0Zyb21FeGlmRGF0YSwgc3VwcG9ydHNBdXRvbWF0aWNSb3RhdGlvbiB9IGZyb20gJy4uL3V0aWxzL2V4aWYudXRpbHMnO1xuaW1wb3J0IHsgcmVzaXplQ2FudmFzIH0gZnJvbSAnLi4vdXRpbHMvcmVzaXplLnV0aWxzJztcbmltcG9ydCB7IEV4aWZUcmFuc2Zvcm0gfSBmcm9tICcuLi9pbnRlcmZhY2VzL2V4aWYtdHJhbnNmb3JtLmludGVyZmFjZSc7XG5pbXBvcnQgeyBIYW1tZXJTdGF0aWMgfSBmcm9tICcuLi91dGlscy9oYW1tZXIudXRpbHMnO1xuaW1wb3J0IHsgTW92ZVR5cGVzIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9tb3ZlLXN0YXJ0LmludGVyZmFjZSc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnaW1hZ2UtY3JvcHBlcicsXG4gICAgdGVtcGxhdGVVcmw6ICcuL2ltYWdlLWNyb3BwZXIuY29tcG9uZW50Lmh0bWwnLFxuICAgIHN0eWxlVXJsczogWycuL2ltYWdlLWNyb3BwZXIuY29tcG9uZW50LnNjc3MnXSxcbiAgICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBJbWFnZUNyb3BwZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkNoYW5nZXMsIE9uSW5pdCB7XG4gICAgcHJpdmF0ZSBIYW1tZXI6IEhhbW1lclN0YXRpYyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gKHdpbmRvdyBhcyBhbnkpLkhhbW1lciBhcyBIYW1tZXJTdGF0aWNcbiAgICAgICAgOiBudWxsO1xuICAgIHByaXZhdGUgb3JpZ2luYWxJbWFnZTogSFRNTEltYWdlRWxlbWVudCB8IG51bGw7XG4gICAgcHJpdmF0ZSB0cmFuc2Zvcm1lZEltYWdlOiBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIHByaXZhdGUgb3JpZ2luYWxCYXNlNjQ6IHN0cmluZztcbiAgICBwcml2YXRlIHRyYW5zZm9ybWVkQmFzZTY0OiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBtb3ZlU3RhcnQ6IE1vdmVTdGFydDtcbiAgICBwcml2YXRlIG9yaWdpbmFsU2l6ZTogRGltZW5zaW9ucztcbiAgICBwcml2YXRlIHRyYW5zZm9ybWVkU2l6ZTogRGltZW5zaW9ucztcbiAgICBwcml2YXRlIHNldEltYWdlTWF4U2l6ZVJldHJpZXMgPSAwO1xuICAgIHByaXZhdGUgY3JvcHBlclNjYWxlZE1pbldpZHRoID0gMjA7XG4gICAgcHJpdmF0ZSBjcm9wcGVyU2NhbGVkTWluSGVpZ2h0ID0gMjA7XG4gICAgcHJpdmF0ZSBleGlmVHJhbnNmb3JtOiBFeGlmVHJhbnNmb3JtID0ge3JvdGF0ZTogMCwgZmxpcDogZmFsc2V9O1xuICAgIHByaXZhdGUgYXV0b1JvdGF0ZVN1cHBvcnRlZDogUHJvbWlzZTxib29sZWFuPiA9IHN1cHBvcnRzQXV0b21hdGljUm90YXRpb24oKTtcbiAgICBwcml2YXRlIHN0ZXBTaXplID0gMztcblxuICAgIHNhZmVJbWdEYXRhVXJsOiBTYWZlVXJsIHwgc3RyaW5nO1xuICAgIHNhZmVUcmFuc2Zvcm1TdHlsZTogU2FmZVN0eWxlIHwgc3RyaW5nO1xuICAgIG1hcmdpbkxlZnQ6IFNhZmVTdHlsZSB8IHN0cmluZyA9ICcwcHgnO1xuICAgIG1heFNpemU6IERpbWVuc2lvbnM7XG4gICAgaW1hZ2VWaXNpYmxlID0gZmFsc2U7XG4gICAgbW92ZVR5cGVzID0gTW92ZVR5cGVzO1xuXG4gICAgQFZpZXdDaGlsZCgnd3JhcHBlcicsIHtzdGF0aWM6IHRydWV9KSB3cmFwcGVyOiBFbGVtZW50UmVmO1xuICAgIEBWaWV3Q2hpbGQoJ3NvdXJjZUltYWdlJywge3N0YXRpYzogZmFsc2V9KSBzb3VyY2VJbWFnZTogRWxlbWVudFJlZjtcblxuICAgIEBJbnB1dCgpIGltYWdlQ2hhbmdlZEV2ZW50OiBhbnk7XG4gICAgQElucHV0KCkgaW1hZ2VVUkw6IHN0cmluZztcbiAgICBASW5wdXQoKSBpbWFnZUJhc2U2NDogc3RyaW5nO1xuICAgIEBJbnB1dCgpIGltYWdlRmlsZTogRmlsZTtcblxuICAgIEBJbnB1dCgpIGZvcm1hdDogJ3BuZycgfCAnanBlZycgfCAnYm1wJyB8ICd3ZWJwJyB8ICdpY28nID0gJ3BuZyc7XG4gICAgQElucHV0KCkgbWFpbnRhaW5Bc3BlY3RSYXRpbyA9IHRydWU7XG4gICAgQElucHV0KCkgdHJhbnNmb3JtOiBJbWFnZVRyYW5zZm9ybSA9IHt9O1xuICAgIEBJbnB1dCgpIGFzcGVjdFJhdGlvID0gMTtcbiAgICBASW5wdXQoKSByZXNpemVUb1dpZHRoID0gMDtcbiAgICBASW5wdXQoKSByZXNpemVUb0hlaWdodCA9IDA7XG4gICAgQElucHV0KCkgY3JvcHBlck1pbldpZHRoID0gMDtcbiAgICBASW5wdXQoKSBjcm9wcGVyTWluSGVpZ2h0ID0gMDtcbiAgICBASW5wdXQoKSBjYW52YXNSb3RhdGlvbiA9IDA7XG4gICAgQElucHV0KCkgaW5pdGlhbFN0ZXBTaXplID0gMztcbiAgICBASW5wdXQoKSByb3VuZENyb3BwZXIgPSBmYWxzZTtcbiAgICBASW5wdXQoKSBvbmx5U2NhbGVEb3duID0gZmFsc2U7XG4gICAgQElucHV0KCkgaW1hZ2VRdWFsaXR5ID0gOTI7XG4gICAgQElucHV0KCkgYXV0b0Nyb3AgPSB0cnVlO1xuICAgIEBJbnB1dCgpIGJhY2tncm91bmRDb2xvcjogc3RyaW5nO1xuICAgIEBJbnB1dCgpIGNvbnRhaW5XaXRoaW5Bc3BlY3RSYXRpbyA9IGZhbHNlO1xuICAgIEBJbnB1dCgpIGhpZGVSZXNpemVTcXVhcmVzID0gZmFsc2U7XG4gICAgQElucHV0KCkgY3JvcHBlcjogQ3JvcHBlclBvc2l0aW9uID0ge1xuICAgICAgICB4MTogLTEwMCxcbiAgICAgICAgeTE6IC0xMDAsXG4gICAgICAgIHgyOiAxMDAwMCxcbiAgICAgICAgeTI6IDEwMDAwXG4gICAgfTtcbiAgICBASG9zdEJpbmRpbmcoJ3N0eWxlLnRleHQtYWxpZ24nKVxuICAgIEBJbnB1dCgpIGFsaWduSW1hZ2U6ICdsZWZ0JyB8ICdjZW50ZXInID0gJ2NlbnRlcic7XG4gICAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kaXNhYmxlZCcpXG4gICAgQElucHV0KCkgZGlzYWJsZWQgPSBmYWxzZTtcblxuICAgIEBPdXRwdXQoKSBpbWFnZUNyb3BwZWQgPSBuZXcgRXZlbnRFbWl0dGVyPEltYWdlQ3JvcHBlZEV2ZW50PigpO1xuICAgIEBPdXRwdXQoKSBzdGFydENyb3BJbWFnZSA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcbiAgICBAT3V0cHV0KCkgaW1hZ2VMb2FkZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG4gICAgQE91dHB1dCgpIGNyb3BwZXJSZWFkeSA9IG5ldyBFdmVudEVtaXR0ZXI8RGltZW5zaW9ucz4oKTtcbiAgICBAT3V0cHV0KCkgbG9hZEltYWdlRmFpbGVkID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBzYW5pdGl6ZXI6IERvbVNhbml0aXplcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICAgICAgICB0aGlzLmluaXRDcm9wcGVyKCk7XG4gICAgfVxuXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgICAgICB0aGlzLm9uQ2hhbmdlc0lucHV0SW1hZ2UoY2hhbmdlcyk7XG5cbiAgICAgICAgaWYgKHRoaXMub3JpZ2luYWxJbWFnZSAmJiB0aGlzLm9yaWdpbmFsSW1hZ2UuY29tcGxldGUgJiYgdGhpcy5leGlmVHJhbnNmb3JtXG4gICAgICAgICAgICAmJiAoY2hhbmdlcy5jb250YWluV2l0aGluQXNwZWN0UmF0aW8gfHwgY2hhbmdlcy5jYW52YXNSb3RhdGlvbikpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtT3JpZ2luYWxJbWFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzLmNyb3BwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWF4U2l6ZSgpO1xuICAgICAgICAgICAgdGhpcy5zZXRDcm9wcGVyU2NhbGVkTWluU2l6ZSgpO1xuICAgICAgICAgICAgdGhpcy5jaGVja0Nyb3BwZXJQb3NpdGlvbihmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmRvQXV0b0Nyb3AoKTtcbiAgICAgICAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5nZXMuYXNwZWN0UmF0aW8gJiYgdGhpcy5pbWFnZVZpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRDcm9wcGVyUG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlcy50cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtID0gdGhpcy50cmFuc2Zvcm0gfHwge307XG4gICAgICAgICAgICB0aGlzLnNldENzc1RyYW5zZm9ybSgpO1xuICAgICAgICAgICAgdGhpcy5kb0F1dG9Dcm9wKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2hhbmdlc0lucHV0SW1hZ2UoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBpZiAoY2hhbmdlcy5pbWFnZUNoYW5nZWRFdmVudCB8fCBjaGFuZ2VzLmltYWdlVVJMIHx8IGNoYW5nZXMuaW1hZ2VCYXNlNjQgfHwgY2hhbmdlcy5pbWFnZUZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdENyb3BwZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlcy5pbWFnZUNoYW5nZWRFdmVudCAmJiB0aGlzLmlzVmFsaWRJbWFnZUNoYW5nZWRFdmVudCgpKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRJbWFnZUZpbGUodGhpcy5pbWFnZUNoYW5nZWRFdmVudC50YXJnZXQuZmlsZXNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzLmltYWdlVVJMICYmIHRoaXMuaW1hZ2VVUkwpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZEltYWdlRnJvbVVSTCh0aGlzLmltYWdlVVJMKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlcy5pbWFnZUJhc2U2NCAmJiB0aGlzLmltYWdlQmFzZTY0KSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRCYXNlNjRJbWFnZSh0aGlzLmltYWdlQmFzZTY0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlcy5pbWFnZUZpbGUgJiYgdGhpcy5pbWFnZUZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZEltYWdlRmlsZSh0aGlzLmltYWdlRmlsZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGlzVmFsaWRJbWFnZUNoYW5nZWRFdmVudCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW1hZ2VDaGFuZ2VkRXZlbnRcbiAgICAgICAgICAgICYmIHRoaXMuaW1hZ2VDaGFuZ2VkRXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAmJiB0aGlzLmltYWdlQ2hhbmdlZEV2ZW50LnRhcmdldC5maWxlc1xuICAgICAgICAgICAgJiYgdGhpcy5pbWFnZUNoYW5nZWRFdmVudC50YXJnZXQuZmlsZXMubGVuZ3RoID4gMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldENzc1RyYW5zZm9ybSgpIHtcbiAgICAgICAgdGhpcy5zYWZlVHJhbnNmb3JtU3R5bGUgPSB0aGlzLnNhbml0aXplci5ieXBhc3NTZWN1cml0eVRydXN0U3R5bGUoXG4gICAgICAgICAgICAnc2NhbGVYKCcgKyAodGhpcy50cmFuc2Zvcm0uc2NhbGUgfHwgMSkgKiAodGhpcy50cmFuc2Zvcm0uZmxpcEggPyAtMSA6IDEpICsgJyknICtcbiAgICAgICAgICAgICdzY2FsZVkoJyArICh0aGlzLnRyYW5zZm9ybS5zY2FsZSB8fCAxKSAqICh0aGlzLnRyYW5zZm9ybS5mbGlwViA/IC0xIDogMSkgKyAnKScgK1xuICAgICAgICAgICAgJ3JvdGF0ZSgnICsgKHRoaXMudHJhbnNmb3JtLnJvdGF0ZSB8fCAwKSArICdkZWcpJ1xuICAgICAgICApO1xuICAgIH1cblxuICAgIG5nT25Jbml0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnN0ZXBTaXplID0gdGhpcy5pbml0aWFsU3RlcFNpemU7XG4gICAgICAgIHRoaXMuYWN0aXZhdGVQaW5jaEdlc3R1cmUoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRDcm9wcGVyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmltYWdlVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRyYW5zZm9ybWVkSW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLnNhZmVJbWdEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnJ1xuICAgICAgICAgICAgKyAnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFDMGxFUVZRWVYyTmdBQUlBQUFVJ1xuICAgICAgICAgICAgKyAnQUFhclZ5RkVBQUFBQVNVVk9SSzVDWUlJPSc7XG4gICAgICAgIHRoaXMubW92ZVN0YXJ0ID0ge1xuICAgICAgICAgICAgYWN0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6IG51bGwsXG4gICAgICAgICAgICBwb3NpdGlvbjogbnVsbCxcbiAgICAgICAgICAgIHgxOiAwLFxuICAgICAgICAgICAgeTE6IDAsXG4gICAgICAgICAgICB4MjogMCxcbiAgICAgICAgICAgIHkyOiAwLFxuICAgICAgICAgICAgY2xpZW50WDogMCxcbiAgICAgICAgICAgIGNsaWVudFk6IDBcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5tYXhTaXplID0ge1xuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDBcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vcmlnaW5hbFNpemUgPSB7XG4gICAgICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgICAgIGhlaWdodDogMFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRyYW5zZm9ybWVkU2l6ZSA9IHtcbiAgICAgICAgICAgIHdpZHRoOiAwLFxuICAgICAgICAgICAgaGVpZ2h0OiAwXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY3JvcHBlci54MSA9IC0xMDA7XG4gICAgICAgIHRoaXMuY3JvcHBlci55MSA9IC0xMDA7XG4gICAgICAgIHRoaXMuY3JvcHBlci54MiA9IDEwMDAwO1xuICAgICAgICB0aGlzLmNyb3BwZXIueTIgPSAxMDAwMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGxvYWRJbWFnZShpbWFnZUJhc2U2NDogc3RyaW5nLCBpbWFnZVR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkSW1hZ2VUeXBlKGltYWdlVHlwZSkpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZEJhc2U2NEltYWdlKGltYWdlQmFzZTY0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9hZEltYWdlRmFpbGVkLmVtaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZEltYWdlRmlsZShmaWxlOiBGaWxlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IChldmVudDogYW55KSA9PiB0aGlzLmxvYWRJbWFnZShldmVudC50YXJnZXQucmVzdWx0LCBmaWxlLnR5cGUpO1xuICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc1ZhbGlkSW1hZ2VUeXBlKHR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gL2ltYWdlXFwvKHBuZ3xqcGd8anBlZ3xibXB8Z2lmfHRpZmZ8d2VicCkvLnRlc3QodHlwZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkQmFzZTY0SW1hZ2UoaW1hZ2VCYXNlNjQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLmF1dG9Sb3RhdGVTdXBwb3J0ZWRcbiAgICAgICAgICAgIC50aGVuKChzdXBwb3J0ZWQ6IGJvb2xlYW4pID0+IHRoaXMuY2hlY2tFeGlmQW5kTG9hZEJhc2U2NEltYWdlKGltYWdlQmFzZTY0LCBzdXBwb3J0ZWQpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy50cmFuc2Zvcm1PcmlnaW5hbEltYWdlKCkpXG4gICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkSW1hZ2VGYWlsZWQuZW1pdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luYWxJbWFnZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5hbEJhc2U2NCA9IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNoZWNrRXhpZkFuZExvYWRCYXNlNjRJbWFnZShpbWFnZUJhc2U2NDogc3RyaW5nLCBhdXRvUm90YXRlU3VwcG9ydGVkOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxJbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5hbEJhc2U2NCA9IGltYWdlQmFzZTY0O1xuICAgICAgICAgICAgICAgIHRoaXMuZXhpZlRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybWF0aW9uc0Zyb21FeGlmRGF0YShhdXRvUm90YXRlU3VwcG9ydGVkID8gLTEgOiBpbWFnZUJhc2U2NCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5hbFNpemUud2lkdGggPSB0aGlzLm9yaWdpbmFsSW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luYWxTaXplLmhlaWdodCA9IHRoaXMub3JpZ2luYWxJbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsSW1hZ2Uub25lcnJvciA9IHJlamVjdDtcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxJbWFnZS5zcmMgPSBpbWFnZUJhc2U2NDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkSW1hZ2VGcm9tVVJMKHVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWcub25lcnJvciA9ICgpID0+IHRoaXMubG9hZEltYWdlRmFpbGVkLmVtaXQoKTtcbiAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltZy5oZWlnaHQ7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgICAgICAgICAgdGhpcy5sb2FkQmFzZTY0SW1hZ2UoY2FudmFzLnRvRGF0YVVSTCgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG4gICAgICAgIGltZy5zcmMgPSB1cmw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRUcmFuc2Zvcm1lZFNpemUoKTogRGltZW5zaW9ucyB7XG4gICAgICAgIGNvbnN0IGNhbnZhc1JvdGF0aW9uID0gdGhpcy5jYW52YXNSb3RhdGlvbiArIHRoaXMuZXhpZlRyYW5zZm9ybS5yb3RhdGU7XG4gICAgICAgIGlmICh0aGlzLmNvbnRhaW5XaXRoaW5Bc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgaWYgKGNhbnZhc1JvdGF0aW9uICUgMikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pbldpZHRoVG9Db250YWluID0gdGhpcy5vcmlnaW5hbFNpemUud2lkdGggKiB0aGlzLmFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pbkhlaWdodFRvQ29udGFpbiA9IHRoaXMub3JpZ2luYWxTaXplLmhlaWdodCAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IE1hdGgubWF4KHRoaXMub3JpZ2luYWxTaXplLmhlaWdodCwgbWluV2lkdGhUb0NvbnRhaW4pLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IE1hdGgubWF4KHRoaXMub3JpZ2luYWxTaXplLndpZHRoLCBtaW5IZWlnaHRUb0NvbnRhaW4pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pbldpZHRoVG9Db250YWluID0gdGhpcy5vcmlnaW5hbFNpemUuaGVpZ2h0ICogdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICBjb25zdCBtaW5IZWlnaHRUb0NvbnRhaW4gPSB0aGlzLm9yaWdpbmFsU2l6ZS53aWR0aCAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IE1hdGgubWF4KHRoaXMub3JpZ2luYWxTaXplLndpZHRoLCBtaW5XaWR0aFRvQ29udGFpbiksXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogTWF0aC5tYXgodGhpcy5vcmlnaW5hbFNpemUuaGVpZ2h0LCBtaW5IZWlnaHRUb0NvbnRhaW4pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FudmFzUm90YXRpb24gJSAyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5vcmlnaW5hbFNpemUud2lkdGgsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMub3JpZ2luYWxTaXplLmhlaWdodCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLm9yaWdpbmFsU2l6ZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5vcmlnaW5hbFNpemUuaGVpZ2h0LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgdHJhbnNmb3JtT3JpZ2luYWxJbWFnZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLm9yaWdpbmFsSW1hZ2UgfHwgIXRoaXMub3JpZ2luYWxJbWFnZS5jb21wbGV0ZSB8fCAhdGhpcy5leGlmVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBpbWFnZSBsb2FkZWQnKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHJhbnNmb3JtZWRCYXNlNjQgPSB0aGlzLnRyYW5zZm9ybUltYWdlQmFzZTY0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLnNldFRyYW5zZm9ybWVkSW1hZ2UodHJhbnNmb3JtZWRCYXNlNjQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdHJhbnNmb3JtSW1hZ2VCYXNlNjQoKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgY2FudmFzUm90YXRpb24gPSB0aGlzLmNhbnZhc1JvdGF0aW9uICsgdGhpcy5leGlmVHJhbnNmb3JtLnJvdGF0ZTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtZWRTaXplID0gdGhpcy5nZXRUcmFuc2Zvcm1lZFNpemUoKTtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHRyYW5zZm9ybWVkU2l6ZS53aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHRyYW5zZm9ybWVkU2l6ZS5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBjdHguc2V0VHJhbnNmb3JtKFxuICAgICAgICAgICAgdGhpcy5leGlmVHJhbnNmb3JtLmZsaXAgPyAtMSA6IDEsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgICBjYW52YXMud2lkdGggLyAyLFxuICAgICAgICAgICAgY2FudmFzLmhlaWdodCAvIDJcbiAgICAgICAgKTtcbiAgICAgICAgY3R4LnJvdGF0ZShNYXRoLlBJICogKGNhbnZhc1JvdGF0aW9uIC8gMikpO1xuICAgICAgICBjdHguZHJhd0ltYWdlKFxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbEltYWdlLFxuICAgICAgICAgICAgLXRoaXMub3JpZ2luYWxTaXplLndpZHRoIC8gMixcbiAgICAgICAgICAgIC10aGlzLm9yaWdpbmFsU2l6ZS5oZWlnaHQgLyAyXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRUcmFuc2Zvcm1lZEltYWdlKHRyYW5zZm9ybWVkQmFzZTY0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1lZEJhc2U2NCA9IHRyYW5zZm9ybWVkQmFzZTY0O1xuICAgICAgICAgICAgdGhpcy5zYWZlSW1nRGF0YVVybCA9IHRoaXMuc2FuaXRpemVyLmJ5cGFzc1NlY3VyaXR5VHJ1c3RSZXNvdXJjZVVybCh0cmFuc2Zvcm1lZEJhc2U2NCk7XG4gICAgICAgICAgICB0aGlzLnRyYW5zZm9ybWVkSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtZWRJbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1lZFNpemUud2lkdGggPSB0aGlzLnRyYW5zZm9ybWVkSW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtZWRTaXplLmhlaWdodCA9IHRoaXMudHJhbnNmb3JtZWRJbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtZWRJbWFnZS5zcmMgPSB0aGlzLnRyYW5zZm9ybWVkQmFzZTY0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpbWFnZUxvYWRlZEluVmlldygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNmb3JtZWRJbWFnZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmltYWdlTG9hZGVkLmVtaXQoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0SW1hZ2VNYXhTaXplUmV0cmllcyA9IDA7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2hlY2tJbWFnZU1heFNpemVSZWN1cnNpdmVseSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY2hlY2tJbWFnZU1heFNpemVSZWN1cnNpdmVseSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuc2V0SW1hZ2VNYXhTaXplUmV0cmllcyA+IDQwKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRJbWFnZUZhaWxlZC5lbWl0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zb3VyY2VJbWFnZUxvYWRlZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1heFNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3JvcHBlclNjYWxlZE1pblNpemUoKTtcbiAgICAgICAgICAgIHRoaXMucmVzZXRDcm9wcGVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlclJlYWR5LmVtaXQoey4uLnRoaXMubWF4U2l6ZX0pO1xuICAgICAgICAgICAgdGhpcy5jZC5tYXJrRm9yQ2hlY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SW1hZ2VNYXhTaXplUmV0cmllcysrO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNoZWNrSW1hZ2VNYXhTaXplUmVjdXJzaXZlbHkoKSwgNTApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzb3VyY2VJbWFnZUxvYWRlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlSW1hZ2UgJiYgdGhpcy5zb3VyY2VJbWFnZS5uYXRpdmVFbGVtZW50ICYmIHRoaXMuc291cmNlSW1hZ2UubmF0aXZlRWxlbWVudC5vZmZzZXRXaWR0aCA+IDA7XG4gICAgfVxuXG4gICAgQEhvc3RMaXN0ZW5lcignd2luZG93OnJlc2l6ZScpXG4gICAgb25SZXNpemUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVzaXplQ3JvcHBlclBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMuc2V0TWF4U2l6ZSgpO1xuICAgICAgICB0aGlzLnNldENyb3BwZXJTY2FsZWRNaW5TaXplKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhY3RpdmF0ZVBpbmNoR2VzdHVyZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuSGFtbWVyKSB7XG4gICAgICAgICAgICBjb25zdCBoYW1tZXIgPSBuZXcgdGhpcy5IYW1tZXIodGhpcy53cmFwcGVyLm5hdGl2ZUVsZW1lbnQpO1xuICAgICAgICAgICAgaGFtbWVyLmdldCgncGluY2gnKS5zZXQoe2VuYWJsZTogdHJ1ZX0pO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRGV2TW9kZSgpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tOZ3hJbWFnZUNyb3BwZXJdIENvdWxkIG5vdCBmaW5kIEhhbW1lckpTIC0gUGluY2ggR2VzdHVyZSB3b25cXCd0IHdvcmsnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzaXplQ3JvcHBlclBvc2l0aW9uKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzb3VyY2VJbWFnZUVsZW1lbnQgPSB0aGlzLnNvdXJjZUltYWdlLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGlmICh0aGlzLm1heFNpemUud2lkdGggIT09IHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRXaWR0aCB8fCB0aGlzLm1heFNpemUuaGVpZ2h0ICE9PSBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueDEgPSB0aGlzLmNyb3BwZXIueDEgKiBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLm1heFNpemUud2lkdGg7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueDIgPSB0aGlzLmNyb3BwZXIueDIgKiBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLm1heFNpemUud2lkdGg7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueTEgPSB0aGlzLmNyb3BwZXIueTEgKiBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0SGVpZ2h0IC8gdGhpcy5tYXhTaXplLmhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci55MiA9IHRoaXMuY3JvcHBlci55MiAqIHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRIZWlnaHQgLyB0aGlzLm1heFNpemUuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXRDcm9wcGVyUG9zaXRpb24oKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUltYWdlRWxlbWVudCA9IHRoaXMuc291cmNlSW1hZ2UubmF0aXZlRWxlbWVudDtcbiAgICAgICAgaWYgKCF0aGlzLm1haW50YWluQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MSA9IDA7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueDIgPSBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueTEgPSAwO1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkyID0gc291cmNlSW1hZ2VFbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICAgICAgfSBlbHNlIGlmIChzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLmFzcGVjdFJhdGlvIDwgc291cmNlSW1hZ2VFbGVtZW50Lm9mZnNldEhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngxID0gMDtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IGNyb3BwZXJIZWlnaHQgPSBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLmFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxID0gKHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRIZWlnaHQgLSBjcm9wcGVySGVpZ2h0KSAvIDI7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgPSB0aGlzLmNyb3BwZXIueTEgKyBjcm9wcGVySGVpZ2h0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxID0gMDtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci55MiA9IHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBjcm9wcGVyV2lkdGggPSBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0SGVpZ2h0ICogdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MSA9IChzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGggLSBjcm9wcGVyV2lkdGgpIC8gMjtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IHRoaXMuY3JvcHBlci54MSArIGNyb3BwZXJXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRvQXV0b0Nyb3AoKTtcbiAgICAgICAgdGhpcy5pbWFnZVZpc2libGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGtleWJvYXJkQWNjZXNzKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgdGhpcy5jaGFuZ2VLZXlib2FyZFN0ZXBTaXplKGV2ZW50KTtcbiAgICAgICAgdGhpcy5rZXlib2FyZE1vdmVDcm9wcGVyKGV2ZW50KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNoYW5nZUtleWJvYXJkU3RlcFNpemUoZXZlbnQ6IGFueSk6IHZvaWQge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID49ICcxJyAmJiBldmVudC5rZXkgPD0gJzknKSB7XG4gICAgICAgICAgICB0aGlzLnN0ZXBTaXplID0gK2V2ZW50LmtleTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUga2V5Ym9hcmRNb3ZlQ3JvcHBlcihldmVudCkge1xuICAgICAgICBjb25zdCBrZXlib2FyZFdoaXRlTGlzdDogc3RyaW5nW10gPSBbJ0Fycm93VXAnLCAnQXJyb3dEb3duJywgJ0Fycm93UmlnaHQnLCAnQXJyb3dMZWZ0J107XG4gICAgICAgIGlmICghKGtleWJvYXJkV2hpdGVMaXN0LmluY2x1ZGVzKGV2ZW50LmtleSkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW92ZVR5cGUgPSBldmVudC5zaGlmdEtleSA/IE1vdmVUeXBlcy5SZXNpemUgOiBNb3ZlVHlwZXMuTW92ZTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBldmVudC5hbHRLZXkgPyB0aGlzLmdldEludmVydGVkUG9zaXRpb25Gb3JLZXkoZXZlbnQua2V5KSA6IHRoaXMuZ2V0UG9zaXRpb25Gb3JLZXkoZXZlbnQua2V5KTtcbiAgICAgICAgY29uc3QgbW92ZUV2ZW50ID0gdGhpcy5nZXRFdmVudEZvcktleShldmVudC5rZXksIHRoaXMuc3RlcFNpemUpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5zdGFydE1vdmUoe2NsaWVudFg6IDAsIGNsaWVudFk6IDB9LCBtb3ZlVHlwZSwgcG9zaXRpb24pO1xuICAgICAgICB0aGlzLm1vdmVJbWcobW92ZUV2ZW50KTtcbiAgICAgICAgdGhpcy5tb3ZlU3RvcCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UG9zaXRpb25Gb3JLZXkoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0b3AnO1xuICAgICAgICAgICAgY2FzZSAnQXJyb3dSaWdodCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgICAgICAgICBjYXNlICdBcnJvd0Rvd24nOlxuICAgICAgICAgICAgICAgIHJldHVybiAnYm90dG9tJztcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93TGVmdCc6XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAnbGVmdCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEludmVydGVkUG9zaXRpb25Gb3JLZXkoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdib3R0b20nO1xuICAgICAgICAgICAgY2FzZSAnQXJyb3dSaWdodCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93RG93bic6XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0b3AnO1xuICAgICAgICAgICAgY2FzZSAnQXJyb3dMZWZ0JzpcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEV2ZW50Rm9yS2V5KGtleTogc3RyaW5nLCBzdGVwU2l6ZTogbnVtYmVyKTogYW55IHtcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93VXAnOlxuICAgICAgICAgICAgICAgIHJldHVybiB7Y2xpZW50WDogMCwgY2xpZW50WTogc3RlcFNpemUgKiAtMX07XG4gICAgICAgICAgICBjYXNlICdBcnJvd1JpZ2h0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge2NsaWVudFg6IHN0ZXBTaXplLCBjbGllbnRZOiAwfTtcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93RG93bic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtjbGllbnRYOiAwLCBjbGllbnRZOiBzdGVwU2l6ZX07XG4gICAgICAgICAgICBjYXNlICdBcnJvd0xlZnQnOlxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4ge2NsaWVudFg6IHN0ZXBTaXplICogLTEsIGNsaWVudFk6IDB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnRNb3ZlKGV2ZW50OiBhbnksIG1vdmVUeXBlOiBNb3ZlVHlwZXMsIHBvc2l0aW9uOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5tb3ZlU3RhcnQgJiYgdGhpcy5tb3ZlU3RhcnQuYWN0aXZlICYmIHRoaXMubW92ZVN0YXJ0LnR5cGUgPT09IE1vdmVUeXBlcy5QaW5jaCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVTdGFydCA9IHtcbiAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6IG1vdmVUeXBlLFxuICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICBjbGllbnRYOiB0aGlzLmdldENsaWVudFgoZXZlbnQpLFxuICAgICAgICAgICAgY2xpZW50WTogdGhpcy5nZXRDbGllbnRZKGV2ZW50KSxcbiAgICAgICAgICAgIC4uLnRoaXMuY3JvcHBlclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXJ0UGluY2goZXZlbnQ6IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMuc2FmZUltZ0RhdGFVcmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3ZlU3RhcnQgPSB7XG4gICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiBNb3ZlVHlwZXMuUGluY2gsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2NlbnRlcicsXG4gICAgICAgICAgICBjbGllbnRYOiB0aGlzLmNyb3BwZXIueDEgKyAodGhpcy5jcm9wcGVyLngyIC0gdGhpcy5jcm9wcGVyLngxKSAvIDIsXG4gICAgICAgICAgICBjbGllbnRZOiB0aGlzLmNyb3BwZXIueTEgKyAodGhpcy5jcm9wcGVyLnkyIC0gdGhpcy5jcm9wcGVyLnkxKSAvIDIsXG4gICAgICAgICAgICAuLi50aGlzLmNyb3BwZXJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBASG9zdExpc3RlbmVyKCdkb2N1bWVudDptb3VzZW1vdmUnLCBbJyRldmVudCddKVxuICAgIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OnRvdWNobW92ZScsIFsnJGV2ZW50J10pXG4gICAgbW92ZUltZyhldmVudDogYW55KTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLm1vdmVTdGFydC5hY3RpdmUpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5tb3ZlU3RhcnQudHlwZSA9PT0gTW92ZVR5cGVzLk1vdmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmUoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDcm9wcGVyUG9zaXRpb24odHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW92ZVN0YXJ0LnR5cGUgPT09IE1vdmVUeXBlcy5SZXNpemUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZShldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0Nyb3BwZXJQb3NpdGlvbihmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNkLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OnBpbmNobW92ZScsIFsnJGV2ZW50J10pXG4gICAgb25QaW5jaChldmVudDogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm1vdmVTdGFydC5hY3RpdmUpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5tb3ZlU3RhcnQudHlwZSA9PT0gTW92ZVR5cGVzLlBpbmNoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemUoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDcm9wcGVyUG9zaXRpb24oZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jZC5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldE1heFNpemUoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnNvdXJjZUltYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VJbWFnZUVsZW1lbnQgPSB0aGlzLnNvdXJjZUltYWdlLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICB0aGlzLm1heFNpemUud2lkdGggPSBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICB0aGlzLm1heFNpemUuaGVpZ2h0ID0gc291cmNlSW1hZ2VFbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgIHRoaXMubWFyZ2luTGVmdCA9IHRoaXMuc2FuaXRpemVyLmJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSgnY2FsYyg1MCUgLSAnICsgdGhpcy5tYXhTaXplLndpZHRoIC8gMiArICdweCknKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0Q3JvcHBlclNjYWxlZE1pblNpemUoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zZm9ybWVkSW1hZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3JvcHBlclNjYWxlZE1pbldpZHRoKCk7XG4gICAgICAgICAgICB0aGlzLnNldENyb3BwZXJTY2FsZWRNaW5IZWlnaHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoID0gMjA7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQgPSAyMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0Q3JvcHBlclNjYWxlZE1pbldpZHRoKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNyb3BwZXJTY2FsZWRNaW5XaWR0aCA9IHRoaXMuY3JvcHBlck1pbldpZHRoID4gMFxuICAgICAgICAgICAgPyBNYXRoLm1heCgyMCwgdGhpcy5jcm9wcGVyTWluV2lkdGggLyB0aGlzLnRyYW5zZm9ybWVkSW1hZ2Uud2lkdGggKiB0aGlzLm1heFNpemUud2lkdGgpXG4gICAgICAgICAgICA6IDIwO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0Q3JvcHBlclNjYWxlZE1pbkhlaWdodCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMubWFpbnRhaW5Bc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyU2NhbGVkTWluSGVpZ2h0ID0gTWF0aC5tYXgoMjAsIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoIC8gdGhpcy5hc3BlY3RSYXRpbyk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jcm9wcGVyTWluSGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyU2NhbGVkTWluSGVpZ2h0ID0gTWF0aC5tYXgoMjAsIHRoaXMuY3JvcHBlck1pbkhlaWdodCAvIHRoaXMudHJhbnNmb3JtZWRJbWFnZS5oZWlnaHQgKiB0aGlzLm1heFNpemUuaGVpZ2h0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlclNjYWxlZE1pbkhlaWdodCA9IDIwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaGVja0Nyb3BwZXJQb3NpdGlvbihtYWludGFpblNpemUgPSBmYWxzZSk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jcm9wcGVyLngxIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngyIC09IG1haW50YWluU2l6ZSA/IHRoaXMuY3JvcHBlci54MSA6IDA7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueDEgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNyb3BwZXIueTEgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgLT0gbWFpbnRhaW5TaXplID8gdGhpcy5jcm9wcGVyLnkxIDogMDtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci55MSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY3JvcHBlci54MiA+IHRoaXMubWF4U2l6ZS53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngxIC09IG1haW50YWluU2l6ZSA/ICh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLm1heFNpemUud2lkdGgpIDogMDtcbiAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IHRoaXMubWF4U2l6ZS53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jcm9wcGVyLnkyID4gdGhpcy5tYXhTaXplLmhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxIC09IG1haW50YWluU2l6ZSA/ICh0aGlzLmNyb3BwZXIueTIgLSB0aGlzLm1heFNpemUuaGVpZ2h0KSA6IDA7XG4gICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgPSB0aGlzLm1heFNpemUuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6bW91c2V1cCcpXG4gICAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6dG91Y2hlbmQnKVxuICAgIG1vdmVTdG9wKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5tb3ZlU3RhcnQuYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVTdGFydC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZG9BdXRvQ3JvcCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6cGluY2hlbmQnKVxuICAgIHBpbmNoU3RvcCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMubW92ZVN0YXJ0LmFjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlU3RhcnQuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmRvQXV0b0Nyb3AoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbW92ZShldmVudDogYW55KSB7XG4gICAgICAgIGNvbnN0IGRpZmZYID0gdGhpcy5nZXRDbGllbnRYKGV2ZW50KSAtIHRoaXMubW92ZVN0YXJ0LmNsaWVudFg7XG4gICAgICAgIGNvbnN0IGRpZmZZID0gdGhpcy5nZXRDbGllbnRZKGV2ZW50KSAtIHRoaXMubW92ZVN0YXJ0LmNsaWVudFk7XG5cbiAgICAgICAgdGhpcy5jcm9wcGVyLngxID0gdGhpcy5tb3ZlU3RhcnQueDEgKyBkaWZmWDtcbiAgICAgICAgdGhpcy5jcm9wcGVyLnkxID0gdGhpcy5tb3ZlU3RhcnQueTEgKyBkaWZmWTtcbiAgICAgICAgdGhpcy5jcm9wcGVyLngyID0gdGhpcy5tb3ZlU3RhcnQueDIgKyBkaWZmWDtcbiAgICAgICAgdGhpcy5jcm9wcGVyLnkyID0gdGhpcy5tb3ZlU3RhcnQueTIgKyBkaWZmWTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc2l6ZShldmVudDogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGRpZmZYID0gdGhpcy5nZXRDbGllbnRYKGV2ZW50KSAtIHRoaXMubW92ZVN0YXJ0LmNsaWVudFg7XG4gICAgICAgIGNvbnN0IGRpZmZZID0gdGhpcy5nZXRDbGllbnRZKGV2ZW50KSAtIHRoaXMubW92ZVN0YXJ0LmNsaWVudFk7XG4gICAgICAgIHN3aXRjaCAodGhpcy5tb3ZlU3RhcnQucG9zaXRpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MSA9IE1hdGgubWluKHRoaXMubW92ZVN0YXJ0LngxICsgZGlmZlgsIHRoaXMuY3JvcHBlci54MiAtIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RvcGxlZnQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MSA9IE1hdGgubWluKHRoaXMubW92ZVN0YXJ0LngxICsgZGlmZlgsIHRoaXMuY3JvcHBlci54MiAtIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTEgPSBNYXRoLm1pbih0aGlzLm1vdmVTdGFydC55MSArIGRpZmZZLCB0aGlzLmNyb3BwZXIueTIgLSB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTEgPSBNYXRoLm1pbih0aGlzLm1vdmVTdGFydC55MSArIGRpZmZZLCB0aGlzLmNyb3BwZXIueTIgLSB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndG9wcmlnaHQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IE1hdGgubWF4KHRoaXMubW92ZVN0YXJ0LngyICsgZGlmZlgsIHRoaXMuY3JvcHBlci54MSArIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTEgPSBNYXRoLm1pbih0aGlzLm1vdmVTdGFydC55MSArIGRpZmZZLCB0aGlzLmNyb3BwZXIueTIgLSB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IE1hdGgubWF4KHRoaXMubW92ZVN0YXJ0LngyICsgZGlmZlgsIHRoaXMuY3JvcHBlci54MSArIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2JvdHRvbXJpZ2h0JzpcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueDIgPSBNYXRoLm1heCh0aGlzLm1vdmVTdGFydC54MiArIGRpZmZYLCB0aGlzLmNyb3BwZXIueDEgKyB0aGlzLmNyb3BwZXJTY2FsZWRNaW5XaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkyID0gTWF0aC5tYXgodGhpcy5tb3ZlU3RhcnQueTIgKyBkaWZmWSwgdGhpcy5jcm9wcGVyLnkxICsgdGhpcy5jcm9wcGVyU2NhbGVkTWluSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkyID0gTWF0aC5tYXgodGhpcy5tb3ZlU3RhcnQueTIgKyBkaWZmWSwgdGhpcy5jcm9wcGVyLnkxICsgdGhpcy5jcm9wcGVyU2NhbGVkTWluSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2JvdHRvbWxlZnQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MSA9IE1hdGgubWluKHRoaXMubW92ZVN0YXJ0LngxICsgZGlmZlgsIHRoaXMuY3JvcHBlci54MiAtIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgPSBNYXRoLm1heCh0aGlzLm1vdmVTdGFydC55MiArIGRpZmZZLCB0aGlzLmNyb3BwZXIueTEgKyB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZSA9IGV2ZW50LnNjYWxlO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1dpZHRoID0gKE1hdGguYWJzKHRoaXMubW92ZVN0YXJ0LngyIC0gdGhpcy5tb3ZlU3RhcnQueDEpKSAqIHNjYWxlO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IChNYXRoLmFicyh0aGlzLm1vdmVTdGFydC55MiAtIHRoaXMubW92ZVN0YXJ0LnkxKSkgKiBzY2FsZTtcbiAgICAgICAgICAgICAgICBjb25zdCB4MSA9IHRoaXMuY3JvcHBlci54MTtcbiAgICAgICAgICAgICAgICBjb25zdCB5MSA9IHRoaXMuY3JvcHBlci55MTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueDEgPSBNYXRoLm1pbih0aGlzLm1vdmVTdGFydC5jbGllbnRYIC0gKG5ld1dpZHRoIC8gMiksIHRoaXMuY3JvcHBlci54MiAtIHRoaXMuY3JvcHBlclNjYWxlZE1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTEgPSBNYXRoLm1pbih0aGlzLm1vdmVTdGFydC5jbGllbnRZIC0gKG5ld0hlaWdodCAvIDIpLCB0aGlzLmNyb3BwZXIueTIgLSB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IE1hdGgubWF4KHRoaXMubW92ZVN0YXJ0LmNsaWVudFggKyAobmV3V2lkdGggLyAyKSwgeDEgKyB0aGlzLmNyb3BwZXJTY2FsZWRNaW5XaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkyID0gTWF0aC5tYXgodGhpcy5tb3ZlU3RhcnQuY2xpZW50WSArIChuZXdIZWlnaHQgLyAyKSwgeTEgKyB0aGlzLmNyb3BwZXJTY2FsZWRNaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubWFpbnRhaW5Bc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgdGhpcy5jaGVja0FzcGVjdFJhdGlvKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNoZWNrQXNwZWN0UmF0aW8oKTogdm9pZCB7XG4gICAgICAgIGxldCBvdmVyZmxvd1ggPSAwO1xuICAgICAgICBsZXQgb3ZlcmZsb3dZID0gMDtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMubW92ZVN0YXJ0LnBvc2l0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IHRoaXMuY3JvcHBlci54MSArICh0aGlzLmNyb3BwZXIueTIgLSB0aGlzLmNyb3BwZXIueTEpICogdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICBvdmVyZmxvd1ggPSBNYXRoLm1heCh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLm1heFNpemUud2lkdGgsIDApO1xuICAgICAgICAgICAgICAgIG92ZXJmbG93WSA9IE1hdGgubWF4KDAgLSB0aGlzLmNyb3BwZXIueTEsIDApO1xuICAgICAgICAgICAgICAgIGlmIChvdmVyZmxvd1ggPiAwIHx8IG92ZXJmbG93WSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngyIC09IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA6IG92ZXJmbG93WDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxICs9IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IG92ZXJmbG93WSA6IG92ZXJmbG93WCAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueDIgPSB0aGlzLmNyb3BwZXIueDEgKyAodGhpcy5jcm9wcGVyLnkyIC0gdGhpcy5jcm9wcGVyLnkxKSAqIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3dYID0gTWF0aC5tYXgodGhpcy5jcm9wcGVyLngyIC0gdGhpcy5tYXhTaXplLndpZHRoLCAwKTtcbiAgICAgICAgICAgICAgICBvdmVyZmxvd1kgPSBNYXRoLm1heCh0aGlzLmNyb3BwZXIueTIgLSB0aGlzLm1heFNpemUuaGVpZ2h0LCAwKTtcbiAgICAgICAgICAgICAgICBpZiAob3ZlcmZsb3dYID4gMCB8fCBvdmVyZmxvd1kgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiAtPSAob3ZlcmZsb3dZICogdGhpcy5hc3BlY3RSYXRpbykgPiBvdmVyZmxvd1ggPyAob3ZlcmZsb3dZICogdGhpcy5hc3BlY3RSYXRpbykgOiBvdmVyZmxvd1g7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci55MiAtPSAob3ZlcmZsb3dZICogdGhpcy5hc3BlY3RSYXRpbykgPiBvdmVyZmxvd1ggPyBvdmVyZmxvd1kgOiAob3ZlcmZsb3dYIC8gdGhpcy5hc3BlY3RSYXRpbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndG9wbGVmdCc6XG4gICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxID0gdGhpcy5jcm9wcGVyLnkyIC0gKHRoaXMuY3JvcHBlci54MiAtIHRoaXMuY3JvcHBlci54MSkgLyB0aGlzLmFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgIG92ZXJmbG93WCA9IE1hdGgubWF4KDAgLSB0aGlzLmNyb3BwZXIueDEsIDApO1xuICAgICAgICAgICAgICAgIG92ZXJmbG93WSA9IE1hdGgubWF4KDAgLSB0aGlzLmNyb3BwZXIueTEsIDApO1xuICAgICAgICAgICAgICAgIGlmIChvdmVyZmxvd1ggPiAwIHx8IG92ZXJmbG93WSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngxICs9IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA6IG92ZXJmbG93WDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxICs9IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IG92ZXJmbG93WSA6IG92ZXJmbG93WCAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndG9wcmlnaHQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci55MSA9IHRoaXMuY3JvcHBlci55MiAtICh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLmNyb3BwZXIueDEpIC8gdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICBvdmVyZmxvd1ggPSBNYXRoLm1heCh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLm1heFNpemUud2lkdGgsIDApO1xuICAgICAgICAgICAgICAgIG92ZXJmbG93WSA9IE1hdGgubWF4KDAgLSB0aGlzLmNyb3BwZXIueTEsIDApO1xuICAgICAgICAgICAgICAgIGlmIChvdmVyZmxvd1ggPiAwIHx8IG92ZXJmbG93WSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngyIC09IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA6IG92ZXJmbG93WDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxICs9IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IG92ZXJmbG93WSA6IG92ZXJmbG93WCAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgY2FzZSAnYm90dG9tcmlnaHQnOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci55MiA9IHRoaXMuY3JvcHBlci55MSArICh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLmNyb3BwZXIueDEpIC8gdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICBvdmVyZmxvd1ggPSBNYXRoLm1heCh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLm1heFNpemUud2lkdGgsIDApO1xuICAgICAgICAgICAgICAgIG92ZXJmbG93WSA9IE1hdGgubWF4KHRoaXMuY3JvcHBlci55MiAtIHRoaXMubWF4U2l6ZS5oZWlnaHQsIDApO1xuICAgICAgICAgICAgICAgIGlmIChvdmVyZmxvd1ggPiAwIHx8IG92ZXJmbG93WSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLngyIC09IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA6IG92ZXJmbG93WDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkyIC09IChvdmVyZmxvd1kgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WCA/IG92ZXJmbG93WSA6IG92ZXJmbG93WCAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICBjYXNlICdib3R0b21sZWZ0JzpcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgPSB0aGlzLmNyb3BwZXIueTEgKyAodGhpcy5jcm9wcGVyLngyIC0gdGhpcy5jcm9wcGVyLngxKSAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3dYID0gTWF0aC5tYXgoMCAtIHRoaXMuY3JvcHBlci54MSwgMCk7XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3dZID0gTWF0aC5tYXgodGhpcy5jcm9wcGVyLnkyIC0gdGhpcy5tYXhTaXplLmhlaWdodCwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKG92ZXJmbG93WCA+IDAgfHwgb3ZlcmZsb3dZID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueDEgKz0gKG92ZXJmbG93WSAqIHRoaXMuYXNwZWN0UmF0aW8pID4gb3ZlcmZsb3dYID8gKG92ZXJmbG93WSAqIHRoaXMuYXNwZWN0UmF0aW8pIDogb3ZlcmZsb3dYO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgLT0gKG92ZXJmbG93WSAqIHRoaXMuYXNwZWN0UmF0aW8pID4gb3ZlcmZsb3dYID8gb3ZlcmZsb3dZIDogb3ZlcmZsb3dYIC8gdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MiA9IHRoaXMuY3JvcHBlci54MSArICh0aGlzLmNyb3BwZXIueTIgLSB0aGlzLmNyb3BwZXIueTEpICogdGhpcy5hc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgPSB0aGlzLmNyb3BwZXIueTEgKyAodGhpcy5jcm9wcGVyLngyIC0gdGhpcy5jcm9wcGVyLngxKSAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgY29uc3Qgb3ZlcmZsb3dYMSA9IE1hdGgubWF4KDAgLSB0aGlzLmNyb3BwZXIueDEsIDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IG92ZXJmbG93WDIgPSBNYXRoLm1heCh0aGlzLmNyb3BwZXIueDIgLSB0aGlzLm1heFNpemUud2lkdGgsIDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IG92ZXJmbG93WTEgPSBNYXRoLm1heCh0aGlzLmNyb3BwZXIueTIgLSB0aGlzLm1heFNpemUuaGVpZ2h0LCAwKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvdmVyZmxvd1kyID0gTWF0aC5tYXgoMCAtIHRoaXMuY3JvcHBlci55MSwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKG92ZXJmbG93WDEgPiAwIHx8IG92ZXJmbG93WDIgPiAwIHx8IG92ZXJmbG93WTEgPiAwIHx8IG92ZXJmbG93WTIgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3JvcHBlci54MSArPSAob3ZlcmZsb3dZMSAqIHRoaXMuYXNwZWN0UmF0aW8pID4gb3ZlcmZsb3dYMSA/IChvdmVyZmxvd1kxICogdGhpcy5hc3BlY3RSYXRpbykgOiBvdmVyZmxvd1gxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueDIgLT0gKG92ZXJmbG93WTIgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WDIgPyAob3ZlcmZsb3dZMiAqIHRoaXMuYXNwZWN0UmF0aW8pIDogb3ZlcmZsb3dYMjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcm9wcGVyLnkxICs9IChvdmVyZmxvd1kyICogdGhpcy5hc3BlY3RSYXRpbykgPiBvdmVyZmxvd1gyID8gb3ZlcmZsb3dZMiA6IG92ZXJmbG93WDIgLyB0aGlzLmFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyb3BwZXIueTIgLT0gKG92ZXJmbG93WTEgKiB0aGlzLmFzcGVjdFJhdGlvKSA+IG92ZXJmbG93WDEgPyBvdmVyZmxvd1kxIDogb3ZlcmZsb3dYMSAvIHRoaXMuYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkb0F1dG9Dcm9wKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5hdXRvQ3JvcCkge1xuICAgICAgICAgICAgdGhpcy5jcm9wKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjcm9wV2l0aEJsb2IoKTogUHJvbWlzZTxJbWFnZUNyb3BwZWRFdmVudCB8IG51bGw+IHtcblxuICAgICAgICBjb25zdCB7b3V0cHV0LCBjdHh9ID0gdGhpcy5jcm9wKHRydWUpIGFzIEludGVybmFsQ3JvcFJlc3VsdHM7XG5cbiAgICAgICAgaWYgKCFvdXRwdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0cHV0LmJsb2IgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY3R4LmNhbnZhcy50b0Jsb2IoYmxvYiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFibG9iKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGJsb2IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmltYWdlQ3JvcHBlZC5lbWl0KG91dHB1dCk7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG5cbiAgICB9XG5cbiAgICBjcm9wKGludGVybmFsID0gZmFsc2UpOiBJbWFnZUNyb3BwZWRFdmVudCB8IEludGVybmFsQ3JvcFJlc3VsdHMgfCBudWxsIHtcbiAgICAgICAgaWYgKHRoaXMuc291cmNlSW1hZ2UgJiYgdGhpcy5zb3VyY2VJbWFnZS5uYXRpdmVFbGVtZW50ICYmIHRoaXMudHJhbnNmb3JtZWRJbWFnZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0Q3JvcEltYWdlLmVtaXQoKTtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlUG9zaXRpb24gPSB0aGlzLmdldEltYWdlUG9zaXRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gaW1hZ2VQb3NpdGlvbi54MiAtIGltYWdlUG9zaXRpb24ueDE7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBpbWFnZVBvc2l0aW9uLnkyIC0gaW1hZ2VQb3NpdGlvbi55MTtcblxuICAgICAgICAgICAgY29uc3QgY3JvcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xuICAgICAgICAgICAgY3JvcENhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY3JvcENhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IGNyb3BDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgIGlmIChjdHgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5iYWNrZ3JvdW5kQ29sb3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVggPSAodGhpcy50cmFuc2Zvcm0uc2NhbGUgfHwgMSkgKiAodGhpcy50cmFuc2Zvcm0uZmxpcEggPyAtMSA6IDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWSA9ICh0aGlzLnRyYW5zZm9ybS5zY2FsZSB8fCAxKSAqICh0aGlzLnRyYW5zZm9ybS5mbGlwViA/IC0xIDogMSk7XG5cbiAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKHNjYWxlWCwgMCwgMCwgc2NhbGVZLCB0aGlzLnRyYW5zZm9ybWVkU2l6ZS53aWR0aCAvIDIsIHRoaXMudHJhbnNmb3JtZWRTaXplLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLWltYWdlUG9zaXRpb24ueDEgLyBzY2FsZVgsIC1pbWFnZVBvc2l0aW9uLnkxIC8gc2NhbGVZKTtcbiAgICAgICAgICAgICAgICBjdHgucm90YXRlKCh0aGlzLnRyYW5zZm9ybS5yb3RhdGUgfHwgMCkgKiBNYXRoLlBJIC8gMTgwKTtcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMudHJhbnNmb3JtZWRJbWFnZSwgLXRoaXMudHJhbnNmb3JtZWRTaXplLndpZHRoIC8gMiwgLXRoaXMudHJhbnNmb3JtZWRTaXplLmhlaWdodCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0cHV0OiBJbWFnZUNyb3BwZWRFdmVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGgsIGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VQb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgY3JvcHBlclBvc2l0aW9uOiB7Li4udGhpcy5jcm9wcGVyfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbldpdGhpbkFzcGVjdFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5vZmZzZXRJbWFnZVBvc2l0aW9uID0gdGhpcy5nZXRPZmZzZXRJbWFnZVBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc2l6ZVJhdGlvID0gdGhpcy5nZXRSZXNpemVSYXRpbyh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzaXplUmF0aW8gIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LndpZHRoID0gTWF0aC5yb3VuZCh3aWR0aCAqIHJlc2l6ZVJhdGlvKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmhlaWdodCA9IHRoaXMubWFpbnRhaW5Bc3BlY3RSYXRpb1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBNYXRoLnJvdW5kKG91dHB1dC53aWR0aCAvIHRoaXMuYXNwZWN0UmF0aW8pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IE1hdGgucm91bmQoaGVpZ2h0ICogcmVzaXplUmF0aW8pO1xuICAgICAgICAgICAgICAgICAgICByZXNpemVDYW52YXMoY3JvcENhbnZhcywgb3V0cHV0LndpZHRoLCBvdXRwdXQuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LmJhc2U2NCA9IHRoaXMuY3JvcFRvQmFzZTY0KGNyb3BDYW52YXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VDcm9wcGVkLmVtaXQob3V0cHV0KTtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJuYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtvdXRwdXQsIGN0eH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRJbWFnZVBvc2l0aW9uKCk6IENyb3BwZXJQb3NpdGlvbiB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUltYWdlRWxlbWVudCA9IHRoaXMuc291cmNlSW1hZ2UubmF0aXZlRWxlbWVudDtcbiAgICAgICAgY29uc3QgcmF0aW8gPSB0aGlzLnRyYW5zZm9ybWVkU2l6ZS53aWR0aCAvIHNvdXJjZUltYWdlRWxlbWVudC5vZmZzZXRXaWR0aDtcblxuICAgICAgICBjb25zdCBvdXQ6IENyb3BwZXJQb3NpdGlvbiA9IHtcbiAgICAgICAgICAgIHgxOiBNYXRoLnJvdW5kKHRoaXMuY3JvcHBlci54MSAqIHJhdGlvKSxcbiAgICAgICAgICAgIHkxOiBNYXRoLnJvdW5kKHRoaXMuY3JvcHBlci55MSAqIHJhdGlvKSxcbiAgICAgICAgICAgIHgyOiBNYXRoLnJvdW5kKHRoaXMuY3JvcHBlci54MiAqIHJhdGlvKSxcbiAgICAgICAgICAgIHkyOiBNYXRoLnJvdW5kKHRoaXMuY3JvcHBlci55MiAqIHJhdGlvKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdGhpcy5jb250YWluV2l0aGluQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgIG91dC54MSA9IE1hdGgubWF4KG91dC54MSwgMCk7XG4gICAgICAgICAgICBvdXQueTEgPSBNYXRoLm1heChvdXQueTEsIDApO1xuICAgICAgICAgICAgb3V0LngyID0gTWF0aC5taW4ob3V0LngyLCB0aGlzLnRyYW5zZm9ybWVkU2l6ZS53aWR0aCk7XG4gICAgICAgICAgICBvdXQueTIgPSBNYXRoLm1pbihvdXQueTIsIHRoaXMudHJhbnNmb3JtZWRTaXplLmhlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0T2Zmc2V0SW1hZ2VQb3NpdGlvbigpOiBDcm9wcGVyUG9zaXRpb24ge1xuICAgICAgICBjb25zdCBjYW52YXNSb3RhdGlvbiA9IHRoaXMuY2FudmFzUm90YXRpb24gKyB0aGlzLmV4aWZUcmFuc2Zvcm0ucm90YXRlO1xuICAgICAgICBjb25zdCBzb3VyY2VJbWFnZUVsZW1lbnQgPSB0aGlzLnNvdXJjZUltYWdlLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHJhdGlvID0gdGhpcy50cmFuc2Zvcm1lZFNpemUud2lkdGggLyBzb3VyY2VJbWFnZUVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgICAgIGxldCBvZmZzZXRYOiBudW1iZXI7XG4gICAgICAgIGxldCBvZmZzZXRZOiBudW1iZXI7XG5cbiAgICAgICAgaWYgKGNhbnZhc1JvdGF0aW9uICUgMikge1xuICAgICAgICAgICAgb2Zmc2V0WCA9ICh0aGlzLnRyYW5zZm9ybWVkU2l6ZS53aWR0aCAtIHRoaXMub3JpZ2luYWxTaXplLmhlaWdodCkgLyAyO1xuICAgICAgICAgICAgb2Zmc2V0WSA9ICh0aGlzLnRyYW5zZm9ybWVkU2l6ZS5oZWlnaHQgLSB0aGlzLm9yaWdpbmFsU2l6ZS53aWR0aCkgLyAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Zmc2V0WCA9ICh0aGlzLnRyYW5zZm9ybWVkU2l6ZS53aWR0aCAtIHRoaXMub3JpZ2luYWxTaXplLndpZHRoKSAvIDI7XG4gICAgICAgICAgICBvZmZzZXRZID0gKHRoaXMudHJhbnNmb3JtZWRTaXplLmhlaWdodCAtIHRoaXMub3JpZ2luYWxTaXplLmhlaWdodCkgLyAyO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0OiBDcm9wcGVyUG9zaXRpb24gPSB7XG4gICAgICAgICAgICB4MTogTWF0aC5yb3VuZCh0aGlzLmNyb3BwZXIueDEgKiByYXRpbykgLSBvZmZzZXRYLFxuICAgICAgICAgICAgeTE6IE1hdGgucm91bmQodGhpcy5jcm9wcGVyLnkxICogcmF0aW8pIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgIHgyOiBNYXRoLnJvdW5kKHRoaXMuY3JvcHBlci54MiAqIHJhdGlvKSAtIG9mZnNldFgsXG4gICAgICAgICAgICB5MjogTWF0aC5yb3VuZCh0aGlzLmNyb3BwZXIueTIgKiByYXRpbykgLSBvZmZzZXRZXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbnRhaW5XaXRoaW5Bc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgb3V0LngxID0gTWF0aC5tYXgob3V0LngxLCAwKTtcbiAgICAgICAgICAgIG91dC55MSA9IE1hdGgubWF4KG91dC55MSwgMCk7XG4gICAgICAgICAgICBvdXQueDIgPSBNYXRoLm1pbihvdXQueDIsIHRoaXMudHJhbnNmb3JtZWRTaXplLndpZHRoKTtcbiAgICAgICAgICAgIG91dC55MiA9IE1hdGgubWluKG91dC55MiwgdGhpcy50cmFuc2Zvcm1lZFNpemUuaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcm9wVG9CYXNlNjQoY3JvcENhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gY3JvcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlLycgKyB0aGlzLmZvcm1hdCwgdGhpcy5nZXRRdWFsaXR5KCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UXVhbGl0eSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oMSwgTWF0aC5tYXgoMCwgdGhpcy5pbWFnZVF1YWxpdHkgLyAxMDApKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJlc2l6ZVJhdGlvKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMucmVzaXplVG9XaWR0aCA+IDApIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5vbmx5U2NhbGVEb3duIHx8IHdpZHRoID4gdGhpcy5yZXNpemVUb1dpZHRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzaXplVG9XaWR0aCAvIHdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplVG9IZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMub25seVNjYWxlRG93biB8fCBoZWlnaHQgPiB0aGlzLnJlc2l6ZVRvSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzaXplVG9IZWlnaHQgLyBoZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDbGllbnRYKGV2ZW50OiBhbnkpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlc1swXSA/IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCA6IGV2ZW50LmNsaWVudFgpIHx8IDA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDbGllbnRZKGV2ZW50OiBhbnkpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlc1swXSA/IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSA6IGV2ZW50LmNsaWVudFkpIHx8IDA7XG4gICAgfVxufVxuIl19