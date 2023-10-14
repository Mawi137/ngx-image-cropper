import { Dimensions } from '../interfaces';

export function rotateBox(box: Dimensions, a: number): Dimensions {
    a = Math.abs(a) / 360;
    a = (a - Math.floor(a)) * 360;        
    a = (a > 90 && a < 180) || (a > 270 && a < 360) ? 180 - a : a;
    a = (a * Math.PI) / 180;    
    return {
      width: Math.abs(box.width * Math.cos(a) + box.height * Math.sin(a)),
      height: Math.abs(box.width * Math.sin(a) + box.height * Math.cos(a))
    }
}