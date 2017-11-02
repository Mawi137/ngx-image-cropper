import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

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

interface Dimentions {
    width: number;
    height: number;
}

@Component({
    selector: 'image-cropper',
    templateUrl: './image-cropper.component.html',
    styleUrls: ['./image-cropper.component.scss']
})
export class ImageCropperComponent {
    private originalImage: any;
    private croppedImage: string;
    private moveStart: MoveStart = {
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
    private maxSize: Dimentions = {
        width: 0,
        height: 0
    };
    private originalSize: Dimentions = {
        width: 0,
        height: 0
    };

    cropper = {
        x1: -100,
        y1: -100,
        x2: 1000,
        y2: 1000
    };

    imgDataUrl = 'data:image/png;base64,iVBORw0KGg' + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU' + 'AAarVyFEAAAAASUVORK5CYII=';
    imageVisible = false;

    constructor(private elementRef: ElementRef) {}

    @Input()
    set imageChangedEvent(event: any) {
        if (event && event.target && event.target.files) {
            this.loadImage(event);
        }
    }
    @Input()
    set imageBase64(imageBase64: string) {
        this.loadBase64Image(imageBase64);
    }
    @Input() format = 'png';
    @Input() maintainAspectRatio = true;
    @Input() aspectRatio = 1;
    @Input() resizeToWidth = 0;

    @Output() imageCropped = new EventEmitter<string>();
    @Output() imageLoaded = new EventEmitter<void>();
    @Output() loadImageFailed = new EventEmitter<void>();

    loadImage(event: any) {
        this.imageVisible = false;
        const fileReader = new FileReader();
        fileReader.onload = (ev: any) => {
            if (event.target.files[0].type === 'image/jpeg' ||
                event.target.files[0].type === 'image/jpg' ||
                event.target.files[0].type === 'image/png' ||
                event.target.files[0].type === 'image/gif') {
                this.loadBase64Image(ev.target.result);
            } else {
                const blank = 'data:image/png;base64,iVBORw0KGg' + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU' + 'AAarVyFEAAAAASUVORK5CYII=';
                this.imgDataUrl = blank;
                this.originalImage = new Image();
                this.originalImage.src = blank;
                this.loadImageFailed.emit();
            }
        };
        fileReader.readAsDataURL(event.target.files[0]);
    }

    private loadBase64Image(imageBase64: string) {
        this.imageVisible = false;
        this.originalImage = new Image();
        this.originalImage.onload = () => {
            this.originalSize.width = this.originalImage.width;
            this.originalSize.height = this.originalImage.height;
            this.imageLoaded.emit();
        };
        this.imgDataUrl = imageBase64;
        this.originalImage.src = imageBase64;
        setTimeout(() => {
            this.resetCropperPosition();
        }, 1);
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
        this.crop();
        this.imageVisible = true;
    }

    startMove(event: any, moveType: string, position: string | null = null) {
        this.moveStart.active = true;
        this.moveStart.type = moveType;
        this.moveStart.position = position;
        this.moveStart.clientX = event.clientX;
        this.moveStart.clientY = event.clientY;
        Object.assign(this.moveStart, this.cropper);
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    moveImg(event: any) {
        if (this.moveStart.active) {
            event.stopPropagation();
            event.preventDefault();
            const el = this.elementRef.nativeElement.querySelector('.source-image');
            this.maxSize.width = el.offsetWidth;
            this.maxSize.height = el.offsetHeight;
            if (this.moveStart.type === 'move') {
                this.move(event);
                this.checkCoordinates(true);
            } else if (this.moveStart.type === 'resize') {
                this.resize(event);
                this.checkCoordinates(false);
            }
        }
    }

    private checkCoordinates(maintainSize = false) {
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
    moveStop() {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.crop();
        }
    }

    private move(event: any) {
        const diffX = (event.clientX - this.moveStart.clientX);
        const diffY = (event.clientY - this.moveStart.clientY);

        this.cropper.x1 = this.moveStart.x1 + diffX;
        this.cropper.y1 = this.moveStart.y1 + diffY;
        this.cropper.x2 = this.moveStart.x2 + diffX;
        this.cropper.y2 = this.moveStart.y2 + diffY;
    }

    private resize(event: any) {
        const diffX = (event.clientX - this.moveStart.clientX);
        const diffY = (event.clientY - this.moveStart.clientY);
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

    private crop() {
        const displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage) {
            const ratio = this.originalSize.width / displayedImage.offsetWidth;
            const left = Math.round(this.cropper.x1 * ratio);
            const top = Math.round(this.cropper.y1 * ratio);
            const width = Math.round((this.cropper.x2 - this.cropper.x1) * ratio);
            const height = Math.round((this.cropper.y2 - this.cropper.y1) * ratio);
            const resizeRatio = this.resizeToWidth > 0 ? this.resizeToWidth / width : 1;
            const cropCanvas = <HTMLCanvasElement>document.createElement('canvas');
            cropCanvas.width = width * resizeRatio;
            cropCanvas.height = height * resizeRatio;
            const ctx = cropCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(this.originalImage, left, top, width, height, 0, 0, width * resizeRatio, height * resizeRatio);
                this.croppedImage = cropCanvas.toDataURL('image/' + this.format);
                if (this.croppedImage.length > 10) {
                    this.imageCropped.emit(this.croppedImage);
                }
            }
        }
    }
}
