import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent } from './component/image-cropper.component';
import {DraggableImageDirective} from "./directives/draggable-image.directive";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ImageCropperComponent,
    DraggableImageDirective
  ],
  exports: [
    ImageCropperComponent
  ]
})
export class ImageCropperModule {
}
