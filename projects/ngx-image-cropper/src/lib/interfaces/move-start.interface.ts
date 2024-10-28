import { CropperPosition, ImageTransform } from './';

export type Position = 'left' | 'topleft' | 'top' | 'topright' | 'right' | 'bottomright' | 'bottom' | 'bottomleft' | 'center';

export interface MoveStart {
  type: MoveTypes | null;
  position: Position | null;
  transform?: ImageTransform;
  cropper: CropperPosition;
  clientX: number;
  clientY: number;
}

export enum MoveTypes {
  Drag = 'drag',
  Move = 'move',
  Resize = 'resize',
  Pinch = 'pinch'
}
