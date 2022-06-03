import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  isThemeChanged: boolean = false;
  stacking: boolean = false;

  constructor(private route: ActivatedRoute) {

  }

  ngOnInit() {
    // @ts-ignore
    if (this.route._routerState.url === '/stacking') {
      console.log('ssss')
      this.stacking = true;
    }
  }

  changeTheme(value: boolean) {
    this.isThemeChanged = value;
    return this.isThemeChanged;
    console.log('saba');
    console.log(2223);
  }

  log() {
    console.log(1)
  }
}
