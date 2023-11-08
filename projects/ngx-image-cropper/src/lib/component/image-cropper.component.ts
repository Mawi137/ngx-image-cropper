import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, NgZone, Optional} from '@angular/core';
import {DomSanitizer, HAMMER_LOADER, HammerLoader} from '@angular/platform-browser';
import {CropService} from '../services/crop.service';
import {CropperPositionService} from '../services/cropper-position.service';
import {LoadImageService} from '../services/load-image.service';
import {AbstractImageCropperDirective} from '../directives/abstract-image-cropper.directive';

@Component({
  selector       : 'image-cropper',
  templateUrl    : './image-cropper.component.html',
  styleUrls      : ['./image-cropper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCropperComponent extends AbstractImageCropperDirective {
  constructor(
    cropService: CropService,
    cropperPositionService: CropperPositionService,
    loadImageService: LoadImageService,
    sanitizer: DomSanitizer,
    cd: ChangeDetectorRef,
    zone: NgZone,
    @Optional() @Inject(HAMMER_LOADER) readonly hammerLoader: HammerLoader | null
  ) {
    super(cropService, cropperPositionService, loadImageService, sanitizer, cd, zone, hammerLoader);
  }
}
