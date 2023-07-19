import { CropperPosition, Dimensions, LoadedImage } from '../interfaces';
import { CropperSettings } from '../interfaces/cropper.settings';
import { CropService } from './crop.service';

describe('CropService', () => {

  let service: CropService;
  let settings: CropperSettings;

  beforeEach(() => {
    service = new CropService();
    settings = new CropperSettings();
  });

  describe('#getResizeRatio', () => {

    describe('when onlyScaleDown is false', () => {

      it('when resizeToWidth is set', () => {
        settings.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 0,
          onlyScaleDown: false
        });

        expect(service.getResizeRatio(1000, 123, settings)).toBe(0.5);
        expect(service.getResizeRatio(1000, 1234, settings)).toBe(0.5);
        expect(service.getResizeRatio(250, 123, settings)).toBe(2);
        expect(service.getResizeRatio(250, 1234, settings)).toBe(2);
      });
      it('when resizeToHeight is set', () => {
        settings.setOptions({
          resizeToWidth: 0,
          resizeToHeight: 500,
          onlyScaleDown: false
        });

        expect(service.getResizeRatio(123, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(1234, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(123, 250, settings)).toBe(2);
        expect(service.getResizeRatio(1234, 250, settings)).toBe(2);
      });
      it('when resizeToWidth and resizeToHeight is set', () => {
        settings.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 500,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(1000, 2000, settings)).toBe(0.25);
        expect(service.getResizeRatio(2000, 1000, settings)).toBe(0.25);
        expect(service.getResizeRatio(250, 125, settings)).toBe(2);
        expect(service.getResizeRatio(125, 250, settings)).toBe(2);


        settings.setOptions({
          resizeToWidth: 1000,
          resizeToHeight: 500,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(1000, 2000, settings)).toBe(0.25);
        expect(service.getResizeRatio(1000, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(1000, 500, settings)).toBe(1);
        expect(service.getResizeRatio(1000, 250, settings)).toBe(1);
        expect(service.getResizeRatio(123, 250, settings)).toBe(2);
        expect(service.getResizeRatio(500, 123, settings)).toBe(2);


        settings.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 1000,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(2000, 1000, settings)).toBe(0.25);
        expect(service.getResizeRatio(1000, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(500, 1000, settings)).toBe(1);
        expect(service.getResizeRatio(250, 1000, settings)).toBe(1);
        expect(service.getResizeRatio(250, 123, settings)).toBe(2);
        expect(service.getResizeRatio(123, 500, settings)).toBe(2);
      });
    });

    describe('when onlyScaleDown is true', () => {

      it('when resizeToWidth is set', () => {
        settings.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 0,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(250, 1234, settings)).toBe(1);
        expect(service.getResizeRatio(250, 125, settings)).toBe(1);
        expect(service.getResizeRatio(1000, 125, settings)).toBe(0.5);
      });


      it('when resizeToHeight is set', () => {
        settings.setOptions({
          resizeToWidth: 0,
          resizeToHeight: 500,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(1234, 250, settings)).toBe(1);
        expect(service.getResizeRatio(125, 250, settings)).toBe(1);
        expect(service.getResizeRatio(125, 1000, settings)).toBe(0.5);
      });


      it('when resizeToWidth and resizeToHeight is set', () => {
        settings.setOptions({
          resizeToWidth: 1000,
          resizeToHeight: 500,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(1000, 250, settings)).toBe(1);
        expect(service.getResizeRatio(2000, 250, settings)).toBe(0.5);
        expect(service.getResizeRatio(100, 250, settings)).toBe(1);

        expect(service.getResizeRatio(250, 500, settings)).toBe(1);
        expect(service.getResizeRatio(250, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(250, 50, settings)).toBe(1);
      });
    });
  });

  describe("#getImagePosition", () => {
    describe("when cropper position rounding shaves off a few pixels", () => {
      const sourceImage = { nativeElement: { offsetWidth: 500 } };
      const loadedImage = {
        transformed: { size: { width: 1124, height: 750 } },
      } as LoadedImage;
      const cropper = { x1: 0, y1: 67.09608540925274, x2: 500, y2: 334 };
      
      it("should be moved back into bounds", () => {
        settings.setOptions({ containWithinAspectRatio: false });
        expect(
          service.getImagePosition(sourceImage, loadedImage, cropper, settings)
        ).toEqual({ x1: 0, y1: 150, x2: 1124, y2: 750 });
      });
    });
  });

  describe("#containWithinBounds", () => {
    const maxDimensions: Dimensions = {
      width: 600,
      height: 400,
    };
    const cropperPositionBase: CropperPosition = {
      x1: 100,
      x2: 400,
      y1: 250,
      y2: 350,
    };

    it("when in bounds, should not change", () => {
      const cropperPosition = { ...cropperPositionBase };
      const expectedCropperPosition = { ...cropperPositionBase };
      service.containWithinBounds(cropperPosition, maxDimensions);
      expect(cropperPosition).toEqual(expectedCropperPosition);
    });

    it("when out of bounds left side, should be brought back in bounds", () => {
      const cropperPosition = { ...cropperPositionBase, x1: -2 };
      const expectedCropperPosition = {
        ...cropperPositionBase,
        x1: 0,
        x2: 402,
      };
      service.containWithinBounds(cropperPosition, maxDimensions);
      expect(cropperPosition).toEqual(expectedCropperPosition);
    });

    it("when out of bounds top side, should be brought back into bounds", () => {
      const cropperPosition = { ...cropperPositionBase, y1: -3 };
      const expectedCropperPosition = {
        ...cropperPositionBase,
        y1: 0,
        y2: 353,
      };
      service.containWithinBounds(cropperPosition, maxDimensions);
      expect(cropperPosition).toEqual(expectedCropperPosition);
    });

    it("when out of bounds right side, should be brought back into bounds", () => {
      const cropperPosition = { ...cropperPositionBase, x2: 601 };
      const expectedCropperPosition = {
        ...cropperPositionBase,
        x1: 99,
        x2: 600,
      };
      service.containWithinBounds(cropperPosition, maxDimensions);
      expect(cropperPosition).toEqual(expectedCropperPosition);
    });

    it("when out of bounds bottom side, should be brought back into bounds", () => {
      const cropperPosition = { ...cropperPositionBase, y2: 405 };
      const expectedCropperPosition = {
        ...cropperPositionBase,
        y1: 245,
        y2: 400,
      };
      service.containWithinBounds(cropperPosition, maxDimensions);
      expect(cropperPosition).toEqual(expectedCropperPosition);
    });
  });
});
