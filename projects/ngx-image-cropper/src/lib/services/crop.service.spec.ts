import { CropperState } from '../component/cropper.state';
import { CropService } from './crop.service';

describe('CropService', () => {

  let service: CropService;
  let cropperState: CropperState;

  beforeEach(() => {
    service = new CropService();
    cropperState = new CropperState();
  });

  describe('#getResizeRatio', () => {

    describe('when onlyScaleDown is false', () => {

      it('when resizeToWidth is set', () => {
        cropperState.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 0,
          onlyScaleDown: false
        });

        expect(service.getResizeRatio(1000, 123, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(1000, 1234, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(250, 123, cropperState.options)).toBe(2);
        expect(service.getResizeRatio(250, 1234, cropperState.options)).toBe(2);
      });
      it('when resizeToHeight is set', () => {
        cropperState.setOptions({
          resizeToWidth: 0,
          resizeToHeight: 500,
          onlyScaleDown: false,
        });

        expect(service.getResizeRatio(123, 1000, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(1234, 1000, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(123, 250, cropperState.options)).toBe(2);
        expect(service.getResizeRatio(1234, 250, cropperState.options)).toBe(2);
      });
      it('when resizeToWidth and resizeToHeight is set', () => {
        cropperState.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 500,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(1000, 2000, cropperState.options)).toBe(0.25);
        expect(service.getResizeRatio(2000, 1000, cropperState.options)).toBe(0.25);
        expect(service.getResizeRatio(250, 125, cropperState.options)).toBe(2);
        expect(service.getResizeRatio(125, 250, cropperState.options)).toBe(2);


        cropperState.setOptions({
          resizeToWidth: 1000,
          resizeToHeight: 500,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(1000, 2000, cropperState.options)).toBe(0.25);
        expect(service.getResizeRatio(1000, 1000, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(1000, 500, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(1000, 250, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(123, 250, cropperState.options)).toBe(2);
        expect(service.getResizeRatio(500, 123, cropperState.options)).toBe(2);


        cropperState.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 1000,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(2000, 1000, cropperState.options)).toBe(0.25);
        expect(service.getResizeRatio(1000, 1000, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(500, 1000, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(250, 1000, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(250, 123, cropperState.options)).toBe(2);
        expect(service.getResizeRatio(123, 500, cropperState.options)).toBe(2);
      });
    });

    describe('when onlyScaleDown is true', () => {

      it('when resizeToWidth is set', () => {
        cropperState.setOptions({
          resizeToWidth: 500,
          resizeToHeight: 0,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(250, 1234, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(250, 125, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(1000, 125, cropperState.options)).toBe(0.5);
      });


      it('when resizeToHeight is set', () => {
        cropperState.setOptions({
          resizeToWidth: 0,
          resizeToHeight: 500,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(1234, 250, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(125, 250, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(125, 1000, cropperState.options)).toBe(0.5);
      });


      it('when resizeToWidth and resizeToHeight is set', () => {
        cropperState.setOptions({
          resizeToWidth: 1000,
          resizeToHeight: 500,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(1000, 250, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(2000, 250, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(100, 250, cropperState.options)).toBe(1);

        expect(service.getResizeRatio(250, 500, cropperState.options)).toBe(1);
        expect(service.getResizeRatio(250, 1000, cropperState.options)).toBe(0.5);
        expect(service.getResizeRatio(250, 50, cropperState.options)).toBe(1);
      });
    });
  });
});
