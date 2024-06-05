import { CropperPosition, ImageTransform, LoadedImage } from '../interfaces';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { CropperState } from './cropper.state';

describe('CropperState', () => {
  let cropperState: CropperState;

  beforeEach(() => {
    cropperState = new CropperState();
  });

  it('should initialize with default options', () => {
    expect(cropperState.options.format).toBe('png');
    expect(cropperState.options.output).toBe('blob');
    expect(cropperState.options.autoCrop).toBe(true);
    expect(cropperState.options.maintainAspectRatio).toBe(true);
    expect(cropperState.options.aspectRatio).toBe(1);
  });

  it('should set options from changes', () => {
    const changes: SimpleChanges = {
      format: new SimpleChange('png', 'jpeg', true),
      output: new SimpleChange('blob', 'base64', true),
      maintainAspectRatio: new SimpleChange(false, true, true)
    };
    cropperState.setOptionsFromChanges(changes);
    expect(cropperState.options.format).toBe('jpeg');
    expect(cropperState.options.output).toBe('base64');
    expect(cropperState.options.maintainAspectRatio).toBe(true);
  });

  it('should validate options and throw error if aspectRatio is not set when maintainAspectRatio is enabled', () => {
    expect(() => {
      cropperState.setOptions({maintainAspectRatio: true, aspectRatio: 0});
    }).toThrowError('`aspectRatio` should > 0 when `maintainAspectRatio` is enabled');
  });

  it('should set max size and update cropper scaled min and max sizes', () => {
    cropperState.loadedImage = {
      transformed: {
        image: new Image(),
        size: {width: 200, height: 200}
      }
    } as LoadedImage;

    cropperState.setMaxSize(100, 100);
    expect(cropperState.maxSize).toEqual({width: 100, height: 100});
    expect(cropperState.cropperScaledMinWidth).toBe(20);
    expect(cropperState.cropperScaledMinHeight).toBe(20);
    expect(cropperState.cropperScaledMaxWidth).toBe(100);
    expect(cropperState.cropperScaledMaxHeight).toBe(100);
  });

  it('should resize cropper position based on new max size', () => {
    cropperState.maxSize = {width: 200, height: 200};
    cropperState.cropper = {x1: 25, x2: 75, y1: 25, y2: 75};
    cropperState.resizeCropperPosition({width: 100, height: 100});
    expect(cropperState.cropper).toEqual({x1: 50, x2: 150, y1: 50, y2: 150});
  });

  it('should correctly determine if aspect ratio is correct', () => {
    cropperState.cropper = {x1: 0, x2: 100, y1: 0, y2: 100};
    cropperState.options.aspectRatio = 1;
    expect(cropperState.aspectRatioIsCorrect()).toBe(true);

    cropperState.cropper = {x1: 0, x2: 100, y1: 0, y2: 50};
    cropperState.options.aspectRatio = 2;
    expect(cropperState.aspectRatioIsCorrect()).toBe(true);
  });

  it('should correctly compare cropper positions', () => {
    const position: CropperPosition = {x1: 0, x2: 100, y1: 0, y2: 100};
    cropperState.cropper = {x1: 0, x2: 100, y1: 0, y2: 100};
    expect(cropperState.equalsCropperPosition(position)).toBe(true);

    cropperState.cropper = {x1: 0, x2: 100, y1: 0, y2: 50};
    expect(cropperState.equalsCropperPosition(position)).toBe(false);
  });

  it('should correctly compare transforms', () => {
    const transform: ImageTransform = {scale: 1, rotate: 0, translateH: 0, translateV: 0, flipH: false, flipV: false};
    cropperState.transform = {scale: 1, rotate: 0, translateH: 0, translateV: 0, flipH: false, flipV: false};
    expect(cropperState.equalsTransform(transform)).toBe(true);

    cropperState.transform = {scale: 1.5, rotate: 0, translateH: 0, translateV: 0, flipH: false, flipV: false};
    expect(cropperState.equalsTransform(transform)).toBe(false);
  });
});
