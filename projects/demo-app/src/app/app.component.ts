import { Component, ViewChild } from '@angular/core';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    imageChangedEvent: any = '';
    croppedImage: any = '';
    showCropper = false;
    containWithinAspectRatio = false;

    @ViewChild(ImageCropperComponent, {static: true}) imageCropper: ImageCropperComponent;

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
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

    toggleContainWithinAspectRatio(){
        this.containWithinAspectRatio = !this.containWithinAspectRatio;
    }
}
