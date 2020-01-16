import { Component, ViewChild } from '@angular/core';
import { Dimensions, ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

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
    transform = {
        scale: 1.5,
        rotate: 45
    };

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

    cropperReady(sourceImageDimensions: Dimensions) {
        console.log('Cropper ready', sourceImageDimensions);
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

    resetImage() {
        this.imageCropper.resetImage();
    }

    toggleContainWithinAspectRatio(){
        this.containWithinAspectRatio = !this.containWithinAspectRatio;
    }
}
