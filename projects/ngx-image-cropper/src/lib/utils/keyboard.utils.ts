import {BasicEvent} from "../interfaces/basic-event.interface";
import {Position} from "../interfaces/move-start.interface";

export function getPositionForKey(key: string): Position {
  switch (key) {
    case 'ArrowUp':
      return 'top';
    case 'ArrowRight':
      return 'right';
    case 'ArrowDown':
      return 'bottom';
    case 'ArrowLeft':
    default:
      return 'left';
  }
}

export function getInvertedPositionForKey(key: string): Position {
  switch (key) {
    case 'ArrowUp':
      return 'bottom';
    case 'ArrowRight':
      return 'left';
    case 'ArrowDown':
      return 'top';
    case 'ArrowLeft':
    default:
      return 'right';
  }
}

export function getEventForKey(key: string, stepSize: number): BasicEvent {
  switch (key) {
    case 'ArrowUp':
      return {clientX: 0, clientY: stepSize * -1};
    case 'ArrowRight':
      return {clientX: stepSize, clientY: 0};
    case 'ArrowDown':
      return {clientX: 0, clientY: stepSize};
    case 'ArrowLeft':
    default:
      return {clientX: stepSize * -1, clientY: 0};
  }
}
