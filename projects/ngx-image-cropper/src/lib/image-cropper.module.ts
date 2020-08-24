import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent } from './component/image-cropper.component';
import { ImageCropperService } from "./services/image-cropper.service";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ImageCropperComponent,
    ],
    exports: [
        ImageCropperComponent,
    ],
    providers: [
        ImageCropperService
    ]
})
export class ImageCropperModule {}
