import {
    Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges,
    ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { DomSanitizer, SafeUrl, SafeStyle } from '@angular/platform-browser';
import { ImageUtils } from './image.utils';

interface MoveStart {
    active: boolean;
    type: string | null;
    position: string | null;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    clientX: number;
    clientY: number;
}

interface Dimensions {
    width: number;
    height: number;
}

export interface CropperPosition {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ImageCroppedEvent {
    base64?: string | null;
    file?: Blob | null;
    width: number;
    height: number;
    cropperPosition: CropperPosition;
}

@Component({
    selector: 'image-cropper',
    templateUrl: './image-cropper.component.html',
    styleUrls: ['./image-cropper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCropperComponent implements OnChanges {
    private originalImage: any;
    private moveStart: MoveStart;
    private maxSize: Dimensions;
    private originalSize: Dimensions;

    safeImgDataUrl: SafeUrl | string;
    marginLeft: SafeStyle | string = '0px';
    imageVisible = false;

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
    @Input() outputType: 'base64' | 'file' | 'both' = 'both';
    @Input() maintainAspectRatio = true;
    @Input() aspectRatio = 1;
    @Input() resizeToWidth = 0;
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

    @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
    @Output() imageCroppedBase64 = new EventEmitter<string>();
    @Output() imageCroppedFile = new EventEmitter<Blob>();
    @Output() imageLoaded = new EventEmitter<void>();
    @Output() loadImageFailed = new EventEmitter<void>();

    constructor(private elementRef: ElementRef, private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {
        this.initCropper();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['cropper']) {
            setTimeout(() => {
                this.setMaxSize();
                this.checkCropperPosition(false);
                this.doAutoCrop();
                this.cd.markForCheck();
            });
        }
        if (changes['aspectRatio']) {
            this.resetCropperPosition();
        }
    }

    private initCropper() {
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

    private loadImageFile(file: File) {
        const fileReader = new FileReader();
        fileReader.onload = (event: any) => {
            const imageType = file.type;
            if (this.isValidImageType(imageType)) {
                try {
                    this.checkExifRotationAndLoadImage(event.target.result);
                } catch (e) {
                    this.loadImageFailed.emit();
                }
            } else {
                this.loadImageFailed.emit();
            }
        };
        fileReader.readAsDataURL(file);
    }

    private isValidImageType(type: string) {
        return type === 'image/jpeg'
            || type === 'image/jpg'
            || type === 'image/png'
            || type === 'image/gif'
    }

    private checkExifRotationAndLoadImage(imageBase64: string) {
        const exifRotation = ImageUtils.getOrientation(imageBase64);
        if (exifRotation > 1) {
            ImageUtils.resetOrientation(
                imageBase64,
                exifRotation,
                (rotatedBase64: string) => this.loadBase64Image(rotatedBase64)
            );
        } else {
            this.loadBase64Image(imageBase64);
        }
    }

    private loadBase64Image(imageBase64: string) {
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
            setTimeout(() => {
                this.setMaxSize();
                this.resetCropperPosition();
                this.cd.markForCheck();
            });
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.resizeCropperPosition();
        this.setMaxSize();
    }

    private resizeCropperPosition() {
        const displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (this.maxSize.width !== displayedImage.offsetWidth || this.maxSize.height !== displayedImage.offsetHeight) {
            this.cropper.x1 = this.cropper.x1 * displayedImage.offsetWidth / this.maxSize.width;
            this.cropper.x2 = this.cropper.x2 * displayedImage.offsetWidth / this.maxSize.width;
            this.cropper.y1 = this.cropper.y1 * displayedImage.offsetHeight / this.maxSize.height;
            this.cropper.y2 = this.cropper.y2 * displayedImage.offsetHeight / this.maxSize.height;
        }
    }

    private resetCropperPosition() {
        const displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage.offsetWidth / this.aspectRatio < displayedImage.offsetHeight) {
            this.cropper.x1 = 0;
            this.cropper.x2 = displayedImage.offsetWidth;
            const cropperHeight = displayedImage.offsetWidth / this.aspectRatio;
            this.cropper.y1 = (displayedImage.offsetHeight - cropperHeight) / 2;
            this.cropper.y2 = this.cropper.y1 + cropperHeight;
        } else {
            this.cropper.y1 = 0;
            this.cropper.y2 = displayedImage.offsetHeight;
            const cropperWidth = displayedImage.offsetHeight * this.aspectRatio;
            this.cropper.x1 = (displayedImage.offsetWidth - cropperWidth) / 2;
            this.cropper.x2 = this.cropper.x1 + cropperWidth;
        }
        this.doAutoCrop();
        this.imageVisible = true;
    }

    startMove(event: any, moveType: string, position: string | null = null) {
        this.moveStart = Object.assign({
            active: true,
            type: moveType,
            position: position,
            clientX: this.getClientX(event),
            clientY: this.getClientY(event)
        }, this.cropper);
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    moveImg(event: any) {
        if (this.moveStart.active) {
            event.stopPropagation();
            event.preventDefault();
            this.setMaxSize();
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

    private setMaxSize() {
        const el = this.elementRef.nativeElement.querySelector('.source-image');
        this.maxSize.width = el.offsetWidth;
        this.maxSize.height = el.offsetHeight;
        this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    }

    private checkCropperPosition(maintainSize = false) {
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

    @HostListener('document:mouseup', ['$event'])
    @HostListener('document:touchend', ['$event'])
    moveStop(event: any) {
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

    private resize(event: any) {
        const diffX = this.getClientX(event) - this.moveStart.clientX;
        const diffY = this.getClientY(event) - this.moveStart.clientY;
        switch (this.moveStart.position) {
            case 'left':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - 20);
                break;
            case 'topleft':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - 20);
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - 20);
                break;
            case 'top':
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - 20);
                break;
            case 'topright':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + 20);
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - 20);
                break;
            case 'right':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + 20);
                break;
            case 'bottomright':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + 20);
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + 20);
                break;
            case 'bottom':
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + 20);
                break;
            case 'bottomleft':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - 20);
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + 20);
                break;
        }

        if (this.maintainAspectRatio) {
            this.checkAspectRatio();
        }
    }

    private checkAspectRatio() {
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

    private doAutoCrop() {
        if (this.autoCrop) {
            this.crop();
        }
    }

    crop() {
        const displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage && this.originalImage != null) {
            const ratio = this.originalSize.width / displayedImage.offsetWidth;
            const left = Math.round(this.cropper.x1 * ratio);
            const top = Math.round(this.cropper.y1 * ratio);
            const width = Math.round((this.cropper.x2 - this.cropper.x1) * ratio);
            const height = Math.round((this.cropper.y2 - this.cropper.y1) * ratio);
            const resizeRatio = this.getResizeRatio(width);
            const resizedWidth = Math.floor(width * resizeRatio);
            const resizedHeight = Math.floor(height * resizeRatio);

            const cropCanvas = document.createElement('canvas') as HTMLCanvasElement;
            cropCanvas.width = resizedWidth;
            cropCanvas.height = resizedHeight;

            const ctx = cropCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(this.originalImage, left, top, width, height, 0, 0, width * resizeRatio, height * resizeRatio);
                this.cropToOutputType(cropCanvas, resizedWidth, resizedHeight);
            }
        }
    }

    private cropToOutputType(cropCanvas: HTMLCanvasElement, resizedWidth: number, resizedHeight: number) {
        const output: ImageCroppedEvent = {
            width: resizedWidth,
            height: resizedHeight,
            cropperPosition: Object.assign({}, this.cropper)
        };
        switch (this.outputType) {
            case 'base64':
                output.base64 = this.cropToBase64(cropCanvas);
                this.imageCropped.emit(output);
                break;
            case 'file':
                this.cropToFile(cropCanvas)
                    .then((result: Blob | null) => {
                        output.file = result;
                        this.imageCropped.emit(output);
                    });
                break;
            case 'both':
                output.base64 = this.cropToBase64(cropCanvas);
                this.cropToFile(cropCanvas)
                    .then((result: Blob | null) => {
                        output.file = result;
                        this.imageCropped.emit(output);
                    });
                break;
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
                (result: Blob | null) => resolve(result),
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

    private getClientX(event: any) {
        return event.clientX != null ? event.clientX : event.touches[0].clientX;
    }

    private getClientY(event: any) {
        return event.clientY != null ? event.clientY : event.touches[0].clientY;
    }
}
