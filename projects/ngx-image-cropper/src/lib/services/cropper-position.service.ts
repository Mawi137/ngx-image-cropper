import { Injectable } from '@angular/core';
import { CropperPosition, Dimensions, MoveStart } from '../interfaces';
import { CropperSettings } from '../interfaces/cropper.settings';

@Injectable({ providedIn: 'root' })
export class CropperPositionService {

  /*
  Up until now whenever resetCropperPosition was called, the cropper was reset to it's biggest possible size. 
    
  This is no longer the case, hence the new name.  

  By the end of this PR, when there are changes to cropper min, max and/or static size (I'm calling this cropper size bounds) and mantainAspectRatio is FALSE, we only want to check the cropper is whithin its size bounds. If it is, return the same cropper position and size. And if it isn't, change cropper size but keep the position untouched – we then check it's within maxSize later in the code path in case any of it ended up outside during the resizing.
    
  This behaviour is completely new, and is needed at this stage – before the app wasn't responding to these changes and now it will so it needs a response. All the other ways in which this method was being used I've kept the same by adding the resetCropper parameter. Now it's always true, but when responding to changes in cropper bounding sizes, resetCropper will be false.
    
  In future PRs I'll be changing this so developers can pick when to reset the cropper as big as possible and when to work with the cropper that is already there. This will be done by using the resetCropper param or assigning 0 to cropperPosition.x2.

  So far I've managed to have an app input called resetCropperToBiggestPossibleSize:boolean and I toggle it between interactions I send from the parent and the imageCropped event. But this doesn't work if auto crop is false, hence the cropperPosition.x2 === 0 check.

  cropperPosition.x2 will only be 0 when the app is initialised – I've changed this too – or when a new source image is loaded – also changed. So it's safe to use it in this way too. I've also argued to myself that it's easy for developers to understand that if the cropper has no width, we're asking for a new one, as no width is no cropper and the app needs one to work. Fingers crossed.

  Also, if you do some crazy testing by setting strange min and max values. You might find problems. That is also in a future PR.
  */
  checkWithinCropperSizeBounds(cropperPosition: CropperPosition, settings: CropperSettings, maxSize: Dimensions, resetCropper: boolean): void {

    // by the end of the PR we don't need a blocker here

    console.log('CHECK CROPPER WITHIN CROPPER SIZE BOUNDS')

    if (resetCropper || cropperPosition.x2 === 0) {
      cropperPosition.x1 = 0;
      cropperPosition.y1 = 0;
      cropperPosition.x2 = maxSize.width;
      cropperPosition.y2 = maxSize.height;
    };

    let cropperWidth = cropperPosition.x2 - cropperPosition.x1;
    let cropperHeight = cropperPosition.y2 - cropperPosition.y1;
    const centerX = cropperPosition.x1 + cropperWidth / 2;
    const centerY = cropperPosition.y1 + cropperHeight / 2;

    // added checking for min scaled size too
    if (settings.cropperStaticHeight && settings.cropperStaticWidth) {
      cropperWidth = maxSize.width > settings.cropperStaticWidth ? 
        settings.cropperStaticWidth : maxSize.width;
      cropperHeight = maxSize.height > settings.cropperStaticHeight ?
        settings.cropperStaticHeight : maxSize.height;
    } else {
      cropperWidth = Math.max(settings.cropperScaledMinWidth, Math.min(cropperWidth, settings.cropperScaledMaxWidth, maxSize.width));
      cropperHeight = Math.max(settings.cropperScaledMinHeight, Math.min(cropperHeight, settings.cropperScaledMaxHeight, maxSize.height));
      if (settings.maintainAspectRatio) {
        maxSize.width / settings.aspectRatio < maxSize.height
          ? cropperHeight = cropperWidth / settings.aspectRatio
          : cropperWidth = cropperHeight * settings.aspectRatio;
      }
    }

    cropperPosition.x1 = centerX - cropperWidth / 2;
    cropperPosition.x2 = cropperPosition.x1 + cropperWidth;
    cropperPosition.y1 = centerY - cropperHeight / 2;
    cropperPosition.y2 = cropperPosition.y1 + cropperHeight;
  }
  

  move(event: any, moveStart: MoveStart, cropperPosition: CropperPosition) {
    console.log('MOVE')
    const diffX = this.getClientX(event) - moveStart.clientX;
    const diffY = this.getClientY(event) - moveStart.clientY;

    cropperPosition.x1 = moveStart.cropper.x1 + diffX;
    cropperPosition.y1 = moveStart.cropper.y1 + diffY;
    cropperPosition.x2 = moveStart.cropper.x2 + diffX;
    cropperPosition.y2 = moveStart.cropper.y2 + diffY;
  }

