# Image cropper for Angular
![example](https://github.com/Mawi137/ngx-image-cropper/raw/master/cropper-example.png)

[StackBlitz](https://stackblitz.com/edit/image-cropper)

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
    (imageLoaded)="imageLoaded()"
    (loadImageFailed)="loadImageFailed()"
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
imageLoaded() {
    // show cropper
}
loadImageFailed() {
    // show message
}
```
When you choose a file from the file input, it will trigger `fileChangeEvent`.
That event is then passed to the image cropper through `imageChangedEvent` which will load the image into the cropper.
Everytime you release the mouse, the `imageCropped` event will be triggerd with the cropped image as a Base64 string in its payload.

## API
All inputs are optional. Either the `imageChangedEvent` or `imageBase64` should be set to load an image into the cropper.
### Inputs
|  Name                  | Type      | Default      | Description     |
| ---------------------- |---------- | ------------ | --------------- |
| `imageChangedEvent`    | FileEvent |              | The change event from your file input (set to `null` to reset the cropper) |
| `format`               | string    | png          | Output format (png, jpeg, webp, bmp, ico) (not all browsers support all types, png is always supported, others are optional) |
| `maintainAspectRatio`  | boolean   | true         | Keep width and height of cropped image equal according to the aspectRatio |
| `aspectRatio`          | number    | 1 / 1        | The width / height ratio (e.g. 1 / 1 for a square, 4 / 3, 16 / 9 ...) |
| `resizeToWidth`        | number    | 0 (disabled) | Cropped image will be resized to this width (in px) |
| `onlyScaleDown`        | boolean   | false        | When the `resizeWidth` is set, enabling this option will make sure smaller images are not scaled up |
| `imageBase64`          | string    |              | If you don't want to use a file input, you can set a base64 image directly and it will be loaded into the cropper |
| `cropper`              | { x1: number, y1: number, x2: number, y2: number } |  | To be able to get the cropper coordinates, you can use this input. Create a new object `{x1: number, y1: number, x2: number, y2: number }` and assign it to this input. Make sure to create a new object each time you wish to overwrite the cropper's position. |
| `imageQuality`          | number    | 92           | This only applies when using jpeg or webp as output format. Entering a number between 0 and 100 will determine the quality of the output image. |

### Outputs
| Name              | Type   | Description |
| ----------------- | ------ | ----------- |
| `imageCropped`    | string | Emits a Base64 string of the cropped image each time it is cropped |
| `imageLoaded`     | void   | Emits when the image was loaded into the cropper |
| `loadImageFailed` | void   | Emits when a wrong file type was selected (only png, gif and jpg are allowed) |
