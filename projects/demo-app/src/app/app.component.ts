import { Component } from '@angular/core';
import { CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  showCropper = false;
  loading = false;
  croppedImage: any = '';

  imageChangedEvent: any = '';
  imageURL?: string;
  hidden = false;
  disabled = false;
  alignImage = 'center' as const; 
  roundCropper = false;
  backgroundColor = 'red';
  allowMoveImage = false;
  hideResizeSquares = false;
  canvasRotation = 0;
  aspectRatio = 4 / 3;
  containWithinAspectRatio = false;
  maintainAspectRatio = false;
  cropperStaticWidth = 0;
  cropperStaticHeight = 0;
  cropperMinWidth = 0;
  cropperMinHeight = 0;
  cropperMaxWidth = 0;
  cropperMaxHeight = 0;
  resetCropOnAspectRatioChange = true;
  cropper: CropperPosition = { x1: 0, y1: 0, x2:0, y2:0 };
  transform: ImageTransform = {
    translateUnit: 'px',
    scale: 1,
    rotate: 0,
    flipH: false,
    flipV: false,
    translateH: 0,
    translateV: 0
  };

  timeout: any;
  eventList = {};

  constructor(
    private sanitizer: DomSanitizer
  ) {
  }

  fileChangeEvent(event: any): void {
    this.loading = true;
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || event.base64 || '');
    console.log('CROPPED', event);
  }

  imageLoaded() {
    this.showCropper = true;
    console.log('Image loaded');
  }

  cropperReady(sourceImageDimensions: Dimensions) {
    console.log('Cropper ready', sourceImageDimensions);
    this.loading = false;
  }

  loadImageFailed() {
    console.error('Load image failed');
  }

  transformChange(transform: ImageTransform){
    console.log('transform changed', transform)
  }

  rotateLeft() {
    this.loading = true;
    setTimeout(() => { // Use timeout because rotating image is a heavy operation and will block the ui thread
      this.canvasRotation--;
      this.flipAfterRotate();
    });
  }

  rotateRight() {
    this.loading = true;
    setTimeout(() => {
      this.canvasRotation++;
      this.flipAfterRotate();
    });
  }

  moveLeft() {
    this.transform = {
      ...this.transform,
      translateH: --this.transform.translateH!
    };
  }

  moveRight() {
    this.transform = {
      ...this.transform,
      translateH: ++this.transform.translateH! 
    };
  }

  moveDown() {
    this.transform = {
      ...this.transform,
      translateV: ++this.transform.translateV!
    };
  }

  moveUp() {
    this.transform = {
      ...this.transform,
      translateV: --this.transform.translateV!
    };
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH,
      translateH: 0,
      translateV: 0
    };
  }

  flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  resetImage() {
    this.canvasRotation = 0;
    this.cropper = {x1: 0, y1: 0, x2: 0, y2: 0};
    this.maintainAspectRatio = false; 
    this.transform = {
      translateUnit: 'px',
      scale: 1,
      rotate: 0,
      flipH: false,
      flipV: false,
      translateH: 0,
      translateV: 0 // need to add everything or transform doesn't work after reset
    };
  }

  zoomOut() {
    this.transform = {
      ...this.transform,
      scale: this.transform.scale! - .1
    };
  }

  zoomIn() {
    this.transform = {
      ...this.transform,
      scale: this.transform.scale! + .1
    };
  }

  updateRotation() {
    this.transform = {
      ...this.transform,
    };
  }

  toggleAspectRatio() {
    this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3;
  }

  toggleBackgroundColor() {
    this.backgroundColor = this.backgroundColor === 'red' ? 'blue' : 'red';
  }

  // to prevent over triggering app when typing
  debounce(event: any) {
    clearTimeout(this.timeout);
    (this.eventList as any)[event.target!.id] = event.target.value;
    this.timeout = setTimeout(() => {
      for (const [key, value] of Object.entries(this.eventList)) {
        (this as any)[key] = Number(value);
      }
      this.eventList = {}; 
    }, 500);
  }

  /*
   Random Test button triggers this method
   use it to test whatever you want
  */
  test() {
    this.canvasRotation = 3;
    this.transform = {
      ...this.transform, 
      scale: 2
    }
    this.cropper = { x1: 190, y1: 221.5, x2: 583, y2: 344.3125 } // has 16/5 aspect ratio
  }
}