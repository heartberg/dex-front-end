import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  currentSection: BehaviorSubject<any> = new BehaviorSubject('home');

  sections: string[] = []
  height: any;
  constructor() {
    document.addEventListener('scroll', () => {
      this.keepTrack(this.height);
    })
  }

  keepTrack(s: any) {
    const viewHeight = this.height.innerHeight;
    console.log(viewHeight);
    for (var section of this.sections) {

      const element = document.getElementById(this.height);
      if (element != null) {
        const rect = element.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < viewHeight / 2) {
          this.currentSection.next(section);
        }
      } else {
      }
    }
  }
}
