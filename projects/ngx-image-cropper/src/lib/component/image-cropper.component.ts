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
import { MoveTypes } from '../interfaces/move-start.interface';
import { CropService } from '../services/crop.service';
import { CropperPositionService } from '../services/cropper-position.service';
import { LoadImageService } from '../services/load-image.service';
import { HammerStatic } from '../utils/hammer.utils';
import { getEventForKey, getInvertedPositionForKey, getPositionForKey } from '../utils/keyboard.utils';
import { first, takeUntil } from 'rxjs/operators';
import { fromEvent, merge } from 'rxjs';

@Component({
  selector: 'image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCropperComponent implements OnChanges, OnInit {
  private settings = new CropperSettings();
  private setImageMaxSizeRetries = 0;
  private moveStart?: MoveStart;
  private loadedImage?: LoadedImage;
  private resizedWhileHidden = false;

  safeImgDataUrl?: SafeUrl | string;
  safeTransformStyle?: SafeStyle | string;
  marginLeft: SafeStyle | string = '0px';
  maxSize: Dimensions = {
    width: 0,
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
  @Input() cropperFrameAriaLabel = this.settings.cropperFrameAriaLabel;
  @Input() output: 'blob' | 'base64' = this.settings.output;
  @Input() format: OutputFormat = this.settings.format;
  @Input() transform = this.settings.transform;
  @Input() maintainAspectRatio = this.settings.maintainAspectRatio;
  @Input() aspectRatio = this.settings.aspectRatio;
  @Input() resetCropOnAspectRatioChange = this.settings.resetCropOnAspectRatioChange;
  @Input() resizeToWidth = this.settings.resizeToWidth;
  @Input() resizeToHeight = this.settings.resizeToHeight;
  @Input() cropperMinWidth = this.settings.cropperMinWidth;
  @Input() cropperMinHeight = this.settings.cropperMinHeight;
  @Input() cropperMaxHeight = this.settings.cropperMaxHeight;
  @Input() cropperMaxWidth = this.settings.cropperMaxWidth;
  @Input() cropperStaticWidth = this.settings.cropperStaticWidth;
  @Input() cropperStaticHeight = this.settings.cropperStaticHeight;
  @Input() canvasRotation = this.settings.canvasRotation;
  @Input() initialStepSize = this.settings.initialStepSize;
  @Input() roundCropper = this.settings.roundCropper;
  @Input() onlyScaleDown = this.settings.onlyScaleDown;
  @Input() imageQuality = this.settings.imageQuality;
  @Input() autoCrop = this.settings.autoCrop;
  @Input() backgroundColor = this.settings.backgroundColor;
  @Input() containWithinAspectRatio = this.settings.containWithinAspectRatio;
  @Input() hideResizeSquares = this.settings.hideResizeSquares;
  @Input() allowMoveImage = false;
  @Input() cropper = this.settings.cropper;
  @HostBinding('style.text-align')
  @Input() alignImage: 'left' | 'center' = this.settings.alignImage;
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


  constructor(
    private cropService: CropService,
    private cropperPositionService: CropperPositionService,
    private loadImageService: LoadImageService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    @Optional() @Inject(HAMMER_LOADER) private readonly hammerLoader: HammerLoader | null
  ) {
    this.reset();
  }

  ngOnChanges(changes: SimpleChanges): void {  
    const oldCropper = { ...this.settings.cropper };
    const oldTransform = { ...this.settings.transform };
    
    this.settings.setOptionsFromChanges(changes);
    this.onChangesInputImage(changes); 

    if (!this.loadedImage?.transformed.image.complete) return; 
 
    if ((this.containWithinAspectRatio && changes["aspectRatio"]) || changes["containWithinAspectRatio"] || changes["canvasRotation"]) { 
      this.loadImageService
        .transformLoadedImage(this.loadedImage, this.settings)
        .then((res) => this.setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
      return; 
    }

    let checkCropperWithinBounds = false;
    let resetCropper = false;
    let crop = false;

    if ((this.maintainAspectRatio && changes["aspectRatio"]) || changes["maintainAspectRatio"]) {
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
      if (this.maintainAspectRatio && (this.resetCropOnAspectRatioChange || !this.aspectRatioIsCorrect())) {
        checkCropperWithinBounds = true;
        resetCropper = true;
        //TODO(loiddy): cropper could have the correct aspect ratio but not be within cropper size bounds (fixed in future PR).
      }
    } else {
      if (changes["cropperMinWidth"] || changes["cropperMinHeight"]) {
        this.setCropperScaledMinSize();
        checkCropperWithinBounds = true;
      }
      if (changes["cropperMaxWidth"] || changes["cropperMaxHeight"]) {
        this.setCropperScaledMaxSize();
        checkCropperWithinBounds = true;
      }
      if (changes["cropperStaticWidth"] || changes["cropperStaticHeight"]) {
        checkCropperWithinBounds = true;
      }
      //TODO(loiddy): decouple min, max and static sizes. app should be able to respond to changes individually too (also have only one static side) (fixed in future PR).
    }

    if (changes["cropper"]) checkCropperWithinBounds = true;

    if (checkCropperWithinBounds) {
      this.checkCropperWithinCropperSizeBounds(resetCropper);
      this.checkCropperWithinMaxSizeBounds(true);
      crop = this.cropperPositionService.isNewPosition(oldCropper, this.cropper);
    }

    if (changes["transform"]) {
      if (this.imagePositionIsNewTransform(oldTransform, this.transform)) {
        this.setCssTransform();
        crop = true;
      }
    }

    if (crop || changes["backgroundColor"]) {
      this.doAutoCrop();
    }

    //TODO: if a new img tires to load to view when hidden, loadImageFailed event is triggered. I vote developers handle this. From parent it's solved by disabeling or hiding the new source img inputs while the app is hidden. Here it's more complicated. 
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

  private isValidImageChangedEvent(): boolean {
    return this.imageChangedEvent?.target?.files?.length > 0;
  }

  private setCssTransform() {
    const translateUnit = this.transform?.translateUnit || '%';
    this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle(
      `translate(${this.transform.translateH || 0}${translateUnit}, ${this.transform.translateV || 0}${translateUnit})` +
      ' scaleX(' + (this.transform.scale || 1) * (this.transform.flipH ? -1 : 1) + ')' +
      ' scaleY(' + (this.transform.scale || 1) * (this.transform.flipV ? -1 : 1) + ')' +
      ' rotate(' + (this.transform.rotate || 0) + 'deg)'
    );
  }

  ngOnInit(): void {
    this.settings.stepSize = this.initialStepSize;
    this.activatePinchGesture();
  }

  private reset(): void {
    this.imageVisible = false;
    this.loadedImage = undefined;
    this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
      + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
      + 'AAarVyFEAAAAASUVORK5CYII=';
    this.maxSize = {
      width: 0,
      height: 0
    };
    this.cropper.x1 = 0;
    this.cropper.y1 = 0;
    this.cropper.x2 = 0;
    this.cropper.y2 = 0;
    this.moveStart = {
      active: false,
      type: null,
      position: null,
      clientX: 0,
      clientY: 0,
      cropper: {...this.cropper},
    };
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
    this.loadedImage = loadedImage;
    this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.objectUrl);
    this.cd.markForCheck();
  }

  public loadImageError(error: any): void {
    console.error(error);
    this.loadImageFailed.emit();
  }

  imageLoadedInView(): void {
    if (this.loadedImage != null) {
      this.imageLoaded.emit(this.loadedImage);
      this.setImageMaxSizeRetries = 0;
      setTimeout(() => this.checkImageMaxSizeRecursively());
    }
  }

  private checkImageMaxSizeRecursively(): void {
    if (this.setImageMaxSizeRetries > 40) {
      this.loadImageFailed.emit();
    } else if (this.sourceImageLoaded()) {
      this.setMaxSize();
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
      this.checkCropperWithinCropperSizeBounds(true);
      //TODO(loiddy): add checkCropperWithinMaxSizeBounds when resetCropper and x2=0 is fully implemented. 
      this.setCssTransform();
      this.imageVisible = true;
      this.doAutoCrop();
      this.cropperReady.emit({...this.maxSize});
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
    if (!this.loadedImage) {
      return;
    }
    if (this.hidden) {
      this.resizedWhileHidden = true;
    } else {
      const oldMaxSize = {...this.maxSize};
      this.setMaxSize();
      this.resizeCropperPosition(oldMaxSize);
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
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

  private resizeCropperPosition(oldMaxSize: Dimensions): void {
    if (oldMaxSize.width !== this.maxSize.width || oldMaxSize.height !== this.maxSize.height) {
      this.cropper.x1 = this.cropper.x1 * this.maxSize.width / oldMaxSize.width;
      this.cropper.x2 = this.cropper.x2 * this.maxSize.width / oldMaxSize.width;
      this.cropper.y1 = this.cropper.y1 * this.maxSize.height / oldMaxSize.height;
      this.cropper.y2 = this.cropper.y2 * this.maxSize.height / oldMaxSize.height;
    }
  }

  checkCropperWithinCropperSizeBounds(resetCropper: boolean): void {
    this.cropperPositionService.checkWithinCropperSizeBounds(this.cropper, this.settings, this.maxSize, resetCropper);
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

  private keyboardMoveCropper(event: any) {
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

  startMove(event: any, moveType: MoveTypes, position: string | null = null): void {
    if (this.disabled
      || this.moveStart?.active && this.moveStart?.type === MoveTypes.Pinch
      || moveType === MoveTypes.Drag && !this.allowMoveImage) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: moveType,
      position,
      transform: {...this.transform},
      clientX: this.cropperPositionService.getClientX(event),
      clientY: this.cropperPositionService.getClientY(event),
      cropper: {...this.cropper}
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

  startPinch(event: any) {
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
      clientX: this.cropper.x1 + (this.cropper.x2 - this.cropper.x1) / 2,
      clientY: this.cropper.y1 + (this.cropper.y2 - this.cropper.y1) / 2,
      cropper: {...this.cropper}
    };
  }

  private handleMouseMove(event: any): void {
    if (this.moveStart!.active) {
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this.moveStart!.type === MoveTypes.Move) {
        this.cropperPositionService.move(event, this.moveStart!, this.cropper);
        this.checkCropperWithinMaxSizeBounds(true);
      } else if (this.moveStart!.type === MoveTypes.Resize) {
        if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
          this.cropperPositionService.resize(event, this.moveStart!, this.cropper, this.maxSize, this.settings);
          this.checkCropperWithinMaxSizeBounds(false);
        }
      } else if (this.moveStart!.type === MoveTypes.Drag) {
        const diffX = this.cropperPositionService.getClientX(event) - this.moveStart!.clientX;
        const diffY = this.cropperPositionService.getClientY(event) - this.moveStart!.clientY;
        this.transform = {
          ...this.transform,
          translateH: (this.moveStart!.transform?.translateH || 0) + diffX,
          translateV: (this.moveStart!.transform?.translateV || 0) + diffY
        };
        this.setCssTransform();
      }
    }
  }

  onPinch(event: any) {
    if (this.moveStart!.active) {
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this.moveStart!.type === MoveTypes.Pinch) {
        if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
          this.cropperPositionService.resize(event, this.moveStart!, this.cropper, this.maxSize, this.settings);
          this.checkCropperWithinMaxSizeBounds(false);
        }
      }
      this.cd.markForCheck();
    }
  }

  private setMaxSize(): void {
    if (this.sourceImage) {
      const sourceImageStyle = getComputedStyle(this.sourceImage.nativeElement);
      this.maxSize.width = parseFloat(sourceImageStyle.width);
      this.maxSize.height = parseFloat(sourceImageStyle.height);
      this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    }
  }

  private setCropperScaledMinSize(): void {
    if (this.loadedImage?.transformed?.image) {
      this.setCropperScaledMinWidth();
      this.setCropperScaledMinHeight();
    } else {
      this.settings.cropperScaledMinWidth = 20;
      this.settings.cropperScaledMinHeight = 20;
    }
  }

  private setCropperScaledMinWidth(): void {
    this.settings.cropperScaledMinWidth = this.cropperMinWidth > 0
      ? Math.max(20, this.cropperMinWidth / this.loadedImage!.transformed.image.width * this.maxSize.width)
      : 20;
  }

  private setCropperScaledMinHeight(): void {
    if (this.maintainAspectRatio) {
      this.settings.cropperScaledMinHeight = Math.max(20, this.settings.cropperScaledMinWidth / this.aspectRatio);
    } else if (this.cropperMinHeight > 0) {
      this.settings.cropperScaledMinHeight = Math.max(
        20,
        this.cropperMinHeight / this.loadedImage!.transformed.image.height * this.maxSize.height
      );
    } else {
      this.settings.cropperScaledMinHeight = 20;
    }
  }

  private setCropperScaledMaxSize(): void {
    if (this.loadedImage?.transformed?.image) {
      const ratio = this.loadedImage.transformed.size.width / this.maxSize.width;
      this.settings.cropperScaledMaxWidth = this.cropperMaxWidth > 20 ? this.cropperMaxWidth / ratio : this.maxSize.width;
      this.settings.cropperScaledMaxHeight = this.cropperMaxHeight > 20 ? this.cropperMaxHeight / ratio : this.maxSize.height;
      if (this.maintainAspectRatio) {
        if (this.settings.cropperScaledMaxWidth > this.settings.cropperScaledMaxHeight * this.aspectRatio) {
          this.settings.cropperScaledMaxWidth = this.settings.cropperScaledMaxHeight * this.aspectRatio;
        } else if (this.settings.cropperScaledMaxWidth < this.settings.cropperScaledMaxHeight * this.aspectRatio) {
          this.settings.cropperScaledMaxHeight = this.settings.cropperScaledMaxWidth / this.aspectRatio;
        }
      }
    } else {
      this.settings.cropperScaledMaxWidth = this.maxSize.width;
      this.settings.cropperScaledMaxHeight = this.maxSize.height;
    }
  }

  private checkCropperWithinMaxSizeBounds(maintainSize = false): void {
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

  private handleMouseUp(): void {
    if (this.moveStart!.active) {
      this.moveStart!.active = false;
      if (this.isNewPosition(this.moveStart?.cropper!, this.moveStart?.transform)) {
        if (this.moveStart?.type === MoveTypes.Drag) this.transformChange.emit(this.transform);
        this.doAutoCrop();
      }
    }
  }

  pinchStop(): void {
    if (this.moveStart!.active) {
      this.moveStart!.active = false;
      if (this.isNewPosition(this.moveStart?.cropper!)) this.doAutoCrop();
    }
  }

  private isNewPosition(oldCropper: CropperPosition, oldTransform?: ImageTransform){
    if (oldTransform && this.imagePositionIsNewPosition(oldTransform, this.transform)) return true;
    if (this.cropperPositionService.isNewPosition(oldCropper, this.cropper)) return true;
    return false;
  }

  // TODO:(loiddy) move to image pos serivice when added.
  private imagePositionIsNewPosition(oldTransform: ImageTransform, newTransform: ImageTransform){
    if ((oldTransform.translateH ?? 0) !== (newTransform.translateH ?? 0)) return true;
    if ((oldTransform.translateV ?? 0) !== (newTransform.translateV ?? 0)) return true;
    return false;
  }
  private imagePositionIsNewTransform(oldTransform: ImageTransform, newTransform: ImageTransform){
    if (this.imagePositionIsNewPosition(oldTransform, newTransform)) return true;
    if ((oldTransform.scale ?? 1) !== (newTransform.scale ?? 1)) return true;
    if ((oldTransform.rotate ?? 0) !== (newTransform.rotate ?? 0)) return true;
    if ((oldTransform.flipH ?? false) !== (newTransform.flipH ?? false)) return true;
    if ((oldTransform.flipV ?? false) !== (newTransform.flipV ?? false)) return true;
    return false;
  }

  private doAutoCrop(): void {
    this.settings.cropper = { ...this.cropper };
    this.settings.transform = { ...this.transform };
    if (this.autoCrop) {
      void this.crop();
    }
  }

  crop(): ImageCroppedEvent | null;
  crop(output: 'base64'): ImageCroppedEvent | null;
  crop(output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(output: OutputType = this.settings.output): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    if (this.loadedImage?.transformed?.image != null) {
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
      const result = await this.cropService.crop(this.loadedImage!, this.cropper, this.settings, 'blob', this.maxSize);
      if (result) {
        this.imageCropped.emit(result);
        resolve(result);
      } else {
        reject('Crop image failed');
      }
    }));
  }

  private cropToBase64(): ImageCroppedEvent | null {
    const result = this.cropService.crop(this.loadedImage!, this.cropper, this.settings, 'base64', this.maxSize);
    if (result) {
      this.imageCropped.emit(result);
      return result;
    }
    return null;
  }

  private aspectRatioIsCorrect(): boolean {
    const currentCropAspectRatio = (this.cropper.x2 - this.cropper.x1) / (this.cropper.y2 - this.cropper.y1);
    return currentCropAspectRatio === this.aspectRatio;
  }
}
