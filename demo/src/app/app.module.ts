import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {FormsModule} from '@angular/forms';
import {ImageCropperModule} from '../../../src/image-cropper.module';
import { CropperResizeWidthComponent } from './cropper-resize-width/cropper-resize-width.component';
import { CropperResizeHeightComponent } from './cropper-resize-height/cropper-resize-height.component';

@NgModule({
  declarations: [
    AppComponent,
    CropperResizeWidthComponent,
    CropperResizeHeightComponent
  ],
  imports: [
      BrowserModule, FormsModule, ImageCropperModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
