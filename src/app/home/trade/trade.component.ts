import { Component, ElementRef, OnInit } from '@angular/core';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  algoAmount: number = 2000;

  firstDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];
  secondDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];

  algoArr: string[] = ['Algo'];
  tokenArr: string[] = ['Token a', 'Token b', 'Token c'];

  selectedOptionA: string = '';
  selectedOptionB: string = '';

  btnFirst: boolean = false;
  btnSecond: boolean = false;
  btnThird: boolean = false;
  btnFourth: boolean = false;
  clickCounter: number = 0;
  isClickedOnBtn: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  onUserInput(input: HTMLInputElement) {
    this.btnFirst = false;
    this.btnSecond = false;
    this.btnThird = false;
    this.btnFourth = false;
  }

  dropdownSelected(value: string, index: number) {

    if (index === 1) {
      this.selectedOptionA = value;
      if (value === 'Algo') {
        this.secondDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        this.secondDropValues = this.algoArr;
      }
    } else if (index === 2) {
      this.selectedOptionB = value;
      if (value === 'Algo') {
        this.firstDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        this.firstDropValues = this.algoArr;
      }
    }
  }
  
  test() {
    console.log('win')
  }

  getValueFromDropDown($event: any, index: number) {
    // console.log($event);
    // if (index === 1 && $event) {
    //   this.secondDropValues.find( (item, i) =>  {
    //     item = $event;
    //     console.log(i);
    //     this.secondDropValues.splice(i+ 1, 1);
    //   })
    //   console.log(this.secondDropValues);
    // }
  }

  getPercentOfButton(index: number) {
    this.isClickedOnBtn = true;
    this.clickCounter++;
    if (index === 1) {
      this.btnFirst = true;
      this.btnSecond = false;
      this.btnThird = false;
      this.btnFourth = false;
      this.algoAmount = 2000 / 4;
    } else
      if (index === 2) {
        this.btnSecond = true;
        this.btnFirst = false;
        this.btnThird = false;
        this.btnFourth = false;
        this.algoAmount = 2000 / 2;
      } else
        if (index === 3) {
          this.btnThird = true;
          this.btnFirst = false;
          this.btnSecond = false;
          this.btnFourth = false;
          this.algoAmount = 2000 / 4 * 3;
        } else
          if (index === 4) {
            this.btnFourth = true;
            this.btnFirst = false;
            this.btnSecond = false;
            this.btnThird = false;
            this.algoAmount = 2000;
          }
    // if (this.clickCounter % 2 === 0) {
    //   this.btnFourth = false;
    //   this.btnFirst = false;
    //   this.btnSecond = false;
    //   this.btnThird = false;
    //   this.algoAmount = 0;
    // }
  }
}
