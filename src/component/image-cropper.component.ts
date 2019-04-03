import {
    Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, Output,
    SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy, NgZone, ViewChild
} from '@angular/core';
import { DomSanitizer, SafeUrl, SafeStyle } from '@angular/platform-browser';
import { MoveStart, Dimensions, CropperPosition, ImageCroppedEvent } from '../interfaces';
import { resetExifOrientation, transformBase64BasedOnExifRotation } from '../utils/exif.utils';
import { resizeCanvas } from '../utils/resize.utils';

export type OutputType = 'base64' | 'file' | 'both';

@Component({
    selector: 'image-cropper',
    templateUrl: './image-cropper.component.html',
    styleUrls: ['./image-cropper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCropperComponent implements OnChanges {
    private originalImage: any;
    private originalBase64: string;
    private moveStart: MoveStart;
    private maxSize: Dimensions;
    private originalSize: Dimensions;
    private setImageMaxSizeRetries = 0;
    private cropperScaledMinWidth = 20;
    private cropperScaledMinHeight = 20;

    safeImgDataUrl: SafeUrl | string;
    marginLeft: SafeStyle | string = '0px';
    imageVisible = false;

    @ViewChild('sourceImage') sourceImage: ElementRef;

    @Input()
    set imageFileChanged(file: File) {
        this.initCropper();
        if (file) {
            this.loadImageFile(file);
        }
    }

    @Input()
    set imageChangedEvent(event: any) {
        this.initCropper();
        if (event && event.target && event.target.files && event.target.files.length > 0) {
            this.loadImageFile(event.target.files[0]);
        }
    }

    @Input()
    set imageBase64(imageBase64: string) {
        this.initCropper();
        this.loadBase64Image(imageBase64);
    }

    @Input() format: 'png' | 'jpeg' | 'bmp' | 'webp' | 'ico' = 'png';
    @Input() outputType: OutputType = 'both';
    @Input() maintainAspectRatio = true;
    @Input() aspectRatio = 1;
    @Input() resizeToWidth = 0;
    @Input() cropperMinWidth = 0;
    @Input() cropperMinHeight = 0;
    @Input() roundCropper = false;
    @Input() onlyScaleDown = false;
    @Input() imageQuality = 92;
    @Input() autoCrop = true;
    @Input() cropper: CropperPosition = {
        x1: -100,
        y1: -100,
        x2: 10000,
        y2: 10000
    };
    @HostBinding('style.text-align')
    @Input() alignImage: 'left' | 'center' = 'center';


    @Output() startCropImage = new EventEmitter<void>();
    @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
    @Output() imageCroppedBase64 = new EventEmitter<string>();
    @Output() imageCroppedFile = new EventEmitter<Blob>();
    @Output() imageLoaded = new EventEmitter<void>();
    @Output() cropperReady = new EventEmitter<void>();
    @Output() loadImageFailed = new EventEmitter<void>();

    constructor(private sanitizer: DomSanitizer,
                private cd: ChangeDetectorRef,
                private zone: NgZone) {
        this.initCropper();
    }

    ngOnChanges(changes: SimpleChanges): void {
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
    }

    private initCropper(): void {
        this.imageVisible = false;
        this.originalImage = null;
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
        this.cropper.x1 = -100;
        this.cropper.y1 = -100;
        this.cropper.x2 = 10000;
        this.cropper.y2 = 10000;
    }

    private loadImageFile(file: File): void {
        const fileReader = new FileReader();
        fileReader.onload = (event: any) => {
            const imageType = file.type;
            if (this.isValidImageType(imageType)) {
                resetExifOrientation(event.target.result)
                    .then((resultBase64: string) => this.loadBase64Image(resultBase64))
                    .catch(() => this.loadImageFailed.emit());
            } else {
                this.loadImageFailed.emit();
            }
        };
        fileReader.readAsDataURL(file);
    }

    private isValidImageType(type: string): boolean {
        return /image\/(png|jpg|jpeg|bmp|gif|tiff)/.test(type);
    }

    private loadBase64Image(imageBase64: string): void {
        this.originalBase64 = imageBase64;
        this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(imageBase64);
        this.originalImage = new Image();
        this.originalImage.onload = () => {
            this.originalSize.width = this.originalImage.width;
            this.originalSize.height = this.originalImage.height;
            this.cd.markForCheck();
        };
        this.originalImage.src = imageBase64;
    }

    imageLoadedInView(): void {
        if (this.originalImage != null) {
            this.imageLoaded.emit();
            this.setImageMaxSizeRetries = 0;
            setTimeout(() => this.checkImageMaxSizeRecursively());
        }
    }

    private checkImageMaxSizeRecursively(): void {
        if (this.setImageMaxSizeRetries > 40) {
            this.loadImageFailed.emit();
        } else if (this.sourceImage && this.sourceImage.nativeElement && this.sourceImage.nativeElement.offsetWidth > 0) {
            this.setMaxSize();
            this.setCropperScaledMinSize();
            this.resetCropperPosition();
            this.cropperReady.emit();
            this.cd.markForCheck();
        } else {
            this.setImageMaxSizeRetries++;
            setTimeout(() => {
                this.checkImageMaxSizeRecursively();
            }, 50);
        }
    }

    @HostListener('window:resize')
    onResize(): void {
        this.resizeCropperPosition();
        this.setMaxSize();
        this.setCropperScaledMinSize();
    }

    rotateLeft() {
        this.transformBase64(8);
    }

    rotateRight() {
        this.transformBase64(6);
    }

    flipHorizontal() {
        this.transformBase64(2);
    }

    flipVertical() {
        this.transformBase64(4);
    }

    private transformBase64(exifOrientation: number): void {
        if (this.originalBase64) {
            transformBase64BasedOnExifRotation(this.originalBase64, exifOrientation)
                .then((rotatedBase64: string) => this.loadBase64Image(rotatedBase64));
        }
    }

    private resizeCropperPosition(): void {
        const sourceImageElement = this.sourceImage.nativeElement;
        if (this.maxSize.width !== sourceImageElement.offsetWidth || this.maxSize.height !== sourceImageElement.offsetHeight) {
            this.cropper.x1 = this.cropper.x1 * sourceImageElement.offsetWidth / this.maxSize.width;
            this.cropper.x2 = this.cropper.x2 * sourceImageElement.offsetWidth / this.maxSize.width;
            this.cropper.y1 = this.cropper.y1 * sourceImageElement.offsetHeight / this.maxSize.height;
            this.cropper.y2 = this.cropper.y2 * sourceImageElement.offsetHeight / this.maxSize.height;
        }
    }

    private resetCropperPosition(): void {
        const sourceImageElement = this.sourceImage.nativeElement;
        if (!this.maintainAspectRatio) {
            this.cropper.x1 = 0;
            this.cropper.x2 = sourceImageElement.offsetWidth;
            this.cropper.y1 = 0;
            this.cropper.y2 = sourceImageElement.offsetHeight;
        } else if (sourceImageElement.offsetWidth / this.aspectRatio < sourceImageElement.offsetHeight) {
            this.cropper.x1 = 0;
            this.cropper.x2 = sourceImageElement.offsetWidth;
            const cropperHeight = sourceImageElement.offsetWidth / this.aspectRatio;
            this.cropper.y1 = (sourceImageElement.offsetHeight - cropperHeight) / 2;
            this.cropper.y2 = this.cropper.y1 + cropperHeight;
        } else {
            this.cropper.y1 = 0;
            this.cropper.y2 = sourceImageElement.offsetHeight;
            const cropperWidth = sourceImageElement.offsetHeight * this.aspectRatio;
            this.cropper.x1 = (sourceImageElement.offsetWidth - cropperWidth) / 2;
            this.cropper.x2 = this.cropper.x1 + cropperWidth;
        }
        this.doAutoCrop();
        this.imageVisible = true;
    }

    startMove(event: any, moveType: string, position: string | null = null): void {
        event.preventDefault();
        this.moveStart = {
            active: true,
            type: moveType,
            position: position,
            clientX: this.getClientX(event),
            clientY: this.getClientY(event),
            ...this.cropper
        };
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    moveImg(event: any): void {
        if (this.moveStart.active) {
            event.stopPropagation();
            event.preventDefault();
            if (this.moveStart.type === 'move') {
                this.move(event);
                this.checkCropperPosition(true);
            } else if (this.moveStart.type === 'resize') {
                this.resize(event);
                this.checkCropperPosition(false);
            }
            this.cd.detectChanges();
        }
    }

    private setMaxSize(): void {
        const sourceImageElement = this.sourceImage.nativeElement;
        this.maxSize.width = sourceImageElement.offsetWidth;
        this.maxSize.height = sourceImageElement.offsetHeight;
        this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    }

    private setCropperScaledMinSize(): void {
        if (this.originalImage) {
            this.setCropperScaledMinWidth();
            this.setCropperScaledMinHeight();
        } else {
            this.cropperScaledMinWidth = 20;
            this.cropperScaledMinHeight = 20;
        }
    }

    private setCropperScaledMinWidth(): void {
        this.cropperScaledMinWidth = this.cropperMinWidth > 0
            ? Math.max(20, this.cropperMinWidth / this.originalImage.width * this.maxSize.width)
            : 20;
    }

    private setCropperScaledMinHeight(): void {
        if (this.maintainAspectRatio) {
            this.cropperScaledMinHeight = Math.max(20, this.cropperScaledMinWidth / this.aspectRatio)
        } else if (this.cropperMinHeight > 0) {
            this.cropperScaledMinHeight = Math.max(20, this.cropperMinHeight / this.originalImage.height * this.maxSize.height);
        } else {
            this.cropperScaledMinHeight = 20;
        }
    }

    private checkCropperPosition(maintainSize = false): void {
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

    @HostListener('document:mouseup')
    @HostListener('document:touchend')
    moveStop(): void {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.doAutoCrop();
        }
    }

    private move(event: any) {
        const diffX = this.getClientX(event) - this.moveStart.clientX;
        const diffY = this.getClientY(event) - this.moveStart.clientY;

        this.cropper.x1 = this.moveStart.x1 + diffX;
        this.cropper.y1 = this.moveStart.y1 + diffY;
        this.cropper.x2 = this.moveStart.x2 + diffX;
        this.cropper.y2 = this.moveStart.y2 + diffY;
    }

    private resize(event: any): void {
        const diffX = this.getClientX(event) - this.moveStart.clientX;
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
        }

        if (this.maintainAspectRatio) {
            this.checkAspectRatio();
        }
    }

    private checkAspectRatio(): void {
        let overflowX = 0;
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
        }
    }

    private doAutoCrop(): void {
        if (this.autoCrop) {
            this.crop();
        }
    }

    crop(outputType: OutputType = this.outputType): ImageCroppedEvent | Promise<ImageCroppedEvent> | null {
        if (this.sourceImage.nativeElement && this.originalImage != null) {
            this.startCropImage.emit();
            const imagePosition = this.getImagePosition();
            const width = imagePosition.x2 - imagePosition.x1;
            const height = imagePosition.y2 - imagePosition.y1;

            const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
            cropCanvas.width = width;
            cropCanvas.height = height;

            const ctx = cropCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(
                    this.originalImage,
                    imagePosition.x1,
                    imagePosition.y1,
                    width,
                    height,
                    0,
                    0,
                    width,
                    height
                );
                const output = {width, height, imagePosition, cropperPosition: {...this.cropper}};
                const resizeRatio = this.getResizeRatio(width);
                if (resizeRatio !== 1) {
                    output.width = Math.floor(width * resizeRatio);
                    output.height = Math.floor(height * resizeRatio);
                    resizeCanvas(cropCanvas, output.width, output.height);
                }
                return this.cropToOutputType(outputType, cropCanvas, output);
            }
        }
        return null;
    }

    private getImagePosition(): CropperPosition {
        const sourceImageElement = this.sourceImage.nativeElement;
        const ratio = this.originalSize.width / sourceImageElement.offsetWidth;
        return {
            x1: Math.round(this.cropper.x1 * ratio),
            y1: Math.round(this.cropper.y1 * ratio),
            x2: Math.min(Math.round(this.cropper.x2 * ratio), this.originalSize.width),
            y2: Math.min(Math.round(this.cropper.y2  * ratio), this.originalSize.height)
        }
    }

    private cropToOutputType(outputType: OutputType, cropCanvas: HTMLCanvasElement, output: ImageCroppedEvent): ImageCroppedEvent | Promise<ImageCroppedEvent> {
        switch (outputType) {
            case 'file':
                return this.cropToFile(cropCanvas)
                    .then((result: Blob | null) => {
                        output.file = result;
                        this.imageCropped.emit(output);
                        return output;
                    });
            case 'both':
                output.base64 = this.cropToBase64(cropCanvas);
                return this.cropToFile(cropCanvas)
                    .then((result: Blob | null) => {
                        output.file = result;
                        this.imageCropped.emit(output);
                        return output;
                    });
            default:
                output.base64 = this.cropToBase64(cropCanvas);
                this.imageCropped.emit(output);
                return output;
        }
    }

    private cropToBase64(cropCanvas: HTMLCanvasElement): string {
        const imageBase64 = cropCanvas.toDataURL('image/' + this.format, this.getQuality());
        this.imageCroppedBase64.emit(imageBase64);
        return imageBase64;
    }

    private cropToFile(cropCanvas: HTMLCanvasElement): Promise<Blob | null> {
        return this.getCanvasBlob(cropCanvas)
            .then((result: Blob | null) => {
                if (result) {
                    this.imageCroppedFile.emit(result);
                }
                return result;
            });
    }

    private getCanvasBlob(cropCanvas: HTMLCanvasElement): Promise<Blob | null> {
        return new Promise((resolve) => {
            cropCanvas.toBlob(
                (result: Blob | null) => this.zone.run(() => resolve(result)),
                'image/' + this.format,
                this.getQuality()
            );
        });
    }

    private getQuality(): number {
        return Math.min(1, Math.max(0, this.imageQuality / 100));
    }

    private getResizeRatio(width: number): number {
        return this.resizeToWidth > 0 && (!this.onlyScaleDown || width > this.resizeToWidth)
            ? this.resizeToWidth / width
            : 1;
    }

    private getClientX(event: any): number {
        return event.clientX || event.touches && event.touches[0] && event.touches[0].clientX;
    }

    private getClientY(event: any): number {
        return event.clientY || event.touches && event.touches[0] && event.touches[0].clientY;
    }
}
