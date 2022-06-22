import {
  Component, DoCheck,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";

@Component({
  selector: 'infinite-scroll',
  template: `<div #anchor><ng-content></ng-content></div>`,
})
export class InfiniteScrollComponent implements OnInit, OnDestroy, DoCheck {
  @Input() options = {};
  @Output() scrolled = new EventEmitter();
  @ViewChild('anchor', {static: false})
  private anchor: ElementRef<HTMLElement>;

  private observer: IntersectionObserver;

  constructor(private host: ElementRef) { }

  ngOnInit() {
    // const options = {
    //   root: null,
    //   ...this.options
    // };
    //
    // this.observer = new IntersectionObserver(([entry]) => {
    //   entry.isIntersecting && this.scrolled.emit('2');
    // }, options);
    // setTimeout(() => {
    //   this.observer.observe(this.anchor.nativeElement!);
    // }, 450)
  }

  // get element() {
  //   return this.host.nativeElement;
  // }
  //
  // private isHostScrollable() {
  //   const style = window.getComputedStyle(this.element);
  //
  //   return style.getPropertyValue('overflow') === 'auto' ||
  //     style.getPropertyValue('overflow-y') === 'scroll';
  // }
  //
  ngOnDestroy() {
    this.observer.disconnect();
  }
  ngDoCheck() {

  }

  @HostListener('window:scroll', ['$event'])
  doSomething(event: any) {
    // console.debug("Scroll Event", document.body.scrollTop);
    // see András Szepesházi's comment below
    console.log("Scroll Event", window.pageYOffset );
  }
}
