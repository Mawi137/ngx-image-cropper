import { CropperPosition, ImageTransform } from './';

export interface MoveStart {
  active: boolean;
  type: MoveTypes | null;
  position: string | null;
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
