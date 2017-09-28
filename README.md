# Image cropper for Angular

Import the ImageCropperModule into you module.

`import { ImageCropperModule } from 'ngx-image-cropper';`

### Example usage:
HTML file:
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

In your ts file:
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

`imageCropped` will return the cropped image as a Base64 string.
