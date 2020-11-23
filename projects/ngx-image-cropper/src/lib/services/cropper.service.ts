import { Injectable } from '@angular/core';
import { CropperSettings } from '../interfaces/cropper.settings';

@Injectable()
export class CropperService {

  private settings: CropperSettings;

  updateSettings(settings: CropperSettings): void {
    this.settings = settings;
  }
}
