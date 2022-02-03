import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-deploys',
  templateUrl: './my-deploys.component.html',
  styleUrls: ['./my-deploys.component.scss']
})
export class MyDeploysComponent implements OnInit {
  arr: number[] = [1,2, 3];
  firstStep: boolean = false;
  secondStep: boolean = false;
  isPopUpOpened: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  activeFirstStep() {
    if (this.firstStep) {
      this.isPopUpOpened = false;
    }else {
      this.isPopUpOpened =  true;
    }
  }

  activeTrading() {
    this.secondStep = true;
  }

  closePopUp($event: boolean) {
    this.isPopUpOpened = false;
  }

  triggerLiquidity($event: any) {
    this.isPopUpOpened = false;
    this.firstStep = true;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }
}
