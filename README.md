# Image cropper for Angular

### Installation
`npm install ngx-image-cropper --save`

### Example usage:
Add the ImageCropperModule to the imports of the module which will be using the Image Cropper.
```
import { NgModule } from '@angular/core';
import { ImageCropperModule } from 'ngx-image-cropper';

@NgModule({
    imports: [
        ...
        ImageCropperModule
    ],
    declarations: [
        ...
    ],
    exports: [
        ...
    ],
    providers: [
        ...
    ]
})
export class YourModule {
}
```

Add the element to your HTML:
```
<input type="file" (change)="fileChangeEvent($event)" />

<image-cropper
    [imageChangedEvent]="imageChangedEvent"
    [maintainAspectRatio]="true"
    [resizeToWidth]="128"
    format="png"
    (imageCropped)="imageCropped($event)"
></image-cropper>

<img [src]="croppedImage" />
```

And add this your ts file:
```
imageChangedEvent: any = '';
croppedImage: any = '';

fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
}
imageCropped(image: string) {
    this.croppedImage = image;
}
```
When you choose a file from the file input, it will trigger `fileChangeEvent`.
That event is then passed to the image cropper through `imageChangedEvent` which will then load the image into the cropper.
Everytime you release the mouse, the `imageCropped` event will be triggerd with the cropped image as a Base64 string in its payload.
