# Image cropper for Angular
![example](https://github.com/Mawi137/ngx-image-cropper/raw/master/cropper-example.png)

[StackBlitz](https://stackblitz.com/edit/image-cropper)

### Installation
`npm install ngx-image-cropper --save`

### Upgrade instructions
For a list of breaking changes and update instructions, go to [releases](https://github.com/Mawi137/ngx-image-cropper/releases).

### Example usage
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
    imageLoaded(image: HTMLImageElement) {
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
Everytime you release the mouse, the `imageCropped` event will be triggered with the cropped image as a Base64 string in its payload.

## API
All inputs are optional. Either the `imageChangedEvent`, `imageBase64` or `imageFile` should be set to load an image into the cropper.
### Inputs
|  Name                      | Type      | Default      | Description     |
| -------------------------- |---------- | ------------ | --------------- |
| `imageChangedEvent`        | FileEvent |              | The change event from your file input (set to `null` to reset the cropper) |
| `imageFile`                | Blob(File)|              | The file you want to change (set to `null` to reset the cropper)           |
| `imageBase64`              | string    |              | If you don't want to use a file input, you can set a base64 image directly and it will be loaded into the cropper |
| `imageURL`                 | string    |              | If you don't want to use a file input or a base64 you can set an URL to get the image from. If requesting an image from a different domain make sure Cross-Origin Resource Sharing (CORS) is allowed or the image will fail to load. |
| `format`                   | string    | png          | Output format (png, jpeg, webp, bmp, ico) (not all browsers support all types, png is always supported, others are optional) |
| `aspectRatio`              | number    | 1 / 1        | The width / height ratio (e.g. 1 / 1 for a square, 4 / 3, 16 / 9 ...) |
| `maintainAspectRatio`      | boolean   | true         | Keep width and height of cropped image equal according to the aspectRatio |
| `containWithinAspectRatio` | boolean   | false        | When set to true, padding will be added around the image to make it fit to the aspect ratio |
| `resizeToWidth`            | number    | 0 (disabled) | Cropped image will be resized to at most this width (in px) |
| `resizeToHeight`           | number    | 0 (disabled) | Cropped image will be resized to at most this height (in px)  |
| `cropperStaticWidth`       | number    | 0 (disabled) | Set Cropper Width and disable resize (in px) |
| `cropperStaticHeight`      | number    | 0 (disabled) | Set Cropper Height and disable resize (in px) |
| `cropperMinWidth`          | number    | 0 (disabled) | The cropper cannot be made smaller than this number of pixels in width (relative to original image's size) (in px) |
| `cropperMinHeight`         | number    | 0 (disabled) | The cropper cannot be made smaller than this number of pixels in height (relative to original image's size) (in px) (will be ignored if `maintainAspectRatio` is set) |
| `cropperMaxWidth`          | number    | 0 (disabled) | The cropper cannot be made bigger than this number of pixels in width (in px) |
| `cropperMaxHeight`         | number    | 0 (disabled) | The cropper cannot be made bigger than this number of pixels in height (in px) |
| `initialStepSize`          | number    | 3 (px)       | The initial step size in pixels when moving the cropper using the keyboard. Step size can then be changed by using the numpad when the cropper is focused |
| `onlyScaleDown`            | boolean   | false        | When the `resizeToWidth` or `resizeToHeight` is set, enabling this option will make sure smaller images are not scaled up |
| `cropper`                  | CropperPosition |  | To be able to overwrite the cropper coordinates, you can use this input. Create a new object of type `CropperPosition` and assign it to this input. Make sure to create a new object each time you wish to overwrite the cropper's position and wait for the `cropperReady` event to have fired. |
| `roundCropper`             | boolean   | false        | Set this to true for a round cropper. Resulting image will still be square, use `border-radius: 100%` on resulting image to show it as round. |
| `imageQuality`             | number    | 92           | This only applies when using jpeg or webp as output format. Entering a number between 0 and 100 will determine the quality of the output image. |
| `autoCrop`                 | boolean   | true         | When set to true, the cropper will emit an image each time the position or size of the cropper is changed. When set to false, you can call the crop method yourself (use @ViewChild to get access to the croppers methods). |
| `alignImage`               | 'left' or 'center' | 'center' | Use this to align the image in the cropper either to the left or center. |
| `backgroundColor`          | string    |              | Use this to set a backgroundColor, this is useful if you upload an image of a format with transparent colors and convert it to 'jpeg' or 'bmp'. The transparent pixels will then become the set color or the default value. Enter a color HashCode or one of known HTML color names (https://www.w3schools.com/tags/ref_colornames.asp).|
| `hideResizeSquares`        | boolean   | false        | Disables the resize-squares at the border of the cropper. This is mostly useful for Touch Devices where you can change the Size of the Cropper via Pinch-To-Zoom|
| `disabled`                 | boolean   | false        | Disables the component and prevents changing the cropper position |
| `canvasRotation`           | number    | 0            | Rotate the canvas (1 = 90deg, 2 = 180deg...) |
| `transform`                | ImageTransform   | {}    | Flip, rotate and scale image |

### CSS Variables
|  Name                      | Type      | Default      | Description     |
| -------------------------- |---------- | ------------ | --------------- |
| `--cropper-outline-color`  | string    | rgba(255,255,255,0.3) | The background color you see around the cropper |
| `--cropper-overlay-color`  | string    | rgba(255,255,255)     | The background color you see around the image |

### Outputs
| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| `imageCropped`          | ImageCroppedEvent | Emits an ImageCroppedEvent each time the image is cropped |
| `imageLoaded`           | LoadedImage       | Emits the Image when it was loaded into the cropper |
| `cropperReady`          | Dimensions        | Emits when the cropper is ready to be interacted. The Dimensions object that is returned contains the displayed image size |
| `startCropImage`        | void              | Emits when the component started cropping the image |
| `loadImageFailed`       | void              | Emits when a wrong file type was selected (only png, gif and jpg are allowed) |

### Methods
To gain access to the image cropper's methods use `@ViewChild(ImageCropperComponent) imageCropper: ImageCropperComponent;`

| Name                    | Returns           | Description |
| ----------------------- | ----------------- | ----------- |
| `crop`                  | ImageCroppedEvent | Crops the source image to the current cropper position. Be sure to set `autoCrop` to `false` if you only wish to use this function directly. |

### Interfaces
#### CropperPosition
| Property | Type   | Description |
| -------- | ------ | ----------- |
| x1       | number | X position of first coordinate (in px) |
| y1       | number | Y position of first coordinate (in px) |
| x2       | number | X position of second coordinate (in px) |
| y2       | number | Y position of second coordinate (in px) |

#### ImageTransform
| Property | Type    | Description |
| -------- | ------- | ----------- |
| scale    | number  | Scale image (1=normal, 2=2x zoom...) |
| rotate   | number  | Rotation in degrees |
| flipH    | boolean | Flipped horizontally |
| flipV    | boolean | Flipped vertically |

#### ImageCroppedEvent
| Property              | Type            | Description |
| --------------------  | ------          | ----------- |
| base64                | string          | Base64 string of the cropped image |
| width                 | number          | Width of the cropped image |
| height                | number          | Height of the cropped image |
| cropperPosition       | CropperPosition | Position of the cropper when it was cropped relative to the displayed image size |
| imagePosition         | CropperPosition | Position of the cropper when it was cropped relative to the original image size |
| offsetImagePosition   | CropperPosition | Position of the cropper when it was cropped relative to the original image size without padding when containWithinAspectRatio is true |

#### ImageLoaded
| Property              | Type             | Description |
| --------------------  | ------           | ----------- |
| original.base64       | string           | Base64 string of the original image |
| original.image        | HTMLImageElement | HTMLImageElement of the original image |
| original.size         | Dimension        | Width and height of the original image |
| transformed.base64    | string           | Base64 string of the transformed image |
| transformed.image     | HTMLImageElement | HTMLImageElement of the transformed image |
| transformed.size      | Dimension        | Width and height of the transformed image |
| exifTransform         | ExifTransform    | Exif transformations read from original image |
