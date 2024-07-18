import { Component } from '@angular/core';
import {
  Dimensions,
  getCropperInitValue,
  getTransformInitValue,
  getImageCropperSettingsInitValue,
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageCropperSettings,
  PartialImageCropperSettings,
} from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, ImageCropperComponent]
})
export class AppComponent {
  showCropper = false;
  loading = false;
  croppedImage: SafeUrl = '';

  timeout: any;
  eventList = {};
  
  settings: ImageCropperSettings = getImageCropperSettingsInitValue();
  settingsToUpdate: PartialImageCropperSettings = {};

  constructor(
    private sanitizer: DomSanitizer
  ) {
  }

  fileChangeEvent(event: Event): void {
    this.loading = true;
    this.settingsToUpdate = { imageSource: { imageChangedEvent : event } }
  }

  imageLoaded() {
    this.showCropper = true;
    console.log('Image loaded');
  }

  loadImageFailed() {
    console.error('Load image failed');
  }

  settingsUpdated(settings: ImageCropperSettings){
    this.settings = settings;
  }

  cropperReady(sourceImageDimensions: Dimensions) {
    console.log('Cropper ready', sourceImageDimensions);
    this.loading = false;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || event.base64 || '');
    console.log('CROPPED', event);
  }

  rotateLeft() {
    this.loading = true;
    setTimeout(() => { // Use timeout because rotating image is a heavy operation and will block the ui thread
      this.settingsToUpdate = { canvasRotation: --this.settings.canvasRotation, ...this.flipAfterRotate() };
    });
  }

  rotateRight() {
    this.loading = true;
    setTimeout(() => { 
      this.settingsToUpdate = { canvasRotation: ++this.settings.canvasRotation, ...this.flipAfterRotate() };
    });
  }

  moveLeft() {
    this.settingsToUpdate = { transform: { translateX: --this.settings.transform.translateX } };
  }

  moveRight() {
    this.settingsToUpdate = { transform: { translateX: this.settings.transform.translateX + 1 } };
  }

  moveUp() {
    this.settingsToUpdate = { transform: { translateY: --this.settings.transform.translateY } };
  }

  moveDown() {
    this.settingsToUpdate = { transform: { translateY: ++this.settings.transform.translateY } };
  }

  private flipAfterRotate() {
    return { 
      transform: { 
        flipX: this.settings.transform.flipY,
        flipY: this.settings.transform.flipX,
        translateX: 0, 
        translateY: 0
      } 
    };
  }

  flipHorizontal() {
    this.settingsToUpdate = { transform: { flipX: !this.settings.transform.flipX } };
  }

  flipVertical() {
    this.settingsToUpdate = { transform: { flipY: !this.settings.transform.flipY } };
  }

  resetImage() {
    this.settingsToUpdate = { 
      canvasRotation: 0,
      cropper: getCropperInitValue(),
      maintainAspectRatio: false,
      transform: getTransformInitValue(), 
    };
  }

  zoomOut() {
    this.settingsToUpdate = { transform: { scale: this.settings.transform.scale - .1 } };
  }

  zoomIn() {
    this.settingsToUpdate = { transform: { scale: this.settings.transform.scale + .1 } };
  }

  updateRotation(rotate: number) {
    this.settingsToUpdate = { transform: { scale: this.settings.transform.rotate } };
  }

  toggleAspectRatio() {
    this.settingsToUpdate = { aspectRatio: this.settings.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3 };
  }

  toggleBackgroundColor() {
    this.settingsToUpdate = { backgroundColor: this.settings.backgroundColor === 'red' ? 'blue' : 'red' };
  }

  // prevent over triggering app when typing
  debounce(event: any) {
    clearTimeout(this.timeout);
    (this.eventList as any)[event.target.id] = event.target.value;
    this.timeout = setTimeout(() => {
      for (const [key, value] of Object.entries(this.eventList)) {
        if (key === 'imageURL') {
          this.settingsToUpdate = { imageSource: { [key]: value as string }};
        } else {
          this.settingsToUpdate = { [key]: Number(value) };
        }
      }
      this.eventList = {};
    }, 500);
  }

  /*
   Random Test button triggers this method
   use it to test whatever you want
  */
  test() {
    this.settingsToUpdate = { 
      canvasRotation: 3,
      transform: {scale: 2},
      cropper: { x1: 190, y1: 221.5, x2: 583, y2: 344.3125 }  // has 16/5 aspect ratio
    };
  }
}
