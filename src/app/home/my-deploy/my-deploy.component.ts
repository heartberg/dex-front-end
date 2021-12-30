import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-deploy',
  templateUrl: './my-deploy.component.html',
  styleUrls: ['./my-deploy.component.scss']
})
export class MyDeployComponent implements OnInit {
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
}
