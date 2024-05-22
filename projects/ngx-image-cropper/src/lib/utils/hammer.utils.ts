export type HammerStatic = new(element: HTMLElement | SVGElement, options?: any) => HammerManager;

export declare class HammerInput {
  constructor(manager: HammerManager, callback: Function);

  destroy(): void;

  handler(): void;

  init(): void;

  /** Name of the event. Like panstart. */
  type: string;

  /** Movement of the X axis. */
  deltaX: number;

  /** Movement of the Y axis. */
  deltaY: number;

  /** Total time in ms since the first input. */
  deltaTime: number;

  /** Distance moved. */
  distance: number;

  /** Angle moved. */
  angle: number;

  /** Velocity on the X axis, in px/ms. */
  velocityX: number;

  /** Velocity on the Y axis, in px/ms */
  velocityY: number;

  /** Highest velocityX/Y value. */
  velocity: number;

  overallVelocity: number;

  overallVelocityX: number;

  overallVelocityY: number;

  /** Direction moved. Matches the DIRECTION constants. */
  direction: number;

  /** Direction moved from it's starting point. Matches the DIRECTION constants. */
  offsetDirection: number;

  /** Scaling that has been done when multi-touch. 1 on a single touch. */
  scale: number;

  /** Rotation that has been done when multi-touch. 0 on a single touch. */
  rotation: number;

  /** Source event object, type TouchEvent, MouseEvent or PointerEvent. */
  srcEvent: TouchEvent | MouseEvent | PointerEvent;

  /** Target that received the event. */
  target: HTMLElement;

  /** Primary pointer type, could be touch, mouse, pen or kinect. */
  pointerType: string;

  /** true when the first input. */
  isFirst: boolean;

  /** true when the final (last) input. */
  isFinal: boolean;

  /** Array with all pointers, including the ended pointers (touchend, mouseup). */
  pointers: any[];

  /** Array with all new/moved/lost pointers. */
  changedPointers: any[];

  /** Maximum number of pointers detected in the gesture */
  maxPointers: number;

  /** Timestamp of a gesture */
  timeStamp: number;

  /** Reference to the srcEvent.preventDefault() method. Only for experts! */
  preventDefault: Function;
}

interface RecognizerOptions {
  direction?: number | undefined;
  enable?: boolean | ((recognizer: Recognizer, inputData: HammerInput) => boolean) | undefined;
  event?: string | undefined;
  interval?: number | undefined;
  pointers?: number | undefined;
  posThreshold?: number | undefined;
  taps?: number | undefined;
  threshold?: number | undefined;
  time?: number | undefined;
  velocity?: number | undefined;
}

interface Recognizer {
  defaults: any;

  canEmit(): boolean;

  canRecognizeWith(otherRecognizer: Recognizer): boolean;

  dropRecognizeWith(otherRecognizer: Recognizer | Recognizer[] | string): Recognizer;

  dropRequireFailure(otherRecognizer: Recognizer | Recognizer[] | string): Recognizer;

  emit(input: HammerInput): void;

  getTouchAction(): any[];

  hasRequireFailures(): boolean;

  process(inputData: HammerInput): string;

  recognize(inputData: HammerInput): void;

  recognizeWith(otherRecognizer: Recognizer | Recognizer[] | string): Recognizer;

  requireFailure(otherRecognizer: Recognizer | Recognizer[] | string): Recognizer;

  reset(): void;

  set(options?: RecognizerOptions): Recognizer;

  tryEmit(input: HammerInput): void;
}

interface HammerListener {
  (event: HammerInput): void;
}

/** @docs-private */
export interface HammerManager {
  get(recogniser: string): Recognizer;

  on(events: string, handler: HammerListener): void;
}
