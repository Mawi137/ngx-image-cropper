import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeUrl } from '@angular/platform-browser';
import {
  CropperOptions,
  CropperPosition,
  Dimensions,
  ImageCroppedEvent,
  ImageTransform,
  LoadedImage,
  MoveStart
} from '../interfaces';
import { OutputFormat, OutputType } from '../interfaces/cropper-options.interface';
import { CropperState } from './cropper.state';
import { MoveTypes, Position } from '../interfaces/move-start.interface';
import { CropService } from '../services/crop.service';
import { LoadImageService } from '../services/load-image.service';
import { getEventForKey, getInvertedPositionForKey, getPositionForKey } from '../utils/keyboard.utils';
import { first, takeUntil } from 'rxjs/operators';
import { fromEvent, merge, Subject } from 'rxjs';
import { NgIf } from '@angular/common';
import { BasicEvent } from '../interfaces/basic-event.interface';
import {
  checkCropperPosition,
  checkCropperWithinMaxSizeBounds,
  getClientX,
  getClientY,
  moveCropper,
  resizeCropper
} from '../utils/cropper-position.utils';

@Component({
  selector: 'image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf],
})
export class ImageCropperComponent implements OnChanges, OnInit, OnDestroy {

  private readonly pinchStart$ = new Subject<void>();
  private readonly cropService = new CropService();
  private readonly loadImageService = new LoadImageService();

  private setImageMaxSizeRetries = 0;
  private moveStart?: MoveStart;
  private resizedWhileHidden = false;

  protected readonly moveTypes = MoveTypes;
  protected readonly state = new CropperState();

  readonly safeImgDataUrl = signal<SafeUrl | string | undefined>(undefined);
  readonly safeTransformStyle = signal<SafeStyle | string | undefined>(undefined);
  marginLeft: SafeStyle | string = '0px';
  imageVisible = false;

  @ViewChild('wrapper', {static: true}) wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('sourceImage', {static: false}) sourceImage!: ElementRef<HTMLDivElement>;

  @Input() imageChangedEvent?: Event | null;
  @Input() imageURL?: string;
  @Input() imageBase64?: string;
  @Input() imageFile?: File;
  @Input() imageAltText?: string;

  @Input() options?: Partial<CropperOptions>;
  @Input() cropperFrameAriaLabel?: string;
  @Input() output?: 'blob' | 'base64';
  @Input() format?: OutputFormat;
  @Input() autoCrop?: boolean;
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
  @Input() checkImageType = true;
  @Input() alignImage?: 'left' | 'center';

  @HostBinding('class.disabled')
  @Input() disabled = false;
  @HostBinding('class.ngx-ic-hidden')
  @Input() hidden = false;

  readonly imageCropped = output<ImageCroppedEvent>();
  readonly startCropImage = output<void>();
  readonly imageLoaded = output<LoadedImage>();
  readonly cropperReady = output<Dimensions>();
  readonly loadImageFailed = output<void>();
  readonly transformChange = output<ImageTransform>();
  readonly cropperChange = output<CropperPosition>();

  @HostBinding('style.text-align')
  get alignImageStyle() {
    return this.state.options.alignImage;
  }

  constructor(
    private sanitizer: DomSanitizer
  ) {
    this.reset();
  }

