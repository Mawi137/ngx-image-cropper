import {Directive, ElementRef, EventEmitter, Input, OnChanges, Output, Renderer2} from '@angular/core';
import {SimpleChanges} from "@angular/core";

@Directive({
  selector: '[draggableImage]'
})
export class DraggableImageDirective implements OnChanges{


  dragItem: any = null;
  container: any = null;
  dragActive = false;
  currentX: number = 0;
  currentY: number = 0;
  initialX: number = 0;
  initialY: number = 0;
  listeners: (() => void)[] = [];
  xOffset = 0;
  yOffset = 0;
  @Input() imageReady = false;
  @Input('draggableImage') enabled = false;
  @Output() newPosition: EventEmitter<{x: number, y: number }> = new EventEmitter<{x: number; y: number}>();

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2) {

  }



  dragStart(e: any): void{
    if (e.type === 'touchstart') {

      this.initialX = e.touches[0].clientX - this.xOffset;
      this.initialY = e.touches[0].clientY - this.yOffset;

    } else {

      this.initialX = e.clientX - this.xOffset;
      this.initialY = e.clientY - this.yOffset;
    }

    if (e.target === this.dragItem) {
      this.dragActive = true;
    }

  }

  dragEnd(event: any): void{
    this.initialX = this.currentX;
    this.initialY = this.currentY;

    this.dragActive = false;
  }

  drag(event: any): void{

    if (this.dragActive) {
      event.preventDefault();

      if (event.type === 'touchmove') {
        this.currentX = event.touches[0].clientX - this.initialX;
        this.currentY = event.touches[0].clientY - this.initialY;
      } else {
        this.currentX = event.clientX - this.initialX;
        this.currentY = event.clientY - this.initialY;
      }
      this.xOffset = this.currentX;
      this.yOffset = this.currentY;

      this.setTranslate(this.currentX, this.currentY, this.dragItem);
    }
  }

  setTranslate(xPos: number, yPos: number, el: HTMLElement): void {
    this.newPosition.next({x: xPos, y: yPos});
  }

  intialiseDragListening(): void{
    this.dragItem = this.elementRef.nativeElement;
    this.container = this.dragItem.parentElement;
    this.listeners.push(this.renderer.listen(this.container, 'touchstart', (event) => this.dragStart(event)));
    this.listeners.push(this.renderer.listen(this.container, 'touchend', (event) => this.dragEnd(event)));
    this.listeners.push(this.renderer.listen(this.container, 'touchmove', (event) => this.drag(event)));
    this.listeners.push(this.renderer.listen(this.container, 'mousedown', (event) => this.dragStart(event)));
    this.listeners.push(this.renderer.listen(this.container, 'mouseup', (event) => this.dragEnd(event)));
    this.listeners.push(this.renderer.listen(this.container, 'mousemove', (event) => this.drag(event)));
    this.renderer.addClass(this.dragItem, 'draggable-image');
  }

  disableDragListening(): void{
    this.renderer.removeClass(this.dragItem, 'draggable-image');
    this.listeners.forEach(listener => {
        listener();
    });
    this.dragItem = null;
    this.container = null;

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['imageReady'] && this.enabled)
    {
      if (this.elementRef && this.elementRef.nativeElement && this.elementRef.nativeElement.parentElement
        && !this.dragItem && !this.container) {
        this.intialiseDragListening();
      }
    }
    if (changes && changes['enabled'] && this.imageReady)
    {
      if (changes['enabled'].currentValue !== changes['enabled'].previousValue)
      {
        if (this.enabled && this.elementRef &&
          this.elementRef.nativeElement && this.elementRef.nativeElement.parentElement  && !this.dragItem && !this.container)
        {
          this.intialiseDragListening();

        }
        else if (this.dragItem && this.container)
        {
          this.disableDragListening();
        }
      }
    }
  }


}
