export interface ImageTransform {
  scale?: number;
  rotate?: number;
  flipH?: boolean;
  flipV?: boolean;
  translateH?: number;
  translateV?: number;
  translateUnit?: '%' | 'px';
}
