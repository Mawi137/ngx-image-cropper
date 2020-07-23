import { ImageCropperComponent } from './image-cropper.component';

class Helpers {
  static newCropper(resizeToWidth: number, resizeToHeight: number, onlyScaleDown: boolean): ImageCropperComponent {
    const cropper = new ImageCropperComponent(null, null);
    cropper.resizeToWidth = resizeToWidth;
    cropper.resizeToHeight = resizeToHeight;
    cropper.onlyScaleDown = onlyScaleDown;
    return cropper;
  }
}

describe('image-cropper', () => {

  describe('#getResizeRatio', () => {

    describe('when onlyScaleDown is false', () => {

      it('when resizeToWidth is set', () => {
        const cropper = Helpers.newCropper(500, 0, false);

        expect(cropper.getResizeRatio(1000, 123)).toBe(0.5);
        expect(cropper.getResizeRatio(1000, 1234)).toBe(0.5);
        expect(cropper.getResizeRatio(250, 123)).toBe(2);
        expect(cropper.getResizeRatio(250, 1234)).toBe(2);
      });
      it('when resizeToHeight is set', () => {
        const cropper = Helpers.newCropper(0, 500, false);

        expect(cropper.getResizeRatio(123, 1000)).toBe(0.5);
        expect(cropper.getResizeRatio(1234, 1000)).toBe(0.5);
        expect(cropper.getResizeRatio(123, 250)).toBe(2);
        expect(cropper.getResizeRatio(1234, 250)).toBe(2);
      });
      it('when resizeToWidth and resizeToHeight is set', () => {
        let cropper = Helpers.newCropper(500, 500, false);

        expect(cropper.getResizeRatio(1000, 2000)).toBe(0.25);
        expect(cropper.getResizeRatio(2000, 1000)).toBe(0.25);
        expect(cropper.getResizeRatio(250, 125)).toBe(2);
        expect(cropper.getResizeRatio(125, 250)).toBe(2);


        cropper = Helpers.newCropper(1000, 500, false);

        expect(cropper.getResizeRatio(1000, 2000)).toBe(0.25);
        expect(cropper.getResizeRatio(1000, 1000)).toBe(0.5);
        expect(cropper.getResizeRatio(1000, 500)).toBe(1);
        expect(cropper.getResizeRatio(1000, 250)).toBe(1);
        expect(cropper.getResizeRatio(123, 250)).toBe(2);
        expect(cropper.getResizeRatio(500, 123)).toBe(2);


        cropper = Helpers.newCropper(500, 1000, false);

        expect(cropper.getResizeRatio(2000, 1000)).toBe(0.25);
        expect(cropper.getResizeRatio(1000, 1000)).toBe(0.5);
        expect(cropper.getResizeRatio(500, 1000)).toBe(1);
        expect(cropper.getResizeRatio(250, 1000)).toBe(1);
        expect(cropper.getResizeRatio(250, 123)).toBe(2);
        expect(cropper.getResizeRatio(123, 500)).toBe(2);
      });
    });

    describe('when onlyScaleDown is true', () => {

      it('when resizeToWidth is set', () => {
        const cropper = Helpers.newCropper(500, 0, true);

        expect(cropper.getResizeRatio(250, 1234)).toBe(1);
        expect(cropper.getResizeRatio(250, 125)).toBe(1);
        expect(cropper.getResizeRatio(1000, 125)).toBe(0.5);
      });


      it('when resizeToHeight is set', () => {
        const cropper = Helpers.newCropper(0, 500, true);

        expect(cropper.getResizeRatio(1234, 250)).toBe(1);
        expect(cropper.getResizeRatio(125, 250)).toBe(1);
        expect(cropper.getResizeRatio(125, 1000)).toBe(0.5);
      });


      it('when resizeToWidth and resizeToHeight is set', () => {
        const cropper = Helpers.newCropper(1000, 500, true);

        expect(cropper.getResizeRatio(1000, 250)).toBe(1);
        expect(cropper.getResizeRatio(2000, 250)).toBe(0.5);
        expect(cropper.getResizeRatio(100, 250)).toBe(1);

        expect(cropper.getResizeRatio(250, 500)).toBe(1);
        expect(cropper.getResizeRatio(250, 1000)).toBe(0.5);
        expect(cropper.getResizeRatio(250, 50)).toBe(1);
      });
    });
  });
});
