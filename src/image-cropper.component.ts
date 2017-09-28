import { Component, ElementRef, Input, HostListener, EventEmitter, Output } from '@angular/core';

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

interface CropperPosition {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

@Component({
    selector: 'image-cropper',
    template: `
        <div>
            <img
                *ngIf="imgDataUrl"
                [src]="imgDataUrl"
                [style.visibility]="imageVisible ? 'visible' : 'hidden'"
                class="source-image"
                style="width: 100%"
            />
            <div class="cropper"
                [style.top.px]="cropper.y1"
                [style.left.px]="cropper.x1"
                [style.width.px]="cropper.x2 - cropper.x1"
                [style.height.px]="cropper.y2 - cropper.y1"
                [ngStyle]="styleCrop"
            >
                <div
                    (mousedown)="startMove($event, 'move')"
                    class="move"
                >&nbsp;</div>
                <span
                    class="resize topleft"
                    (mousedown)="startMove($event, 'resize', 'topleft')"
                ></span>
                <span
                    class="resize top"
                ></span>
                <span
                    class="resize topright"
                    (mousedown)="startMove($event, 'resize', 'topright')"
                ></span>
                <span
                    class="resize right"
                ></span>
                <span
                    class="resize bottomright"
                    (mousedown)="startMove($event, 'resize', 'bottomright')"
                ></span>
                <span
                    class="resize bottom"
                ></span>
                <span
                    class="resize bottomleft"
                    (mousedown)="startMove($event, 'resize', 'bottomleft')"
                ></span>
                <span
                    class="resize left"
                ></span>
                <span
                    class="resize-bar top"
                    (mousedown)="startMove($event, 'resize', 'top')"
                ></span>
                <span
                    class="resize-bar right"
                    (mousedown)="startMove($event, 'resize', 'right')"
                ></span>
                <span
                    class="resize-bar bottom"
                    (mousedown)="startMove($event, 'resize', 'bottom')"
                ></span>
                <span
                    class="resize-bar left"
                    (mousedown)="startMove($event, 'resize', 'left')"
                ></span>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            position: relative;
            width: 100%;
            overflow: hidden;
            padding: 5px;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;

            > div {
                position: relative;
            }

            .cropper {
                position: absolute;
                display: flex;
                color: #53535C !important;
                background: transparent !important;
                outline-color: rgba(255,255,255,0.3);
                outline-width: 1000px;
                outline-style: solid;

                img {
                    width: inherit;
                    height: inherit;
                    cursor: move;
                }
                &:after {
                    position: absolute;
                    content: '';
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    pointer-events: none;
                    border: dashed 1px;
                    opacity: .75;
                    color: inherit;
                    z-index: 1;
                }

                .move {
                    width: 100%;
                    height: 100%;
                    cursor: move;
                    border: 1px solid rgba(255,255,255,0.5);
                }

                .resize {
                    position: absolute;
                    background: #53535C;

                    &.topleft {
                        top: -5px;
                        left: -5px;
                        cursor: nw-resize;
                    }
                    &.top {
                        top: -5px;
                        left: calc(50% - 5px);
                        cursor: n-resize;
                    }
                    &.topright {
                        top: -5px;
                        right: 5px;
                        cursor: ne-resize;
                    }
                    &.right {
                        top: calc(50% - 5px);
                        right: 5px;
                        cursor: e-resize;
                    }
                    &.bottomright {
                        bottom: 5px;
                        right: 5px;
                        cursor: se-resize;
                    }
                    &.bottom {
                        bottom: 5px;
                        left: calc(50% - 5px);
                        cursor: s-resize;
                    }
                    &.bottomleft {
                        bottom: 5px;
                        left: -5px;
                        cursor: sw-resize;
                    }
                    &.left {
                        top: calc(50% - 5px);
                        left: -5px;
                        cursor: w-resize;
                    }
                    &:after {
                        position: absolute;
                        background: inherit;
                        border: 1px solid rgba(255, 255, 255, 0.5);
                        content: '';
                        width: 8px;
                        height: 8px;
                        margin: auto;
                        opacity: .85;
                        z-index: 1;
                    }
                }
                .resize-bar {
                    position: absolute;
                    z-index: 1;

                    &.top {
                        top: -5px;
                        left: 5px;
                        width: calc(100% - 10px);
                        height: 10px;
                        cursor: n-resize;
                    }
                    &.right {
                        top: 5px;
                        right: -5px;
                        height: calc(100% - 10px);
                        width: 10px;
                        cursor: e-resize;
                    }
                    &.bottom {
                        bottom: -5px;
                        left: 5px;
                        width: calc(100% - 10px);
                        height: 10px;
                        cursor: s-resize;
                    }
                    &.left {
                        top: 5px;
                        left: -5px;
                        height: calc(100% - 10px);
                        width: 10px;
                        cursor: w-resize;
                    }
                }
            }
        }
    `]
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
        x1: 0,
        y1: 0,
        x2: 128,
        y2: 128
    };

