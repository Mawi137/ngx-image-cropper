import {Component, Input, ViewChild} from '@angular/core';
import {ImageCropperComponent} from '../../../../src/component/image-cropper.component';
import {ImageCroppedEvent} from '../../../../src/interfaces';

@Component({
    selector: 'app-cropper-resize-width',
    templateUrl: './cropper-resize-width.component.html',
    styleUrls: []
})
export class CropperResizeWidthComponent {
    @Input() width: number;
    @Input() height: number;

    croppedWidth: number;
    croppedHeight: number;
    imageChangedEvent: any = '';
    croppedImage: any = '';
    showCropper = false;

    @ViewChild(ImageCropperComponent) imageCropper: ImageCropperComponent;

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
        this.croppedWidth = event.width;
        this.croppedHeight = event.height;
        console.log(event);
    }

    imageLoaded() {
        this.showCropper = true;
        console.log('Image loaded');
    }

    cropperReady() {
        console.log('Cropper ready');
    }

    loadImageFailed() {
        console.log('Load failed');
    }

    rotateLeft() {
        this.imageCropper.rotateLeft();
    }

    rotateRight() {
        this.imageCropper.rotateRight();
    }

    flipHorizontal() {
        this.imageCropper.flipHorizontal();
    }

    flipVertical() {
        this.imageCropper.flipVertical();
    }

    zoomIn() {
        this.imageCropper.zoomIn();
    }

    zoomOut() {
        this.imageCropper.zoomOut();
    }

}
