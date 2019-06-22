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
    (cropperReady)="cropperReady()"
    (loadImageFailed)="loadImageFailed()"
></image-cropper>

<img [src]="croppedImage" />
```

And add this to your ts file:
```
import { ImageCroppedEvent } from 'ngx-image-cropper';

export class YourComponent {
    imageChangedEvent: any = '';
    croppedImage: any = '';
    
    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
    }
    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }
    imageLoaded() {
        // show cropper
    }
    cropperReady() {
        // cropper ready
    }
    loadImageFailed() {
        // show message
    }
}
```
When you choose a file from the file input, it will trigger `fileChangeEvent`.
That event is then passed to the image cropper through `imageChangedEvent` which will load the image into the cropper.
Everytime you release the mouse, the `imageCropped` event will be triggerd with the cropped image as a Base64 string in its payload.

## API
All inputs are optional. Either the `imageChangedEvent` or `imageBase64` should be set to load an image into the cropper.
### Inputs
|  Name                    | Type      | Default      | Description     |
| ------------------------ |---------- | ------------ | --------------- |
| `imageChangedEvent`      | FileEvent |              | The change event from your file input (set to `null` to reset the cropper) |
| `imageFileChanged`       | Blob(File)|              | The file you want to change (set to `null` to reset the cropper)           |
| `imageBase64`            | string    |              | If you don't want to use a file input, you can set a base64 image directly and it will be loaded into the cropper |
| `format`                 | string    | png          | Output format (png, jpeg, webp, bmp, ico) (not all browsers support all types, png is always supported, others are optional) |
| `outputType`             | string    | both         | Output type ('base64', 'file' or 'both'). Converting the image to a Blob can be quite a heavy operation. With this option, you could choose to only get the base64 which will improve the speed of cropping significantly |
| `aspectRatio`            | number    | 1 / 1        | The width / height ratio (e.g. 1 / 1 for a square, 4 / 3, 16 / 9 ...) |
| `maintainAspectRatio`    | boolean   | true         | Keep width and height of cropped image equal according to the aspectRatio |
| `containWithAspectRatio` | boolean   | false        | When set to true, padding will be added around the image to make it fit to the aspect ratio |
| `resizeToWidth`          | number    | 0 (disabled) | Cropped image will be resized to this width (in px) |
| `resizeToHeight`         | number    | 0 (disabled) | Cropped image will be resized to this height (in px) (will be ignored if resizeToWidth is set)  |
| `cropperMinWidth`        | number    | 0 (disabled) | The cropper cannot be made smaller than this number of pixels in width (relative to original image's size) (in px) |
| `cropperMinHeight`       | number    | 0 (disabled) | The cropper cannot be made smaller than this number of pixels in height (relative to original image's size) (in px) (will be ignored if `maintainAspectRatio` is set) |
| `onlyScaleDown`          | boolean   | false        | When the `resizeToWidth` is set, enabling this option will make sure smaller images are not scaled up |
| `cropper`                | CropperPosition |  | To be able to overwrite the cropper coordinates, you can use this input. Create a new object of type `CropperPosition` and assign it to this input. Make sure to create a new object each time you wish to overwrite the cropper's position and wait for the `cropperReady` event to have fired. |
| `roundCropper`           | boolean   | false        | Set this to true for a round cropper. Resulting image will still be square, use `border-radius: 100%` on resulting image to show it as round. |
| `imageQuality`           | number    | 92           | This only applies when using jpeg or webp as output format. Entering a number between 0 and 100 will determine the quality of the output image. |
| `autoCrop`               | boolean   | true         | When set to true, the cropper will emit an image each time the position or size of the cropper is changed. When set to false, you can call the crop method yourself (use @ViewChild to get access to the croppers methods). |
| `alignImage`             | 'left' or 'center' | 'center' | Use this to align the image in the cropper either to the left or center. |
| `backgroundColor`        | string    | 'white'      | Use this to set a backgroundColor, this is useful if you upload an image of a format with transparent colors and convert it to 'jpeg' or 'bmp'. The transparent pixels will then become the set color or the default value. Enter a color HashCode or one of known HTML color names (https://www.w3schools.com/tags/ref_colornames.asp).|

### Outputs
| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| `imageCropped`          | ImageCroppedEvent | Emits an ImageCroppedEvent each time the image is cropped |
| **(DEPRECATED)** `imageCroppedBase64` | string            | Emits a Base64 string of the cropped image each time it is cropped |
| **(DEPRECATED)** `imageCroppedFile`  | File              | Emits the cropped image as a file each time it is cropped |
| `imageLoaded`           | void              | Emits when the image was loaded into the cropper |
| `cropperReady`          | void              | Emits when the cropper is ready to be interacted |
| `startCropImage`        | void              | Emits when the component started cropping the image |
| `loadImageFailed`       | void              | Emits when a wrong file type was selected (only png, gif and jpg are allowed) |

### Methods
To gain access to the image cropper's methods use `@ViewChild(ImageCropperComponent) imageCropper: ImageCropperComponent;`

| Name                    | Returns           | Description |
| ----------------------- | ----------------- | ----------- |
| `rotateLeft`            | void              | Rotates the image to the left |
| `rotateRight`           | void              | Rotates the image to the right |
| `flipHorizontal`        | void              | Flips the image horizontally |
| `flipVertical`          | void              | Flips the image vertically |
| `crop`                  | ImageCroppedEvent (when `outputType` is `base64`) or Promise&lt;ImageCroppedEvent&gt; (when `outputType` is `file` or `both`)) | Crops the source image to the current cropper position. Accepts an output type as an argument, default is the one given in the `outputType` input (`base64`, `file` or `both`). Be sure to set `autoCrop` to `false` if you only wish to use this function directly. |

### Interfaces
#### CropperPosition
| Property | Type   | Description |
| -------- | ------ | ----------- |
| x1       | number | X position of first coordinate (in px) |
| y1       | number | Y position of first coordinate (in px) |
| x2       | number | X position of second coordinate (in px) |
| y2       | number | Y position of second coordinate (in px) |

#### ImageCroppedEvent
| Property        | Type            | Description |
| --------------- | ------          | ----------- |
| base64          | string          | Base64 string of the cropped image |
| file            | Blob(File)      | Blob of the cropped image |
| width           | number          | Width of the cropped image |
| height          | number          | Height of the cropped image |
| cropperPosition | CropperPosition | Position of the cropper when it was cropped relative to the displayed image size |
| imagePosition   | CropperPosition | Position of the cropper when it was cropped relative to the original image size |


### Polyfill for IE and Edge
If you wish to use the file output, you'll need to polyfill the `toBlob` method of the HTML Canvas for IE and Edge.
```
if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function (callback, type, quality) {
      var dataURL = this.toDataURL(type, quality).split(',')[1];
      setTimeout(function() {

        var binStr = atob( dataURL ),
            len = binStr.length,
            arr = new Uint8Array(len);

        for (var i = 0; i < len; i++ ) {
          arr[i] = binStr.charCodeAt(i);
        }

        callback( new Blob( [arr], {type: type || 'image/png'} ) );

      });
    }
  });
}
```
