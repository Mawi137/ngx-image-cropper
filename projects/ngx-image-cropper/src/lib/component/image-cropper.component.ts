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
import { CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform, LoadedImage, MoveStart } from '../interfaces';
import { OutputFormat, OutputType } from '../interfaces/cropper-options.interface';
import { CropperSettings } from '../interfaces/cropper.settings';
import { MoveTypes, Position } from '../interfaces/move-start.interface';
import { CropService } from '../services/crop.service';
import { LoadImageService } from '../services/load-image.service';
import { HammerInput, HammerStatic } from '../utils/hammer.utils';
import { getEventForKey, getInvertedPositionForKey, getPositionForKey } from '../utils/keyboard.utils';
import { first, takeUntil } from 'rxjs/operators';
import { fromEvent, merge } from 'rxjs';
import { NgIf } from '@angular/common';
import { BasicEvent } from '../interfaces/basic-event.interface';
import {
  checkCropperSizeRestriction,
  getClientX,
  getClientY,
  moveCropper,
  resizeCropper
} from '../services/cropper-position.utils';

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
  protected readonly settings = new CropperSettings();

  safeImgDataUrl?: SafeUrl | string;
  safeTransformStyle?: SafeStyle | string;
  marginLeft: SafeStyle | string = '0px';
  imageVisible = false;

  @ViewChild('wrapper', {static: true}) wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('sourceImage', {static: false}) sourceImage!: ElementRef<HTMLDivElement>;

  @Input() imageChangedEvent?: Event | null;
  @Input() imageURL?: string;
  @Input() imageBase64?: string;
  @Input() imageFile?: File;
  @Input() imageAltText?: string;

  @Input() cropperFrameAriaLabel?: string;
  @Input() output?: 'blob' | 'base64';
  @Input() format?: OutputFormat;
  @Input() cropper?: CropperPosition;
  @Input() transform?: ImageTransform;
  @Input() maintainAspectRatio?: boolean;
  @Input() aspectRatio?: number;
  @Input() resetCropOnAspectRatioChange?: boolean;
  @Input() resizeToWidth?: number;
  @Input() resizeToHeight?: number;
  @Input() cropperMinWidth?: number;
  @Input() cropperMinHeight?: number;
  @Input() cropperMaxHeight?: number;
  @Input() cropperMaxWidth?: number;
  @Input() cropperStaticWidth?: number;
  @Input() cropperStaticHeight?: number;
  @Input() canvasRotation?: number;
  @Input() initialStepSize?: number;
  @Input() roundCropper?: boolean;
  @Input() onlyScaleDown?: boolean;
  @Input() imageQuality?: number;
  @Input() backgroundColor?: string;
  @Input() containWithinAspectRatio?: boolean;
  @Input() hideResizeSquares?: boolean;
  @Input() allowMoveImage = false;
  @Input() alignImage?: 'left' | 'center';

  @Input() autoCrop = true;

  @HostBinding('class.disabled')
  @Input() disabled = false;
  @HostBinding('class.ngx-ic-hidden')
  @Input() hidden = false;

  @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
  @Output() startCropImage = new EventEmitter<void>();
  @Output() imageLoaded = new EventEmitter<LoadedImage>();
  @Output() cropperReady = new EventEmitter<Dimensions>();
  @Output() loadImageFailed = new EventEmitter<void>();
  @Output() transformChange = new EventEmitter<ImageTransform>();

  @HostBinding('style.text-align')
  get alignImageStyle() {
    return this.settings.alignImage;
  }

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
    this.settings.stepSize = this.initialStepSize || this.settings.stepSize;
    void this.activatePinchGesture();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let {
      checkCropperWithinBounds,
      resetCropper,
      crop
    } = this.settings.setOptionsFromChanges(changes);
    this.onChangesInputImage(changes);

    if (changes['transform']) {
      this.setCssTransform();
    }

    if (!this.settings.loadedImage?.transformed.image.complete) {
      return;
    }

    if ((this.containWithinAspectRatio && changes['aspectRatio']) || changes['containWithinAspectRatio'] || changes['canvasRotation']) {
      this.loadImageService
        .transformLoadedImage(this.settings.loadedImage, this.settings)
        .then((res) => this.setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
      return;
    }

    if (checkCropperWithinBounds) {
      const position = resetCropper
        ? this.checkCropperWithinMaxSizeBounds(
          this.checkCropperWithinCropperSizeBounds(undefined),
          true
        )
        : this.checkCropperWithinCropperSizeBounds(this.cropper);

      if (!this.settings.equalsCropperPosition(position)) {
        this.settings.cropper = position;
        crop = true;
      }
    }

    if (crop) {
      this.doAutoCrop();
    }

    if (changes['hidden'] && this.resizedWhileHidden && !this.hidden) {
      setTimeout(() => {
        this.onResize();
        this.resizedWhileHidden = false;
      });
    }
  }

  private onChangesInputImage(changes: SimpleChanges): void {
    if (changes['imageChangedEvent'] || changes['imageURL'] || changes['imageBase64'] || changes['imageFile']) {
      this.reset();
    }
    if (changes['imageChangedEvent'] && this.isValidImageChangedEvent()) {
      this.loadImageFile(this.imageChangedEvent.target.files[0]);
    }
    if (changes['imageURL'] && this.imageURL) {
      this.loadImageFromURL(this.imageURL);
    }
    if (changes['imageBase64'] && this.imageBase64) {
      this.loadBase64Image(this.imageBase64);
    }
    if (changes['imageFile'] && this.imageFile) {
      this.loadImageFile(this.imageFile);
    }
  }

  private isValidImageChangedEvent(): this is {
    imageChangedEvent: Event & {
      target: { files: FileList };
    }
  } {
    const files = (this.imageChangedEvent as any)?.target?.files;
    return files instanceof FileList && files.length > 0;
  }

  private reset(): void {
    this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
      + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
      + 'AAarVyFEAAAAASUVORK5CYII=';
    this.settings.loadedImage = undefined;
    this.settings.maxSize = undefined;
    this.imageVisible = false;
  }

  private loadImageFile(file: File): void {
    this.loadImageService
      .loadImageFile(file, this.settings)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private loadBase64Image(imageBase64: string): void {
    this.loadImageService
      .loadBase64Image(imageBase64, this.settings)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private loadImageFromURL(url: string): void {
    this.loadImageService
      .loadImageFromURL(url, this.settings)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private setLoadedImage(loadedImage: LoadedImage): void {
    this.settings.loadedImage = loadedImage;
    this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.objectUrl);
    this.cd.markForCheck();
  }

  loadImageError(error: unknown): void {
    console.error(error);
    this.loadImageFailed.emit();
  }

  private setCssTransform(): void {
    const translateUnit = this.settings.transform?.translateUnit || '%';
    this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle(
      `translate(${this.settings.transform.translateH || 0}${translateUnit}, ${this.settings.transform.translateV || 0}${translateUnit})` +
      ' scaleX(' + (this.settings.transform.scale || 1) * (this.settings.transform.flipH ? -1 : 1) + ')' +
      ' scaleY(' + (this.settings.transform.scale || 1) * (this.settings.transform.flipV ? -1 : 1) + ')' +
      ' rotate(' + (this.settings.transform.rotate || 0) + 'deg)'
    );
  }

  imageLoadedInView(): void {
    if (this.settings.loadedImage != null) {
      this.imageLoaded.emit(this.settings.loadedImage);
      this.setImageMaxSizeRetries = 0;
      setTimeout(() => this.checkImageMaxSizeRecursively());
    }
  }

  private checkImageMaxSizeRecursively(): void {
    if (this.setImageMaxSizeRetries > 40) {
      this.loadImageFailed.emit();
    } else if (this.sourceImageLoaded()) {
      this.setMaxSize();
      const cropper = this.cropper && (!this.maintainAspectRatio || this.settings.aspectRatioIsCorrect())
        ? this.cropper
        : undefined;
      this.settings.cropper = this.checkCropperWithinMaxSizeBounds(this.checkCropperWithinCropperSizeBounds(cropper), true);
      this.imageVisible = true;
      this.cropperReady.emit({...this.settings.maxSize!});
      this.doAutoCrop();
      this.cd.markForCheck();
    } else {
      this.setImageMaxSizeRetries++;
      setTimeout(() => this.checkImageMaxSizeRecursively(), 50);
    }
  }

  private sourceImageLoaded(): boolean {
    return this.sourceImage?.nativeElement?.offsetWidth > 1;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.settings.loadedImage) {
      return;
    }
    if (this.hidden) {
      this.resizedWhileHidden = true;
    } else {
      const oldMaxSize = {...this.settings.maxSize!};
      this.setMaxSize();
      this.settings.resizeCropperPosition(oldMaxSize);
      this.cd.markForCheck();
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

  private checkCropperWithinCropperSizeBounds(cropperPosition?: CropperPosition): CropperPosition {
    return checkCropperSizeRestriction(cropperPosition, this.settings);
  }

  keyboardAccess(event: KeyboardEvent) {
    this.changeKeyboardStepSize(event);
    this.keyboardMoveCropper(event);
  }

  private changeKeyboardStepSize(event: KeyboardEvent): void {
    const key = +event.key;
    if (key >= 1 && key <= 9) {
      this.settings.stepSize = key;
    }
  }

  private keyboardMoveCropper(event: KeyboardEvent) {
    const keyboardWhiteList: string[] = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
    if (!(keyboardWhiteList.includes(event.key))) {
      return;
    }
    const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move;
    const position = event.altKey ? getInvertedPositionForKey(event.key) : getPositionForKey(event.key);
    const moveEvent = getEventForKey(event.key, this.settings.stepSize);
    event.preventDefault();
    event.stopPropagation();
    this.startMove({clientX: 0, clientY: 0}, moveType, position);
    this.handleMouseMove(moveEvent);
    this.handleMouseUp();
  }

  startMove(event: Event | BasicEvent, moveType: MoveTypes, position: Position | null = null): void {
    if (this.disabled
      || this.moveStart?.active && this.moveStart?.type === MoveTypes.Pinch
      || moveType === MoveTypes.Drag && !this.allowMoveImage) {
      return;
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: moveType,
      position,
      transform: this.settings.transform,
      clientX: getClientX(event),
      clientY: getClientY(event),
      cropper: this.settings.cropper
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
    if (this.disabled || !this.sourceImageLoaded()) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: MoveTypes.Pinch,
      position: 'center',
      clientX: this.settings.cropper.x1 + (this.settings.cropper.x2 - this.settings.cropper.x1) / 2,
      clientY: this.settings.cropper.y1 + (this.settings.cropper.y2 - this.settings.cropper.y1) / 2,
      cropper: this.settings.cropper
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
        this.settings.cropper = this.checkCropperWithinMaxSizeBounds(
          moveCropper(event, this.moveStart!),
          true
        );
      } else if (this.moveStart!.type === MoveTypes.Resize) {
        if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
          this.settings.cropper = this.checkCropperWithinMaxSizeBounds(
            resizeCropper(event, this.moveStart!, this.settings.cropper, this.settings.maxSize!, this.settings),
            false
          );
        }
      } else if (this.moveStart!.type === MoveTypes.Drag) {
        const diffX = getClientX(event) - this.moveStart!.clientX;
        const diffY = getClientY(event) - this.moveStart!.clientY;
        this.settings.transform = {
          ...this.settings.transform,
          translateH: (this.moveStart!.transform?.translateH || 0) + diffX,
          translateV: (this.moveStart!.transform?.translateV || 0) + diffY
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
        if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
          this.settings.cropper = this.checkCropperWithinMaxSizeBounds(
            resizeCropper(event, this.moveStart!, this.settings.cropper, this.settings.maxSize!, this.settings),
            false
          );
        }
      }
      this.cd.markForCheck();
    }
  }

  private setMaxSize(): void {
    if (this.sourceImage) {
      const sourceImageStyle = getComputedStyle(this.sourceImage.nativeElement);
      this.settings.setMaxSize(parseFloat(sourceImageStyle.width), parseFloat(sourceImageStyle.height));
      this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.settings.maxSize!.width / 2 + 'px)');
    }
  }

  private checkCropperWithinMaxSizeBounds(position: CropperPosition, maintainSize = false): CropperPosition {
    if (position.x1 < 0) {
      position = {
        ...position,
        x1: 0,
        x2: position.x2 - (maintainSize ? position.x1 : 0)
      };
    }
    if (position.y1 < 0) {
      position = {
        ...position,
        y2: position.y2 - (maintainSize ? position.y1 : 0),
        y1: 0
      };
    }
    if (position.x2 > this.settings.maxSize!.width) {
      position = {
        ...position,
        x1: position.x1 - (maintainSize ? (position.x2 - this.settings.maxSize!.width) : 0),
        x2: this.settings.maxSize!.width
      };
    }
    if (position.y2 > this.settings.maxSize!.height) {
      position = {
        ...position,
        y1: position.y1 - (maintainSize ? (position.y2 - this.settings.maxSize!.height) : 0),
        y2: this.settings.maxSize!.height
      };
    }
    return position;
  }

  private handleMouseUp(): void {
    if (this.moveStart?.active) {
      if (!this.settings.equalsCropperPosition(this.moveStart.cropper) || this.moveStart.transform && !this.settings.equalsTransform(this.moveStart.transform)) {
        if (this.moveStart.type === MoveTypes.Drag) {
          this.transformChange.emit(this.settings.transform);
        }
        this.doAutoCrop();
      }
      this.moveStart = undefined;
    }
  }

  pinchStop(): void {
    if (this.moveStart!.active) {
      this.moveStart!.active = false;
      if (!this.settings.equalsCropperPosition(this.moveStart?.cropper!)) {
        this.doAutoCrop();
      }
    }
  }

  private doAutoCrop(): void {
    if (this.autoCrop) {
      void this.crop();
    }
  }

  crop(): ImageCroppedEvent | null;
  crop(output: 'base64'): ImageCroppedEvent | null;
  crop(output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(output: OutputType = this.settings.output): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    if (this.settings.loadedImage?.transformed?.image != null) {
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
      const result = await this.cropService.crop(this.settings, 'blob');
      if (result) {
        this.imageCropped.emit(result);
        resolve(result);
      } else {
        reject('Crop image failed');
      }
    }));
  }

  private cropToBase64(): ImageCroppedEvent | null {
    const result = this.cropService.crop(this.settings, 'base64');
    if (result) {
      this.imageCropped.emit(result);
      return result;
    }
    return null;
  }
}
