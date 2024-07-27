import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Inject,
  Input,
  isDevMode,
  NgZone,
  OnChanges,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { DomSanitizer, HAMMER_LOADER, HammerLoader, SafeStyle, SafeUrl } from '@angular/platform-browser';
import {
  PartialImageCropperSettings,
  OutputType,
  Dimensions,
  ImageCroppedEvent,
  LoadedImage,
  MoveStart,
  BasicEvent, 
  MoveTypes, 
  Position,
  ImageCropperSettings
} from '../interfaces';
import { ImageCropperState } from '../state/image-cropper-state';
import { CropService } from '../services/crop.service';
import { LoadImageService } from '../services/load-image.service';
import { HammerInput, HammerStatic, getEventForKey, getInvertedPositionForKey, getPositionForKey, cropperPosition, cropperSizeBounds } from '../utils';
import { first, takeUntil } from 'rxjs/operators';
import { fromEvent, merge } from 'rxjs';
import { NgIf } from '@angular/common';
import { getCropperInitValue } from '../state/init-values';

@Component({
  selector: 'image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf],
})
export class ImageCropperComponent implements OnChanges, OnInit {

  private setImageMaxSizeRetries = 0;
  private moveStart?: MoveStart;
  private resizedWhileHidden = false;

  protected readonly moveTypes = MoveTypes;
  protected readonly state = new ImageCropperState();

  safeImgDataUrl?: SafeUrl | string;
  safeTransformStyle?: SafeStyle | string;
  marginLeft: SafeStyle | string = '0px';
  imageVisible = false;

  @ViewChild('wrapper', {static: true}) wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('sourceImage', {static: false}) sourceImage!: ElementRef<HTMLDivElement>;

  @Input() settingsToUpdate?: PartialImageCropperSettings;

  @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
  @Output() startCropImage = new EventEmitter<void>();
  @Output() imageLoaded = new EventEmitter<LoadedImage>();
  @Output() cropperReady = new EventEmitter<Dimensions>();
  @Output() loadImageFailed = new EventEmitter<void>();
  @Output() settingsUpdated = new EventEmitter<ImageCropperSettings>(true);

  @HostBinding('class.disabled') get disbaled() { return this.state.disabled };
  @HostBinding('class.ngx-ic-hidden') get hidden() { return this.state.hidden };
  @HostBinding('style.text-align') get alignImageStyle() { return this.state.alignImage };

  constructor(
    private cropService: CropService,
    private loadImageService: LoadImageService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    @Optional() @Inject(HAMMER_LOADER) private readonly hammerLoader: HammerLoader | null
  ) {
    this.reset();
  }

  ngOnInit(): void {
    void this.activatePinchGesture();
  }