  ngOnInit(): void {
    this.state.stepSize = this.initialStepSize || this.state.stepSize;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const previousCropperPosition = this.state.cropper();
    const previousTransform = this.state.transform;
    const previousBackgroundColor = this.state.options.backgroundColor;

    this.state.setOptionsFromChanges(changes);
    this.onChangesInputImage(changes);

    if (changes['transform'] && this.transform) {
      this.state.transform = this.transform;
      this.setCssTransform();
    }

    if (!this.state.loadedImage?.transformed.image.complete || !this.state.maxSize) {
      return;
    }

    if ((this.containWithinAspectRatio && changes['aspectRatio']) || changes['containWithinAspectRatio'] || changes['canvasRotation']) {
      this.loadImageService
        .transformLoadedImage(this.state.loadedImage, this.state.options)
        .then((res) => this.setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
      return;
    }

    if (changes['cropper'] && this.cropper) {
      this.state.cropper.set(checkCropperPosition(this.cropper, this.state, true));
    }
    const cropperChanged = !this.state.equalsCropperPosition(previousCropperPosition);
    if (cropperChanged && (!this.cropper || !this.state.equalsCropperPosition(this.cropper))) {
      this.cropperChange.emit(this.state.cropper());
    }
    if (cropperChanged
      || !this.state.equalsTransform(previousTransform)
      || this.state.options.backgroundColor !== previousBackgroundColor) {
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
    this.state.loadedImage = undefined;
    this.state.maxSize.set({ width: 0, height: 0 });
    this.imageVisible = false;
  }

  private loadImageFile(file: File): void {
    this.loadImageService
      .loadImageFile(file, this.state.options)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private loadBase64Image(imageBase64: string): void {
    this.loadImageService
      .loadBase64Image(imageBase64, this.state.options)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private loadImageFromURL(url: string): void {
    this.loadImageService
      .loadImageFromURL(url, this.state.options)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private setLoadedImage(loadedImage: LoadedImage): void {
    this.state.loadedImage = loadedImage;
    this.safeImgDataUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.objectUrl));
  }

  loadImageError(error: unknown): void {
    console.error(error);
    this.loadImageFailed.emit();
  }

  private setCssTransform(): void {
    const translateUnit = this.state.transform?.translateUnit || '%';
    this.safeTransformStyle.set(this.sanitizer.bypassSecurityTrustStyle(
      `translate(${this.state.transform.translateH || 0}${translateUnit}, ${this.state.transform.translateV || 0}${translateUnit})` +
      ' scaleX(' + (this.state.transform.scale || 1) * (this.state.transform.flipH ? -1 : 1) + ')' +
      ' scaleY(' + (this.state.transform.scale || 1) * (this.state.transform.flipV ? -1 : 1) + ')' +
      ' rotate(' + (this.state.transform.rotate || 0) + 'deg)'
    ));
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
      if (this.cropper && (!this.maintainAspectRatio || this.state.aspectRatioIsCorrect())) {
        this.state.cropper.set(checkCropperPosition(this.cropper, this.state, true));
        this.emitCropperPositionChange(this.cropper);
      } else {
        this.state.cropper.set(checkCropperPosition(this.state.maxSizeCropperPosition(), this.state, true));
        this.cropperChange.emit(this.state.cropper());
      }
      this.imageVisible = true;
      this.cropperReady.emit(this.state.maxSize());
      this.doAutoCrop();
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
    if (!this.state.loadedImage) {
      return;
    }
    if (this.hidden) {
      this.resizedWhileHidden = true;
    } else {
      const oldMaxSize = this.state.maxSize();
      this.setMaxSize();
      this.state.resizeCropperPosition(oldMaxSize);
    }
  }

  keyboardAccess(event: KeyboardEvent) {
    this.changeKeyboardStepSize(event);
    this.keyboardMoveCropper(event);
  }

  private changeKeyboardStepSize(event: KeyboardEvent): void {
    const key = +event.key;
    if (key >= 1 && key <= 9) {
      this.state.stepSize = key;
    }
  }

  private keyboardMoveCropper(event: KeyboardEvent) {
    const keyboardWhiteList: string[] = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
    if (!(keyboardWhiteList.includes(event.key))) {
      return;
    }
    const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move;
    const position = event.altKey ? getInvertedPositionForKey(event.key) : getPositionForKey(event.key);
    const moveEvent = getEventForKey(event.key, this.state.stepSize);
    event.preventDefault();
    event.stopPropagation();
    this.moveStart = {
      type: moveType,
      position,
      clientX: 0,
      clientY: 0,
      transform: this.state.transform,
      cropper: this.state.cropper()
    };
    this.handleMouseMove(moveEvent);
    this.handleMouseUp();
  }

  startMove(event: Event | BasicEvent, moveType: MoveTypes, position: Position | null = null): void {
    if (this.disabled
      || this.moveStart && this.moveStart.type === MoveTypes.Pinch
      || moveType === MoveTypes.Drag && !this.allowMoveImage) {
      return;
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    this.moveStart = {
      type: moveType,
      position,
      clientX: getClientX(event),
      clientY: getClientY(event),
      transform: this.state.transform,
      cropper: this.state.cropper()
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
        fromEvent(document, 'touchend'),
        this.pinchStart$
      ).pipe(first()))
    ).subscribe({
      next: (event) => this.handleMouseMove(event),
      complete: () => this.handleMouseUp()
    });
  }

  private handleMouseMove(event: Event | BasicEvent): void {
    if (!this.moveStart) {
      return;
    }
    if ('stopPropagation' in event) {
      event.stopPropagation();
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    if (this.moveStart.type === MoveTypes.Move) {
      this.state.cropper.set(checkCropperWithinMaxSizeBounds(
        moveCropper(event, this.moveStart),
        this.state,
        true
      ));
    } else if (this.moveStart.type === MoveTypes.Resize) {
      if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
        this.state.cropper.set(checkCropperWithinMaxSizeBounds(
          resizeCropper(event, this.moveStart, this.state),
          this.state,
          false
        ));
      }
    } else if (this.moveStart.type === MoveTypes.Drag) {
      const diffX = getClientX(event) - this.moveStart.clientX;
      const diffY = getClientY(event) - this.moveStart.clientY;
      this.state.transform = {
        ...this.state.transform,
        translateH: (this.moveStart.transform?.translateH || 0) + diffX,
        translateV: (this.moveStart.transform?.translateV || 0) + diffY
      };
      this.setCssTransform();
    }
  }

  private handleMouseUp(): void {
    if (!this.moveStart || this.moveStart.type === MoveTypes.Pinch) {
      return;
    }
    if (!this.state.equalsCropperPosition(this.moveStart.cropper)
      || this.moveStart.transform && !this.state.equalsTransform(this.moveStart.transform)) {
      if (this.moveStart.type === MoveTypes.Drag) {
        this.transformChange.emit(this.state.transform);
      } else {
        this.cropperChange.emit(this.state.cropper());
      }
      this.doAutoCrop();
    }
    this.moveStart = undefined;
  }

  startPinch(event: TouchEvent) {
    if (this.disabled || !this.sourceImageLoaded() || event.touches.length < 2) {
      return;
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    const cropper = this.state.cropper();
    this.moveStart = {
      type: MoveTypes.Pinch,
      position: 'center',
      clientX: cropper.x1 + (cropper.x2 - cropper.x1) / 2,
      clientY: cropper.y1 + (cropper.y2 - cropper.y1) / 2,
      cropper: cropper
    };
    this.initPinch();
  }

  private initPinch(): void {
    this.pinchStart$.next();
    fromEvent(document, 'touchmove')
      .pipe(takeUntil(fromEvent(document, 'touchend')))
      .subscribe({
        next: (event) => this.handlePinchMove(event as TouchEvent),
        complete: () => this.handlePinchStop()
      });
  }

  private handlePinchMove(event: TouchEvent) {
    if (!this.moveStart) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    if (this.moveStart.type === MoveTypes.Pinch) {
      if (!this.cropperStaticWidth && !this.cropperStaticHeight) {
        this.state.cropper.set(checkCropperWithinMaxSizeBounds(
          resizeCropper(event, this.moveStart, this.state),
          this.state,
          false
        ));
      }
    }
  }

  private handlePinchStop(): void {
    if (!this.moveStart) {
      return;
    }
    if (!this.state.equalsCropperPosition(this.moveStart.cropper)) {
      this.emitCropperPositionChange(this.moveStart.cropper);
      this.doAutoCrop();
    }
    this.moveStart = undefined;
  }

  private setMaxSize(): void {
    if (this.sourceImage) {
      const sourceImageStyle = getComputedStyle(this.sourceImage.nativeElement);
      this.state.setMaxSize(parseFloat(sourceImageStyle.width), parseFloat(sourceImageStyle.height));
      this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.state.maxSize().width / 2 + 'px)');
    }
  }

  private emitCropperPositionChange(previousPosition: CropperPosition): void {
    if (!this.state.equalsCropperPosition(previousPosition)) {
      this.cropperChange.emit(this.state.cropper());
    }
  }

  private doAutoCrop(): void {
    if (this.state.options.autoCrop) {
      void this.crop();
    }
  }

  crop(): ImageCroppedEvent | null;
  crop(output: 'base64'): ImageCroppedEvent | null;
  crop(output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(output: OutputType = this.state.options.output): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
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
    return new Promise(async (resolve, reject) => {
      const result = await this.cropService.crop(this.state.toCropInput(), 'blob');
      if (result) {
        this.imageCropped.emit(result);
        resolve(result);
      } else {
        reject('Crop image failed');
      }
    });
  }

  private cropToBase64(): ImageCroppedEvent | null {
    const result = this.cropService.crop(this.state.toCropInput(), 'base64');
    if (result) {
      this.imageCropped.emit(result);
      return result;
    }
    return null;
  }

  resetCropperPosition(): void {
    this.state.cropper.set(checkCropperPosition(this.state.maxSizeCropperPosition(), this.state, true));
    this.cropperChange.emit(this.state.cropper());
  }

  ngOnDestroy(): void {
    this.pinchStart$.complete();
  }
}
