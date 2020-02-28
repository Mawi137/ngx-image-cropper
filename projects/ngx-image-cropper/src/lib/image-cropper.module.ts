import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ImageCropperComponent } from './component/image-cropper.component';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
    ],
    declarations: [
        ImageCropperComponent
    ],
    exports: [
        ImageCropperComponent
    ]
})
export class ImageCropperModule {}
