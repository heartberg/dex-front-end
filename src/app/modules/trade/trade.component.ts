import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  algoAmount: number = 2000;
  rotate: boolean = false;

  firstDropValues: string[] = [];
  secondDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];

  algoArr: string[] = ['Algo'];
  tokenArr: string[] = ['Token a', 'Token b', 'Token c'];

  assetArr: AssetViewModel[] = [];
  dummyArr: AssetViewModel[] = [{
    assetId: 5,
    smartContractId: 10,
    smartContractAddress: 'string',
    name: 'Algo',
    unitName: 'string',
    totalSupply: 45,
    url: 'string',
    maxBuy: 3,
    tradingStart: 5,
    risingPriceFloor: 2,
    backing: 5,
    buyBurn: 3,
    sellBurn: 6,
    sendBurn: 8,
    additionalFee: 6,
    additionalFeeWallet: 'string',
    image: 'string',
    deployerWallet: 'string'
  }]

  selectedOptionA: string = '';
  selectedOptionB: string = '';
  blockchainChecked: boolean = true;

  isPopUpOpen: boolean = false;

  @ViewChild('checkBox', { static: false })
  // @ts-ignore
  private checkBox: ElementRef;

  btnFirst: boolean = false;
  btnSecond: boolean = false;
  btnThird: boolean = false;
  btnFourth: boolean = false;
  clickCounter: number = 0;
  isClickedOnBtn: boolean = false;

  constructor(
    private assetReqService: AssetReqService
  ) { }

  ngOnInit(): void {
    this.secondDropValues = this.tokenArr;
    this.selectedOptionA = this.tokenArr[0];
    this.selectedOptionB = this.tokenArr[0];

    this.assetReqService.getAssetPairs().subscribe(
      (res) => {
        console.log(res);
        this.assetArr = res;
        res.forEach(el => {
          this.firstDropValues.push(el.name);
        });
        this.secondDropValues = this.algoArr;
        this.selectedOptionA = this.firstDropValues[0];
        this.selectedOptionB = this.firstDropValues[0];
      }
    );
  }

  makeReverse() {
    this.rotate = !this.rotate
  }

  onUserInput(input: HTMLInputElement) {
    this.btnFirst = false;
    this.btnSecond = false;
    this.btnThird = false;
    this.btnFourth = false;
  }

  dropdownSelected(value: string, index: number) {

    if (index === 1) {
      if (value === 'Algo') {
        this.secondDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        this.secondDropValues = this.algoArr;
        this.selectedOptionA = value;
        this.selectedOptionB = value;
      }
    } else if (index === 2) {
      if (value === 'Algo') {
        // this.firstDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        // this.firstDropValues = this.algoArr;
        this.selectedOptionA = value;
        this.selectedOptionB = value;
      }
    }
  }

  checkBoxClicked() { }

  openPopUp() {
    this.isPopUpOpen = true;
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
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
    if (index === 1) {
      // if ($event === 'Algo') {
        // this.secondDropValues = this.tokenArr;
      // } else if ($event.includes('Token')) {
        // this.secondDropValues = this.algoArr;
        this.selectedOptionA = $event;
        this.selectedOptionB = $event;
      // }
    } else if (index === 2) {
      // if ($event === 'Algo') {
        // this.firstDropValues = this.tokenArr;
      // } else if ($event.includes('Token')) {
        // this.firstDropValues = this.algoArr;
        this.selectedOptionA = $event;
        this.selectedOptionB = $event;
      // }
    }
    this.selectedOptionA = $event;
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
