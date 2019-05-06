import {Component, ViewChild} from '@angular/core';
import {ImageCropperComponent} from '../../../src/component/image-cropper.component';
import {ImageCroppedEvent} from '../../../src/interfaces';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    imageChangedEvent: any = '';
    croppedImage: any = '';
    showCropper = false;
    width: number;
    height: number;
    resizeToWidth = 175;

    @ViewChild(ImageCropperComponent) imageCropper: ImageCropperComponent;

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
        this.width = event.width;
        this.height = event.height;
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
}
