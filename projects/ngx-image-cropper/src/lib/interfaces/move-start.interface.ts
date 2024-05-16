import { ImageTransform } from './image-transform.interface';

export type Position = 'left' | 'topleft' | 'top' | 'topright' | 'right' | 'bottomright' | 'bottom' | 'bottomleft' | 'center';

export interface MoveStart {
  active: boolean;
  type: MoveTypes | null;
  position: Position | null;
  transform?: ImageTransform;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  clientX: number;
  clientY: number;
}

export enum MoveTypes {
  Drag = 'drag',
  Move = 'move',
  Resize = 'resize',
  Pinch = 'pinch'
}
