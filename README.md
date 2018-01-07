# Image cropper for Angular
![example](https://github.com/MartijnW49/ngx-image-cropper/blob/master/cropper-example.png)

[Plunker](https://plnkr.co/edit/pcnBN6Fwk8rjjtisIuyC?p=preview)

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
    [aspectRatio]="4 / 3"
    [resizeToWidth]="128"
    format="png"
    (imageCropped)="imageCropped($event)"
></image-cropper>

<img [src]="croppedImage" />
```

And add this to your ts file:
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
That event is then passed to the image cropper through `imageChangedEvent` which will load the image into the cropper.
Everytime you release the mouse, the `imageCropped` event will be triggerd with the cropped image as a Base64 string in its payload.

## API
### Inputs
- `imageChangedEvent` - The change event from your file input (set to `null` to reset the cropper)
- `format` - Output format (png, jpeg, webp, bmp, ico) (default = png) (not all browsers support all types, png is always supported, others are optional)
- `maintainAspectRatio` - Keep width and height of cropped image equal according to the aspectRatio (default = true)
- `aspectRatio` - The width / height ratio (e.g. 1 / 1 for a square, 4 / 3, 16 / 9 ...) (default = 1)
- `resizeToWidth` - Cropped image will be resized to this width (in px) (default = 0 (no resizing))
- `imageBase64` - If you don't want to use a file input, you can set a base64 image directly and it will be loaded into the cropper

### Outputs
- `imageCropped` - Emits a Base64 string of the cropped image each time it is cropped
- `imageLoaded` - Emits when the image was loaded into the cropper
- `loadImageFailed` - Emits when a wrong file type was selected (only png, gif and jpg are allowed)
