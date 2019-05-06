import {Component, Input, ViewChild} from '@angular/core';
import {ImageCropperComponent} from '../../../../src/component/image-cropper.component';
import {ImageCroppedEvent} from '../../../../src/interfaces';

@Component({
    selector: 'app-cropper-resize-height',
    templateUrl: './cropper-resize-height.component.html',
    styleUrls: []
})
export class CropperResizeHeightComponent {
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
    }

    imageLoaded() {
        this.showCropper = true;
        console.log('Image loaded');
    }

}