  ngOnChanges(simpleChanges: SimpleChanges): void {    
    const previousCropper = { ...this.state.cropper };
    
    let changes: PartialImageCropperSettings = simpleChanges["settingsToUpdate"].currentValue;
    changes = this.state.getChangesAndUpdateSettings(changes);

    if (Object.keys(changes).length === 0) return;
    
    if (changes.imageSource) {
      this.reset();
      if (Object.keys(changes.imageSource).length) {
        this.loadImageService
        .loadNewImage(this.state)
        .then((res) => this.setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
        return;
      }
    }; 
    
    if (!this.state.loadedImage?.transformed.image.complete) {
      this.settingsUpdated.emit(this.state.getDeepCopyOfSettings());
      return
    };
 
    if ((this.state.containWithinAspectRatio && changes.aspectRatio) || changes.containWithinAspectRatio || changes.canvasRotation) { 
      this.loadImageService
        .transformLoadedImage(this.state.loadedImage, this.state)
        .then((res) => this.setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
      return; 
    }

    let checkCropperWithinBounds = false;
    let crop = false;

    if ((this.state.maintainAspectRatio && changes.aspectRatio) || changes.maintainAspectRatio) {
      cropperSizeBounds.setAllInternalSizes(this.state);
      checkCropperWithinBounds = true;
    } else {
      // I previously said these should be decoupled. I was wrong. If maintain aspect ratio was true in a previous state, both width and height should be checked when there's changes to one side. checkBoundsFollowAspectRatio can rewrite a side and then we're stuck with it unless changed from parent. If in the previous state maintainAspectRatio was false, they can be decoupled. I figure just keep them together. Simpler to read and runtime diff isn't big.
      if (changes.cropperMinWidth || changes.cropperMinHeight) {
        cropperSizeBounds.setInternalMinWidthAndHeight(this.state);
        checkCropperWithinBounds = true;
      }
      if (changes.cropperMaxWidth || changes.cropperMaxHeight) {
        cropperSizeBounds.setInternalMaxWidthAndHeight(this.state);
        checkCropperWithinBounds = true;
      }
      if (changes.cropperStaticWidth || changes.cropperStaticHeight) {
        checkCropperWithinBounds = true;
      }
      if (checkCropperWithinBounds) { // take advantage of this var to see if we need to finish checking bounds
        cropperSizeBounds.setInternalStaticWidthAndHeight(this.state); 
        cropperSizeBounds.checkBoundsFollowAspectRatio(this.state);
      }
    }

    if (changes.cropper) checkCropperWithinBounds = true;

    if (checkCropperWithinBounds) {
      cropperPosition.checkSizeAndPosition(this.state);
      crop = this.state.equalsCropper(previousCropper); 
    }

    if (changes.transform) { 
      this.setCssTransform();
      crop = true;
    }

    if (!changes.hidden) {
      this.settingsUpdated.emit(this.state.getDeepCopyOfSettings());
    }
    
    if (crop || changes.backgroundColor) {
      this.doAutoCrop();
    }

    if (changes.hidden && this.resizedWhileHidden && !this.state.hidden) {
      setTimeout(() => {
        this.onResize();
        this.resizedWhileHidden = false;
      });
    }
  }

  private reset(): void {
    this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
      + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
      + 'AAarVyFEAAAAASUVORK5CYII=';
    this.state.loadedImage = undefined;
    this.state.maxSize = { width: 0, height: 0 };
    this.state.cropper = getCropperInitValue();
    this.imageVisible = false;
  }

  private setLoadedImage(loadedImage: LoadedImage): void {
    this.state.loadedImage = loadedImage;
    this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.objectUrl);
    this.cd.markForCheck();
  }

  loadImageError(error: unknown): void {
    console.error(error);
    this.loadImageFailed.emit();
  }

  private setCssTransform(): void {
    const translateUnit = this.state.transform.translateUnit;
    this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle(
      `translate(${this.state.transform.translateX}${translateUnit}, ${this.state.transform.translateY}${translateUnit})` +
      ' scaleX(' + this.state.transform.scale * (this.state.transform.flipX ? -1 : 1) + ')' +
      ' scaleY(' + this.state.transform.scale * (this.state.transform.flipY ? -1 : 1) + ')' +
      ' rotate(' + this.state.transform.rotate + 'deg)'
    );
  }

  imageLoadedInView(): void {
    if (this.state.loadedImage != null) {
      this.imageLoaded.emit(this.state.loadedImage);
      this.setImageMaxSizeRetries = 0;
      setTimeout(() => this.checkImageMaxSizeRecursively());
    }
  }

  private checkImageMaxSizeRecursively(): void {
    if (this.setImageMaxSizeRetries > 40) {
      this.loadImageFailed.emit();
    } else if (this.sourceImageLoaded()) {
      this.setMaxSize();
      cropperSizeBounds.setAllInternalSizes(this.state);
      cropperPosition.checkSizeAndPosition(this.state);
      this.setCssTransform();
      this.imageVisible = true;
      this.doAutoCrop();
      this.cropperReady.emit({...this.state.maxSize});
      console.log('UPDATING SETTINGS IN CHECK IMAGE SIZE RECURISVELY');
      this.settingsUpdated.emit(this.state.getDeepCopyOfSettings());
      this.cd.markForCheck();
    } else {
      this.setImageMaxSizeRetries++;
      setTimeout(() => this.checkImageMaxSizeRecursively(), 50);
    }
  }

  private sourceImageLoaded(): boolean {
    return this.sourceImage.nativeElement.offsetWidth > 1;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.state.loadedImage) {
      return;
    }
    if (this.state.hidden) {
      this.resizedWhileHidden = true;
    } else {
      const oldMaxSize = {...this.state.maxSize};
      this.setMaxSize();
      if (oldMaxSize.width !== this.state.maxSize.width) {
        cropperPosition.resizeCropperAccordingToNewMaxSize(
          this.state, 
          this.state.maxSize.width / oldMaxSize.width
        );
        cropperSizeBounds.setAllInternalSizes(this.state);
        this.settingsUpdated.emit(this.state.getDeepCopyOfSettings());
        this.cd.markForCheck();
      }
    }
  }

