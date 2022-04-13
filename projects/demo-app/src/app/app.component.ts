import { Component } from '@angular/core';
import {Dimensions, ImageCroppedEvent, ImageTransform} from "../../../ngx-image-cropper/src/lib/interfaces";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  imageChangedEvent: any = '';
  croppedImage: any = '';
  canvasRotation = 0;
  rotation?: number;
  translateH = 0;
  translateV = 0;
  scale = 1;
  aspectRatio = 4 / 3;
  showCropper = false;
  containWithinAspectRatio = false;
  transform$: BehaviorSubject<ImageTransform> = new BehaviorSubject<ImageTransform>({});
  imageURL?: string;
  loading = false;
  allowPanning$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  fileChangeEvent(event: any): void {
    this.loading = true;
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
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
    this.transform$.next( {
      ...this.transform$.value,
      translateH: ++this.translateH
    });
  }

  moveRight() {
    this.transform$.next( {
      ...this.transform$.value,
      translateH: --this.translateH
    });
  }

  moveTop() {
    this.transform$.next( {
      ...this.transform$.value,
      translateV: ++this.translateV
    });
  }

  moveBottom() {
    this.transform$.next( {
      ...this.transform$.value,
      translateV: --this.translateV
    });
  }

  private flipAfterRotate() {
    const flippedH = this.transform$.value.flipH;
    const flippedV = this.transform$.value.flipV;
    this.transform$.next( {
      ...this.transform$.value,
      flipH: flippedV,
      flipV: flippedH
    });
    this.translateH = 0;
    this.translateV = 0;
  }

  flipHorizontal() {
    this.transform$.next({
      ...this.transform$.value,
      flipH: !this.transform$.value.flipH
    });
  }

  flipVertical() {
    this.transform$.next( {
      ...this.transform$.value,
      flipV: !this.transform$.value.flipV
    });
  }

  resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform$.next({});
  }

  zoomOut() {
    this.scale -= .1;
    this.transform$.next({
      ...this.transform$.value,
      scale: this.scale
    });
  }

  zoomIn() {
    this.scale += .1;
    this.transform$.next( {
      ...this.transform$.value,
      scale: this.scale
    });
  }

  toggleContainWithinAspectRatio() {
    this.containWithinAspectRatio = !this.containWithinAspectRatio;
  }

  updateRotation() {
    this.transform$.next({
      ...this.transform$.value,
      rotate: this.rotation
    });
  }

  toggleAspectRatio() {
    this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3;
  }

  onImageDragged(x: number, y: number)
  {
    this.transform$.next({
      ...this.transform$.value,
      translateH: (this.transform$.value?.scale && this.transform$.value?.scale > 1 ? x / this.transform$.value.scale : x),
      translateV: (this.transform$.value?.scale && this.transform$.value?.scale > 1 ? y / this.transform$.value.scale : y)
    });
  }
}
