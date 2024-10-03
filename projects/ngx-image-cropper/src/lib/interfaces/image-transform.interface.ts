export interface ImageTransform {
  flipX: boolean;
  flipY: boolean;
  rotate: number;
  scale: number;
  translateUnit: '%' | 'px';
  translateX: number;
  translateY: number;
}