  private async activatePinchGesture() {
    // Loads HammerJS via angular APIs if configured
    await this.hammerLoader?.();

    const Hammer = (window as unknown as (Window & { Hammer?: HammerStatic }))?.['Hammer'] || null;

    if (Hammer) {
      const hammer = new Hammer(this.wrapper.nativeElement);
      hammer.get('pinch').set({enable: true});
      hammer.on('pinchmove', this.onPinch.bind(this));
      hammer.on('pinchend', this.pinchStop.bind(this));
      hammer.on('pinchstart', this.startPinch.bind(this));
    } else if (isDevMode()) {
      console.warn('[NgxImageCropper] Could not find HammerJS - Pinch Gesture won\'t work');
    }
  }

  keyboardAccess(event: KeyboardEvent) {
    this.changeKeyboardStepSize(event);
    this.keyboardMoveCropper(event);
  }

  private changeKeyboardStepSize(event: KeyboardEvent): void {
    const key = +event.key;
    if (key >= 1 && key <= 9) {
      this.state.initialStepSize = key;
    }
  }

  private keyboardMoveCropper(event: KeyboardEvent) {
    const keyboardWhiteList: string[] = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
    if (!(keyboardWhiteList.includes(event.key))) {
      return;
    }
    const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move; //TODO: MoveTypes.Drag?
    const position = event.altKey ? getInvertedPositionForKey(event.key) : getPositionForKey(event.key);
    const moveEvent = getEventForKey(event.key, this.state.initialStepSize);
    event.preventDefault();
    event.stopPropagation();
    this.moveStart = {
      active: true,
      type: moveType,
      position,
      clientX: 0,
      clientY: 0,
      transform: { ...this.state.transform },
      cropper: { ...this.state.cropper }
    };
    this.handleMouseMove(moveEvent);
    this.handleMouseUp();
  }

  startMove(event: Event | BasicEvent, moveType: MoveTypes, position: Position | null = null): void {
    if (this.state.disabled
      || this.moveStart?.active && this.moveStart?.type === MoveTypes.Pinch
      || moveType === MoveTypes.Drag && !this.state.allowMoveImage) {
      return;
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: moveType,
      position,
      clientX: cropperPosition.getClientX(event),
      clientY: cropperPosition.getClientY(event),
      transform: { ...this.state.transform },
      cropper: { ...this.state.cropper }
    };
    this.initMouseMove();
  }

