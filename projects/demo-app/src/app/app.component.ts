import { Component, ViewChild } from '@angular/core';
import { Dimensions, ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    rotateCtrl = new FormControl(0);
    imageChangedEvent: any = '';
    croppedImage: any = '';
    zoom$ = new BehaviorSubject(1);
    zoom = 1;
    showCropper = false;
    containWithinAspectRatio = false;

    transform$ = combineLatest([
        this.rotateCtrl.valueChanges.pipe(startWith(this.rotateCtrl.value)),
        this.zoom$
    ]).pipe(map(([rotate, scale]: [number, number]) => ({
            rotate,
            scale
        }))
    );

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

    zoomOut() {
        this.zoom -= .1;
        this.zoom$.next(this.zoom);
    }

    zoomIn() {
        this.zoom += .1;
        this.zoom$.next(this.zoom);
    }

    toggleContainWithinAspectRatio(){
        this.containWithinAspectRatio = !this.containWithinAspectRatio;
    }
}
