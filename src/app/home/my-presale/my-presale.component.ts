import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-presale',
  templateUrl: './my-presale.component.html',
  styleUrls: ['./my-presale.component.scss']
})
export class MyPresaleComponent implements OnInit {
  arr: string[] = ['ended', 'failed', 'failed', 'ended', 'user', 'failed', 'user'];

  isPopUpOpen: boolean = false;
  isRestart: boolean = false;
  isFair: boolean = false;

  isPresaleEnded: boolean = true;

  constructor() { }

  openPopUp(version: string) {
    this.isPopUpOpen = true;
    if (version === 'restart') {
      this.isRestart = true;
      this.isFair = false;
    } else if (version === 'fair') {
      this.isRestart = false;
      this.isFair = true;
    }
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  ngOnInit(): void {
  }

}