  resize(event: any, moveStart: MoveStart, cropperPosition: CropperPosition, maxSize: Dimensions, settings: CropperSettings): void {
    console.log('RESIZE')
    const moveX = this.getClientX(event) - moveStart.clientX;
    const moveY = this.getClientY(event) - moveStart.clientY;
    switch (moveStart.position) {
      case 'left':
        cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - settings.cropperScaledMaxWidth),
          cropperPosition.x2 - settings.cropperScaledMinWidth);
        break;
      case 'topleft':
        cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - settings.cropperScaledMaxWidth),
          cropperPosition.x2 - settings.cropperScaledMinWidth);
        cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - settings.cropperScaledMaxHeight),
          cropperPosition.y2 - settings.cropperScaledMinHeight);
        break;
      case 'top':
        cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - settings.cropperScaledMaxHeight),
          cropperPosition.y2 - settings.cropperScaledMinHeight);
        break;
      case 'topright':
        cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + settings.cropperScaledMaxWidth),
          cropperPosition.x1 + settings.cropperScaledMinWidth);
        cropperPosition.y1 = Math.min(Math.max(moveStart.cropper.y1 + moveY, cropperPosition.y2 - settings.cropperScaledMaxHeight),
          cropperPosition.y2 - settings.cropperScaledMinHeight);
        break;
      case 'right':
        cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + settings.cropperScaledMaxWidth),
          cropperPosition.x1 + settings.cropperScaledMinWidth);
        break;
      case 'bottomright':
        cropperPosition.x2 = Math.max(Math.min(moveStart.cropper.x2 + moveX, cropperPosition.x1 + settings.cropperScaledMaxWidth),
          cropperPosition.x1 + settings.cropperScaledMinWidth);
        cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + settings.cropperScaledMaxHeight),
          cropperPosition.y1 + settings.cropperScaledMinHeight);
        break;
      case 'bottom':
        cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + settings.cropperScaledMaxHeight),
          cropperPosition.y1 + settings.cropperScaledMinHeight);
        break;
      case 'bottomleft':
        cropperPosition.x1 = Math.min(Math.max(moveStart.cropper.x1 + moveX, cropperPosition.x2 - settings.cropperScaledMaxWidth),
          cropperPosition.x2 - settings.cropperScaledMinWidth);
        cropperPosition.y2 = Math.max(Math.min(moveStart.cropper.y2 + moveY, cropperPosition.y1 + settings.cropperScaledMaxHeight),
          cropperPosition.y1 + settings.cropperScaledMinHeight);
        break;
      case 'center':
        const scale = event.scale;
        const newWidth = Math.min(
          Math.max(settings.cropperScaledMinWidth, (Math.abs(moveStart.cropper.x2 - moveStart.cropper.x1)) * scale),
          settings.cropperScaledMaxWidth);
        const newHeight = Math.min(
          Math.max(settings.cropperScaledMinHeight, (Math.abs(moveStart.cropper.y2 - moveStart.cropper.y1)) * scale),
          settings.cropperScaledMaxHeight);
        cropperPosition.x1 = moveStart.clientX - newWidth / 2;
        cropperPosition.x2 = moveStart.clientX + newWidth / 2;
        cropperPosition.y1 = moveStart.clientY - newHeight / 2;
        cropperPosition.y2 = moveStart.clientY + newHeight / 2;
        if (cropperPosition.x1 < 0) {
          cropperPosition.x2 -= cropperPosition.x1;
          cropperPosition.x1 = 0;
        } else if (cropperPosition.x2 > maxSize.width) {
          cropperPosition.x1 -= (cropperPosition.x2 - maxSize.width);
          cropperPosition.x2 = maxSize.width;
        }
        if (cropperPosition.y1 < 0) {
          cropperPosition.y2 -= cropperPosition.y1;
          cropperPosition.y1 = 0;
        } else if (cropperPosition.y2 > maxSize.height) {
          cropperPosition.y1 -= (cropperPosition.y2 - maxSize.height);
          cropperPosition.y2 = maxSize.height;
        }
        break;
    }

    if (settings.maintainAspectRatio) {
      this.checkAspectRatio(moveStart.position!, cropperPosition, maxSize, settings);
    }
  }

  checkAspectRatio(position: string, cropperPosition: CropperPosition, maxSize: Dimensions, settings: CropperSettings): void {
    console.log(' - CHECK ASPECT RATIO')
    let overflowX = 0;
    let overflowY = 0;

    switch (position) {
      case 'top':
        cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * settings.aspectRatio;
        overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
        overflowY = Math.max(0 - cropperPosition.y1, 0);
        if (overflowX > 0 || overflowY > 0) {
          cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
          cropperPosition.y1 += (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
        }
        break;
      case 'bottom':
        cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * settings.aspectRatio;
        overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
        overflowY = Math.max(cropperPosition.y2 - maxSize.height, 0);
        if (overflowX > 0 || overflowY > 0) {
          cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
          cropperPosition.y2 -= (overflowY * settings.aspectRatio) > overflowX ? overflowY : (overflowX / settings.aspectRatio);
        }
        break;
      case 'topleft':
        cropperPosition.y1 = cropperPosition.y2 - (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
        overflowX = Math.max(0 - cropperPosition.x1, 0);
        overflowY = Math.max(0 - cropperPosition.y1, 0);
        if (overflowX > 0 || overflowY > 0) {
          cropperPosition.x1 += (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
          cropperPosition.y1 += (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
        }
        break;
      case 'topright':
        cropperPosition.y1 = cropperPosition.y2 - (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
        overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
        overflowY = Math.max(0 - cropperPosition.y1, 0);
        if (overflowX > 0 || overflowY > 0) {
          cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
          cropperPosition.y1 += (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
        }
        break;
      case 'right':
      case 'bottomright':
        cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
        overflowX = Math.max(cropperPosition.x2 - maxSize.width, 0);
        overflowY = Math.max(cropperPosition.y2 - maxSize.height, 0);
        if (overflowX > 0 || overflowY > 0) {
          cropperPosition.x2 -= (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
          cropperPosition.y2 -= (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
        }
        break;
      case 'left':
      case 'bottomleft':
        cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
        overflowX = Math.max(0 - cropperPosition.x1, 0);
        overflowY = Math.max(cropperPosition.y2 - maxSize.height, 0);
        if (overflowX > 0 || overflowY > 0) {
          cropperPosition.x1 += (overflowY * settings.aspectRatio) > overflowX ? (overflowY * settings.aspectRatio) : overflowX;
          cropperPosition.y2 -= (overflowY * settings.aspectRatio) > overflowX ? overflowY : overflowX / settings.aspectRatio;
        }
        break;
      case 'center':
        cropperPosition.x2 = cropperPosition.x1 + (cropperPosition.y2 - cropperPosition.y1) * settings.aspectRatio;
        cropperPosition.y2 = cropperPosition.y1 + (cropperPosition.x2 - cropperPosition.x1) / settings.aspectRatio;
        const overflowX1 = Math.max(0 - cropperPosition.x1, 0);
        const overflowX2 = Math.max(cropperPosition.x2 - maxSize.width, 0);
        const overflowY1 = Math.max(cropperPosition.y2 - maxSize.height, 0);
        const overflowY2 = Math.max(0 - cropperPosition.y1, 0);
        if (overflowX1 > 0 || overflowX2 > 0 || overflowY1 > 0 || overflowY2 > 0) {
          cropperPosition.x1 += (overflowY1 * settings.aspectRatio) > overflowX1 ? (overflowY1 * settings.aspectRatio) : overflowX1;
          cropperPosition.x2 -= (overflowY2 * settings.aspectRatio) > overflowX2 ? (overflowY2 * settings.aspectRatio) : overflowX2;
          cropperPosition.y1 += (overflowY2 * settings.aspectRatio) > overflowX2 ? overflowY2 : overflowX2 / settings.aspectRatio;
          cropperPosition.y2 -= (overflowY1 * settings.aspectRatio) > overflowX1 ? overflowY1 : overflowX1 / settings.aspectRatio;
        }
        break;
    }
  }

  getClientX(event: any): number {
    return event.touches?.[0].clientX || event.clientX || 0;
  }

  getClientY(event: any): number {
    return event.touches?.[0].clientY || event.clientY || 0;
  }

  isNewPosition(oldCropper: CropperPosition, newCropper: CropperPosition){
    // TODO:(loiddy) Sometimes there's a difference in the 14th decimal place in the cropper position when a limit has been reached and accidentally you try to pinch over it. This should not trigger crop so toFixed prevents it. Check toFixed is still needed after changing resize in cropper pos service (in one of the next PRs).
    if(oldCropper.x1.toFixed(3) !== newCropper.x1.toFixed(3)) return true;
    if(oldCropper.y1.toFixed(3) !== newCropper.y1.toFixed(3)) return true;
    if(oldCropper.x2.toFixed(3) !== newCropper.x2.toFixed(3)) return true;
    if(oldCropper.y2.toFixed(3) !== newCropper.y2.toFixed(3)) return true;
    return false;
  }
}

