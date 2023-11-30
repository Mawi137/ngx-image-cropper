import { SimpleChange, SimpleChanges } from '@angular/core';
import { CropperSettings,CropperOptions } from '../interfaces/';
import { CropService } from './crop.service';

describe('CropService', () => {

  let service: CropService;
  let settings: CropperSettings;
  const setOptions = (options: Partial<CropperOptions>) => {
    let dummyChanges: SimpleChanges = {};
    for(let key in options) {
      (dummyChanges as any)[key] = new SimpleChange(undefined, (options as any)[key], true);
    }
    settings.setOptionsFromChanges(dummyChanges);
  }

  beforeEach(() => {
    service = new CropService();
    settings = new CropperSettings();
  });

  describe('#getResizeRatio', () => {

    describe('when onlyScaleDown is false', () => {

      it('when resizeToWidth is set', () => {
        setOptions({
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
        setOptions({
          resizeToWidth: 0,
          resizeToHeight: 500,
          onlyScaleDown: false,
        });

        expect(service.getResizeRatio(123, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(1234, 1000, settings)).toBe(0.5);
        expect(service.getResizeRatio(123, 250, settings)).toBe(2);
        expect(service.getResizeRatio(1234, 250, settings)).toBe(2);
      });
      it('when resizeToWidth and resizeToHeight is set', () => {
        setOptions({
          resizeToWidth: 500,
          resizeToHeight: 500,
          onlyScaleDown: false
        });
        expect(service.getResizeRatio(1000, 2000, settings)).toBe(0.25);
        expect(service.getResizeRatio(2000, 1000, settings)).toBe(0.25);
        expect(service.getResizeRatio(250, 125, settings)).toBe(2);
        expect(service.getResizeRatio(125, 250, settings)).toBe(2);


        setOptions({
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


        setOptions({
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
        setOptions({
          resizeToWidth: 500,
          resizeToHeight: 0,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(250, 1234, settings)).toBe(1);
        expect(service.getResizeRatio(250, 125, settings)).toBe(1);
        expect(service.getResizeRatio(1000, 125, settings)).toBe(0.5);
      });


      it('when resizeToHeight is set', () => {
        setOptions({
          resizeToWidth: 0,
          resizeToHeight: 500,
          onlyScaleDown: true
        });
        expect(service.getResizeRatio(1234, 250, settings)).toBe(1);
        expect(service.getResizeRatio(125, 250, settings)).toBe(1);
        expect(service.getResizeRatio(125, 1000, settings)).toBe(0.5);
      });


      it('when resizeToWidth and resizeToHeight is set', () => {
        setOptions({
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
});
