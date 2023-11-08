import {
  ChangeDetectorRef,
  Directive,
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
import {
  CropperPosition,
  CropperSettings,
  Dimensions,
  ImageCroppedEvent,
  ImageTransform,
  LoadedImage,
  MoveStart,
  OutputFormat
} from '../interfaces';
import {DomSanitizer, HAMMER_LOADER, HammerLoader, SafeStyle, SafeUrl} from '@angular/platform-browser';
import {MoveTypes} from '../interfaces/move-start.interface';
import {CropService} from '../services/crop.service';
import {CropperPositionService} from '../services/cropper-position.service';
import {LoadImageService} from '../services/load-image.service';
import {HammerStatic} from '../utils/hammer.utils';
import {getEventForKey, getInvertedPositionForKey, getPositionForKey} from '../utils/keyboard.utils';
import {fromEvent, merge} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';
import {OutputType} from '../interfaces/cropper-options.interface';

@Directive()
export abstract class AbstractImageCropperDirective implements OnChanges, OnInit {
  private _settings = new CropperSettings();
  private _setImageMaxSizeRetries = 0;
  private _moveStart?: MoveStart;
  private _loadedImage?: LoadedImage;
  private _resizedWhileHidden = false;

  safeImgDataUrl?: SafeUrl | string;
  safeTransformStyle?: SafeStyle | string;
  marginLeft: SafeStyle | string = '0px';
  maxSize: Dimensions = {
    width : 0,
    height: 0
  };
  moveTypes = MoveTypes;
  imageVisible = false;

  @ViewChild('wrapper', {static: true}) wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('sourceImage', {static: false}) sourceImage!: ElementRef<HTMLDivElement>;

  @Input() imageChangedEvent?: any;
  @Input() imageURL?: string;
  @Input() imageBase64?: string;
  @Input() imageFile?: File;
  @Input() imageAltText?: string;
  @Input() cropperFrameAriaLabel = this._settings.cropperFrameAriaLabel;
  @Input() output: 'blob' | 'base64' = this._settings.output;
  @Input() format: OutputFormat = this._settings.format;
  @Input() transform: ImageTransform = {};
  @Input() maintainAspectRatio = this._settings.maintainAspectRatio;
  @Input() aspectRatio = this._settings.aspectRatio;
  @Input() resetCropOnAspectRatioChange = this._settings.resetCropOnAspectRatioChange;
  @Input() resizeToWidth = this._settings.resizeToWidth;
  @Input() resizeToHeight = this._settings.resizeToHeight;
  @Input() cropperMinWidth = this._settings.cropperMinWidth;
  @Input() cropperMinHeight = this._settings.cropperMinHeight;
  @Input() cropperMaxHeight = this._settings.cropperMaxHeight;
  @Input() cropperMaxWidth = this._settings.cropperMaxWidth;
  @Input() cropperStaticWidth = this._settings.cropperStaticWidth;
  @Input() cropperStaticHeight = this._settings.cropperStaticHeight;
  @Input() canvasRotation = this._settings.canvasRotation;
  @Input() initialStepSize = this._settings.initialStepSize;
  @Input() roundCropper = this._settings.roundCropper;
  @Input() onlyScaleDown = this._settings.onlyScaleDown;
  @Input() imageQuality = this._settings.imageQuality;
  @Input() autoCrop = this._settings.autoCrop;
  @Input() backgroundColor = this._settings.backgroundColor;
  @Input() containWithinAspectRatio = this._settings.containWithinAspectRatio;
  @Input() hideResizeSquares = this._settings.hideResizeSquares;
  @Input() allowMoveImage = false;
  @Input() cropper: CropperPosition = {
    x1: -100,
    y1: -100,
    x2: 10000,
    y2: 10000
  };
  @HostBinding('style.text-align')
  @Input() alignImage: 'left' | 'center' = this._settings.alignImage;
  @HostBinding('class.disabled')
  @Input() disabled = false;
  @HostBinding('class.ngx-ix-hidden')
  @Input() hidden = false;

  @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
  @Output() startCropImage = new EventEmitter<void>();
  @Output() imageLoaded = new EventEmitter<LoadedImage>();
  @Output() cropperReady = new EventEmitter<Dimensions>();
  @Output() loadImageFailed = new EventEmitter<void>();
  @Output() transformChange = new EventEmitter<ImageTransform>();

  constructor(
    protected _cropService: CropService,
    protected _cropperPositionService: CropperPositionService,
    protected _loadImageService: LoadImageService,
    protected _sanitizer: DomSanitizer,
    protected _cd: ChangeDetectorRef,
    protected _zone: NgZone,
    @Optional() @Inject(HAMMER_LOADER) private readonly _hammerLoader: HammerLoader | null
  ) {
    this._reset();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._onChangesUpdateSettings(changes);
    this._onChangesInputImage(changes);

    if (this._loadedImage?.original.image.complete && (changes['containWithinAspectRatio'] || changes['canvasRotation'])) {
      this._loadImageService
          .transformLoadedImage(this._loadedImage, this._settings)
          .then((res) => this._setLoadedImage(res))
          .catch((err) => this.loadImageError(err));
    }
    if (changes['cropper'] || changes['maintainAspectRatio'] || changes['aspectRatio']) {
      this._setMaxSize();
      this._setCropperScaledMinSize();
      this._setCropperScaledMaxSize();
      if (
        this.maintainAspectRatio &&
        (this.resetCropOnAspectRatioChange || !this._aspectRatioIsCorrect()) &&
        (changes['maintainAspectRatio'] || changes['aspectRatio'])
      ) {
        this.resetCropperPosition();
      } else if (changes['cropper']) {
        this._checkCropperPosition(false);
        this._doAutoCrop();
      }
    }
    if (changes['transform']) {
      this.transform = this.transform || {};
      this._setCssTransform();
      this._doAutoCrop();
    }
    if (changes['hidden'] && this._resizedWhileHidden && !this.hidden) {
      setTimeout(() => {
        this.onResize();
        this._resizedWhileHidden = false;
      });
    }
  }

  protected _onChangesUpdateSettings(changes: SimpleChanges) {
    this._settings.setOptionsFromChanges(changes);

    if (this._settings.cropperStaticHeight && this._settings.cropperStaticWidth) {
      this.hideResizeSquares = true;
      this._settings.setOptions({
        hideResizeSquares  : true,
        cropperMinWidth    : this._settings.cropperStaticWidth,
        cropperMinHeight   : this._settings.cropperStaticHeight,
        cropperMaxHeight   : this._settings.cropperStaticHeight,
        cropperMaxWidth    : this._settings.cropperStaticWidth,
        maintainAspectRatio: false
      });
    }
  }

  protected _onChangesInputImage(changes: SimpleChanges): void {
    if (changes['imageChangedEvent'] || changes['imageURL'] || changes['imageBase64'] || changes['imageFile']) {
      this._reset();
    }
    if (changes['imageChangedEvent'] && this._isValidImageChangedEvent()) {
      this._loadImageFile(this.imageChangedEvent.target.files[0]);
    }
    if (changes['imageURL'] && this.imageURL) {
      this._loadImageFromURL(this.imageURL);
    }
    if (changes['imageBase64'] && this.imageBase64) {
      this._loadBase64Image(this.imageBase64);
    }
    if (changes['imageFile'] && this.imageFile) {
      this._loadImageFile(this.imageFile);
    }
  }

  protected _isValidImageChangedEvent(): boolean {
    return this.imageChangedEvent?.target?.files?.length > 0;
  }

  protected _setCssTransform() {
    const translateUnit = this.transform?.translateUnit || '%';
    this.safeTransformStyle = this._sanitizer.bypassSecurityTrustStyle(
      `translate(${this.transform.translateH || 0}${translateUnit}, ${this.transform.translateV || 0}${translateUnit})` +
      ' scaleX(' + (this.transform.scale || 1) * (this.transform.flipH ? -1 : 1) + ')' +
      ' scaleY(' + (this.transform.scale || 1) * (this.transform.flipV ? -1 : 1) + ')' +
      ' rotate(' + (this.transform.rotate || 0) + 'deg)'
    );
  }

  ngOnInit(): void {
    this._settings.stepSize = this.initialStepSize;
    this._activatePinchGesture();
  }

  protected _reset(): void {
    this.imageVisible = false;
    this._loadedImage = undefined;
    this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
      + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
      + 'AAarVyFEAAAAASUVORK5CYII=';
    this._moveStart = {
      active  : false,
      type    : null,
      position: null,
      x1      : 0,
      y1      : 0,
      x2      : 0,
      y2      : 0,
      clientX : 0,
      clientY : 0
    };
    this.maxSize = {
      width : 0,
      height: 0
    };
    this.cropper.x1 = -100;
    this.cropper.y1 = -100;
    this.cropper.x2 = 10000;
    this.cropper.y2 = 10000;
  }

  protected _loadImageFile(file: File): void {
    this._loadImageService
        .loadImageFile(file, this._settings)
        .then((res) => this._setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
  }

  protected _loadBase64Image(imageBase64: string): void {
    this._loadImageService
        .loadBase64Image(imageBase64, this._settings)
        .then((res) => this._setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
  }

  protected _loadImageFromURL(url: string): void {
    this._loadImageService
        .loadImageFromURL(url, this._settings)
        .then((res) => this._setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
  }

  protected _setLoadedImage(loadedImage: LoadedImage): void {
    this._loadedImage = loadedImage;
    this.safeImgDataUrl = this._sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.objectUrl);
    this._cd.markForCheck();
  }

  public loadImageError(error: any): void {
    if (isDevMode()) {
      console.error(error)
    }
    this.loadImageFailed.emit();
  }

  public imageLoadedInView(): void {
    if (this._loadedImage != null) {
      this.imageLoaded.emit(this._loadedImage);
      this._setImageMaxSizeRetries = 0;
      setTimeout(() => this._checkImageMaxSizeRecursively());
    }
  }

  protected _checkImageMaxSizeRecursively(): void {
    if (this._setImageMaxSizeRetries > 40) {
      this.loadImageFailed.emit();
    } else if (this._sourceImageLoaded()) {
      this._setMaxSize();
      this._setCropperScaledMinSize();
      this._setCropperScaledMaxSize();
      this.resetCropperPosition();
      this.cropperReady.emit({...this.maxSize});
      this._cd.markForCheck();
    } else {
      this._setImageMaxSizeRetries++;
      setTimeout(() => this._checkImageMaxSizeRecursively(), 50);
    }
  }

  protected _sourceImageLoaded(): boolean {
    return this.sourceImage?.nativeElement?.offsetWidth > 0;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this._loadedImage) {
      return;
    }
    if (this.hidden) {
      this._resizedWhileHidden = true;
    } else {
      const oldMaxSize = {...this.maxSize};
      this._setMaxSize();
      this._resizeCropperPosition(oldMaxSize);
      this._setCropperScaledMinSize();
      this._setCropperScaledMaxSize();
    }
  }

  protected async _activatePinchGesture() {
    // Loads HammerJS via angular APIs if configured
    await this._hammerLoader?.();

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

  protected _resizeCropperPosition(oldMaxSize: Dimensions): void {
    if (oldMaxSize.width !== this.maxSize.width || oldMaxSize.height !== this.maxSize.height) {
      this.cropper.x1 = this.cropper.x1 * this.maxSize.width / oldMaxSize.width;
      this.cropper.x2 = this.cropper.x2 * this.maxSize.width / oldMaxSize.width;
      this.cropper.y1 = this.cropper.y1 * this.maxSize.height / oldMaxSize.height;
      this.cropper.y2 = this.cropper.y2 * this.maxSize.height / oldMaxSize.height;
    }
  }

  public resetCropperPosition(): void {
    this._cropperPositionService.resetCropperPosition(this.sourceImage, this.cropper, this._settings, this.maxSize);
    this._doAutoCrop();
    this.imageVisible = true;
  }

  public keyboardAccess(event: KeyboardEvent) {
    this._changeKeyboardStepSize(event);
    this._keyboardMoveCropper(event);
  }

  protected _changeKeyboardStepSize(event: KeyboardEvent): void {
    const key = +event.key;
    if (key >= 1 && key <= 9) {
      this._settings.stepSize = key;
    }
  }

  protected _keyboardMoveCropper(event: any) {
    const keyboardWhiteList: string[] = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
    if (!(keyboardWhiteList.includes(event.key))) {
      return;
    }
    const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move;
    const position = event.altKey ? getInvertedPositionForKey(event.key) : getPositionForKey(event.key);
    const moveEvent = getEventForKey(event.key, this._settings.stepSize);
    event.preventDefault();
    event.stopPropagation();
    this.startMove({clientX: 0, clientY: 0}, moveType, position);
    this._handleMouseMove(moveEvent);
    this._handleMouseUp();
  }

  startMove(event: any, moveType: MoveTypes, position: string | null = null): void {
    if (this.disabled
      || this._moveStart?.active && this._moveStart?.type === MoveTypes.Pinch
      || moveType === MoveTypes.Drag && !this.allowMoveImage) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this._moveStart = {
      active   : true,
      type     : moveType,
      position,
      transform: {...this.transform},
      clientX  : this._cropperPositionService.getClientX(event),
      clientY  : this._cropperPositionService.getClientY(event),
      ...this.cropper
    };
    this._initMouseMove();
  }

  protected _initMouseMove(): void {
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
       next    : (event) => this._zone.run(() => {
         this._handleMouseMove(event);
         this._cd.markForCheck();
       }),
       complete: () => this._zone.run(() => {
         this._handleMouseUp();
         this._cd.markForCheck();
       })
     });
  }

  public startPinch(event: any) {
    if (!this.safeImgDataUrl) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this._moveStart = {
      active  : true,
      type    : MoveTypes.Pinch,
      position: 'center',
      clientX : this.cropper.x1 + (this.cropper.x2 - this.cropper.x1) / 2,
      clientY : this.cropper.y1 + (this.cropper.y2 - this.cropper.y1) / 2,
      ...this.cropper
    };
  }

  protected _handleMouseMove(event: any): void {
    if (this._moveStart!.active) {
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this._moveStart!.type === MoveTypes.Move) {
        this._cropperPositionService.move(event, this._moveStart!, this.cropper);
        this._checkCropperPosition(true);
      } else if (this._moveStart!.type === MoveTypes.Resize) {
        if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
          this._cropperPositionService.resize(event, this._moveStart!, this.cropper, this.maxSize, this._settings);
        }
        this._checkCropperPosition(false);
      } else if (this._moveStart!.type === MoveTypes.Drag) {
        const diffX = this._cropperPositionService.getClientX(event) - this._moveStart!.clientX;
        const diffY = this._cropperPositionService.getClientY(event) - this._moveStart!.clientY;
        this.transform = {
          ...this.transform,
          translateH: (this._moveStart!.transform?.translateH || 0) + diffX,
          translateV: (this._moveStart!.transform?.translateV || 0) + diffY
        };
        this._setCssTransform();
      }
    }
  }

  public onPinch(event: any) {
    if (this._moveStart!.active) {
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this._moveStart!.type === MoveTypes.Pinch) {
        this._cropperPositionService.resize(event, this._moveStart!, this.cropper, this.maxSize, this._settings);
        this._checkCropperPosition(false);
      }
      this._cd.markForCheck();
    }
  }

  protected _setMaxSize(): void {
    if (this.sourceImage) {
      const sourceImageStyle = getComputedStyle(this.sourceImage.nativeElement);
      this.maxSize.width = parseFloat(sourceImageStyle.width);
      this.maxSize.height = parseFloat(sourceImageStyle.height);
      this.marginLeft = this._sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    }
  }

  protected _setCropperScaledMinSize(): void {
    if (this._loadedImage?.transformed?.image) {
      this._setCropperScaledMinWidth();
      this._setCropperScaledMinHeight();
    } else {
      this._settings.cropperScaledMinWidth = 20;
      this._settings.cropperScaledMinHeight = 20;
    }
  }

  protected _setCropperScaledMinWidth(): void {
    this._settings.cropperScaledMinWidth = this.cropperMinWidth > 0
      ? Math.max(20, this.cropperMinWidth / this._loadedImage!.transformed.image.width * this.maxSize.width)
      : 20;
  }

  protected _setCropperScaledMinHeight(): void {
    if (this.maintainAspectRatio) {
      this._settings.cropperScaledMinHeight = Math.max(20, this._settings.cropperScaledMinWidth / this.aspectRatio);
    } else if (this.cropperMinHeight > 0) {
      this._settings.cropperScaledMinHeight = Math.max(
        20,
        this.cropperMinHeight / this._loadedImage!.transformed.image.height * this.maxSize.height
      );
    } else {
      this._settings.cropperScaledMinHeight = 20;
    }
  }

  protected _setCropperScaledMaxSize(): void {
    if (this._loadedImage?.transformed?.image) {
      const ratio = this._loadedImage.transformed.size.width / this.maxSize.width;
      this._settings.cropperScaledMaxWidth = this.cropperMaxWidth > 20 ? this.cropperMaxWidth / ratio : this.maxSize.width;
      this._settings.cropperScaledMaxHeight = this.cropperMaxHeight > 20 ? this.cropperMaxHeight / ratio : this.maxSize.height;
      if (this.maintainAspectRatio) {
        if (this._settings.cropperScaledMaxWidth > this._settings.cropperScaledMaxHeight * this.aspectRatio) {
          this._settings.cropperScaledMaxWidth = this._settings.cropperScaledMaxHeight * this.aspectRatio;
        } else if (this._settings.cropperScaledMaxWidth < this._settings.cropperScaledMaxHeight * this.aspectRatio) {
          this._settings.cropperScaledMaxHeight = this._settings.cropperScaledMaxWidth / this.aspectRatio;
        }
      }
    } else {
      this._settings.cropperScaledMaxWidth = this.maxSize.width;
      this._settings.cropperScaledMaxHeight = this.maxSize.height;
    }
  }

  protected _checkCropperPosition(maintainSize = false): void {
    if (this.cropper.x1 < 0) {
      this.cropper.x2 -= maintainSize ? this.cropper.x1 : 0;
      this.cropper.x1 = 0;
    }
    if (this.cropper.y1 < 0) {
      this.cropper.y2 -= maintainSize ? this.cropper.y1 : 0;
      this.cropper.y1 = 0;
    }
    if (this.cropper.x2 > this.maxSize.width) {
      this.cropper.x1 -= maintainSize ? (this.cropper.x2 - this.maxSize.width) : 0;
      this.cropper.x2 = this.maxSize.width;
    }
    if (this.cropper.y2 > this.maxSize.height) {
      this.cropper.y1 -= maintainSize ? (this.cropper.y2 - this.maxSize.height) : 0;
      this.cropper.y2 = this.maxSize.height;
    }
  }

  protected _handleMouseUp(): void {
    if (this._moveStart!.active) {
      this._moveStart!.active = false;
      if (this._moveStart?.type === MoveTypes.Drag) {
        this.transformChange.emit(this.transform);
      } else {
        this._doAutoCrop();
      }
    }
  }

  pinchStop(): void {
    if (this._moveStart!.active) {
      this._moveStart!.active = false;
      this._doAutoCrop();
    }
  }

  protected _doAutoCrop(): void {
    if (this.autoCrop) {
      void this.crop();
    }
  }

  crop(): ImageCroppedEvent | null;
  crop(output: 'base64'): ImageCroppedEvent | null;
  crop(output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(output: OutputType = this._settings.output): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    if (this._loadedImage?.transformed?.image != null) {
      this.startCropImage.emit();
      if (output === 'blob') {
        return this._cropToBlob();
      } else if (output === 'base64') {
        return this._cropToBase64();
      }
    }
    return null;
  }

  protected _cropToBlob(): Promise<ImageCroppedEvent> | null {
    return new Promise((resolve, reject) => this._zone.run(async () => {
      const result = await this._cropService.crop(this._loadedImage!, this.cropper, this._settings, 'blob', this.maxSize);
      if (result) {
        this.imageCropped.emit(result);
        resolve(result);
      } else {
        reject('Crop image failed');
      }
    }));
  }

  protected _cropToBase64(): ImageCroppedEvent | null {
    const result = this._cropService.crop(this._loadedImage!, this.cropper, this._settings, 'base64', this.maxSize);
    if (result) {
      this.imageCropped.emit(result);
      return result;
    }
    return null;
  }

  protected _aspectRatioIsCorrect(): boolean {
    const currentCropAspectRatio = (this.cropper.x2 - this.cropper.x1) / (this.cropper.y2 - this.cropper.y1);
    return currentCropAspectRatio === this.aspectRatio;
  }
}