  private initMouseMove(): void {
    merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'touchmove')
    ).pipe(
      takeUntil(merge(
        fromEvent(document, 'mouseup'),
        fromEvent(document, 'touchend')
      ).pipe(first()))
    )
      .subscribe({
        next: (event) => this.zone.run(() => {
          this.handleMouseMove(event);
          this.cd.markForCheck();
        }),
        complete: () => this.zone.run(() => {
          this.handleMouseUp();
          this.cd.markForCheck();
        })
      });
  }

  startPinch(event: HammerInput) {
    if (this.state.disabled || !this.sourceImageLoaded()) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: MoveTypes.Pinch,
      position: 'center',
      clientX: this.state.cropper.x1 + (this.state.cropper.x2 - this.state.cropper.x1) / 2,
      clientY: this.state.cropper.y1 + (this.state.cropper.y2 - this.state.cropper.y1) / 2,
      cropper: { ...this.state.cropper }
    };
  }

  private handleMouseMove(event: Event | BasicEvent): void {
    if (this.moveStart!.active) {
      if ('stopPropagation' in event) {
        event.stopPropagation();
      }
      if ('preventDefault' in event) {
        event.preventDefault();
      }
      if (this.moveStart!.type === MoveTypes.Move) {
        cropperPosition.move(event, this.moveStart!, this.state.cropper);
        cropperPosition.checkWithinMaxSizeBounds(this.state, true);
      } else if (this.moveStart!.type === MoveTypes.Resize) {
        if (!this.state.cropperStaticWidth && !this.state.cropperStaticHeight) {
          cropperPosition.resize(event, this.moveStart!, this.state);
          cropperPosition.checkWithinMaxSizeBounds(this.state, false);
        }
      } else if (this.moveStart!.type === MoveTypes.Drag) {
        const diffX = cropperPosition.getClientX(event) - this.moveStart!.clientX;
        const diffY = cropperPosition.getClientY(event) - this.moveStart!.clientY;
        this.state.transform = {
          ...this.state.transform,
          translateX: (this.moveStart!.transform?.translateX || 0) + diffX,
          translateY: (this.moveStart!.transform?.translateY || 0) + diffY
        };
        this.setCssTransform();
      }
    }
  }

  onPinch(event: HammerInput) {
    if (this.moveStart!.active) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this.moveStart!.type === MoveTypes.Pinch) {
        if (!this.state.cropperStaticWidth && !this.state.cropperStaticHeight) {
          cropperPosition.resize(event, this.moveStart!, this.state);
          cropperPosition.checkWithinMaxSizeBounds(this.state, false);
        }
      }
      this.cd.markForCheck();
    }
  }

  private setMaxSize(): void {
    if (this.sourceImage) {
      const sourceImageStyle = getComputedStyle(this.sourceImage.nativeElement);
      this.state.maxSize.width = parseFloat(sourceImageStyle.width);
      this.state.maxSize.height = parseFloat(sourceImageStyle.height);
      this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.state.maxSize.width / 2 + 'px)');
    }
  }

  private handleMouseUp(): void {
    if (this.moveStart?.active) {
      this.moveStart.active = false;
      if (this.state.equalsCropper(this.moveStart.cropper) || this.state.equalsTransformTranslate(this.moveStart.transform!)) {
        this.settingsUpdated.emit(this.state.getDeepCopyOfSettings());
        this.doAutoCrop();
      }
    }
  }

  pinchStop(): void {
    if (this.moveStart?.active) {
      this.moveStart!.active = false;
      if (this.state.equalsCropper(this.moveStart.cropper) || this.state.equalsTransformTranslate(this.moveStart.transform!)) {
        this.settingsUpdated.emit(this.state.getDeepCopyOfSettings());
        this.doAutoCrop()
      };
    }
  }

  private doAutoCrop(): void {
    if (this.state.autoCrop) {
      void this.crop();
    }
  }

  crop(): ImageCroppedEvent | null;
  crop(output: 'base64'): ImageCroppedEvent | null;
  crop(output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(output: OutputType = this.state.output): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    if (this.state.loadedImage?.transformed?.image != null) {
      this.startCropImage.emit();
      if (output === 'blob') {
        return this.cropToBlob();
      } else if (output === 'base64') {
        return this.cropToBase64();
      }
    }
    return null;
  }

  private cropToBlob(): Promise<ImageCroppedEvent> | null {
    return new Promise((resolve, reject) => this.zone.run(async () => {
      const result = await this.cropService.crop(this.state, 'blob');
      if (result) {
        this.imageCropped.emit(result);
        resolve(result);
      } else {
        reject('Crop image failed');
      }
    }));
  }

  private cropToBase64(): ImageCroppedEvent | null {
    const result = this.cropService.crop(this.state, 'base64');
    if (result) {
      this.imageCropped.emit(result);
      return result;
    }
    return null;
  }
}