    imgDataUrl: string;
    imageVisible = false;

    constructor(private elementRef: ElementRef) {}

    @Input()
    set imageChangedEvent(event: any) {
        if (event && event.target && event.target.files) {
            this.loadImage(event);
        }
    }
    @Input() styleCrop = {
        color: '#53535C',
        background: '#53535C',
    };
    @Input() format = 'png';
    @Input() maintainAspectRatio = true;
    @Input() resizeToWidth = 128;

    @Output() imageCropped = new EventEmitter<string>();

    private loadImage(event: any) {
        this.imageVisible = false;
        this.originalImage = new Image();
        this.originalImage.onload = () => {
            this.originalSize.width = this.originalImage.width;
            this.originalSize.height = this.originalImage.height;
        };
        const fileReader = new FileReader();
        const blank = 'data:image/png;base64,iVBORw0KGg' + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU' + 'AAarVyFEAAAAASUVORK5CYII=';
        fileReader.onload = (ev: any) => {
            if (event.target.files[0].type === 'image/jpeg' ||
                event.target.files[0].type === 'image/jpg' ||
                event.target.files[0].type === 'image/png' ||
                event.target.files[0].type === 'image/gif') {
                this.imgDataUrl = ev.target.result;
                this.originalImage.src = ev.target.result;

                setTimeout(() => {
                    const displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
                    const maxSize = displayedImage.offsetHeight > displayedImage.offsetWidth ? displayedImage.offsetWidth : displayedImage.offsetHeight;
                    this.cropper.x1 = Math.floor(displayedImage.offsetWidth / 2 - maxSize / 2);
                    this.cropper.y1 = Math.floor(displayedImage.offsetHeight / 2 - maxSize / 2);
                    this.cropper.x2 = this.cropper.x1 + maxSize;
                    this.cropper.y2 = this.cropper.y1 + maxSize;

                    this.crop();
                    this.imageVisible = true;
                }, 0);
            } else {
                this.imgDataUrl = blank;
                this.originalImage = blank;
                this.originalImage.src = blank;
            }
        };
        fileReader.readAsDataURL(event.target.files[0]);
    }

    startMove(event: any, moveType: string, position = null) {
        this.moveStart.active = true;
        this.moveStart.type = moveType;
        this.moveStart.position = position;
        this.moveStart.clientX = event.clientX;
        this.moveStart.clientY = event.clientY;
        this.moveStart.x1 = this.cropper.x1;
        this.moveStart.y1 = this.cropper.y1;
        this.moveStart.x2 = this.cropper.x2;
        this.moveStart.y2 = this.cropper.y2;
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    moveImg(event: any) {
        event.stopPropagation();
        event.preventDefault();
        if (this.moveStart.active) {
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
        this.moveStart.active = false;
        this.crop();
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
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1);
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= overflowY > overflowX ? overflowY : overflowX;
                    this.cropper.y1 += overflowY > overflowX ? overflowY : overflowX;
                }
            case 'bottom':
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1);
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= overflowY > overflowX ? overflowY : overflowX;
                    this.cropper.y2 -= overflowY > overflowX ? overflowY : overflowX;
                }
                break;
            case 'topleft':
                this.cropper.y1 = this.cropper.y2 - (this.cropper.x2 - this.cropper.x1);
                overflowX = Math.max(0 - this.cropper.x1, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x1 += overflowY > overflowX ? overflowY : overflowX;
                    this.cropper.y1 += overflowY > overflowX ? overflowY : overflowX;
                }
                break;
            case 'topright':
                this.cropper.y1 = this.cropper.y2 - (this.cropper.x2 - this.cropper.x1);
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= overflowY > overflowX ? overflowY : overflowX;
                    this.cropper.y1 += overflowY > overflowX ? overflowY : overflowX;
                }
                break;
            case 'right':
            case 'bottomright':
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1);
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= overflowY > overflowX ? overflowY : overflowX;
                    this.cropper.y2 -= overflowY > overflowX ? overflowY : overflowX;
                }
                break;
            case 'left':
            case 'bottomleft':
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1);
                overflowX = Math.max(0 - this.cropper.x1, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x1 += overflowY > overflowX ? overflowY : overflowX;
                    this.cropper.y2 -= overflowY > overflowX ? overflowY : overflowX;
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
            const resizeRatio = this.resizeToWidth / width;
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
