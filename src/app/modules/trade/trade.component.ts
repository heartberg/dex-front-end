import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { getGlobalState } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
})
export class TradeComponent implements OnInit {
  algoAmount: number = 2000;
  rotate: boolean = false;
  autoSlippage: boolean = true;

  firstDropValues: string[] = [];
  secondDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];

  algoArr: string[] = ['Algo'];
  tokenArr: string[] = ['Token a', 'Token b', 'Token c'];

  assetArr: AssetViewModel[] = [];

  selectedOptionAname: string = '';
  selectedOptionBname: string = '';
  selectedOption: AssetViewModel | undefined;

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
    private assetReqService: AssetReqService,
    private fb: FormBuilder,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp
  ) {}

  // FORMS

  botInput = this.fb.control([0]);
  // slippageInput = this.fb.control([]);

  slippageForm = this.fb.group({
    slippageInput: [
      {
        disabled: this.autoSlippage,
      },
    ],
    slippageCheckBox: [this.autoSlippage],
  });

  topForms = this.fb.group({
    zeroInput: [0],
    topInput: [],
  });

  // FORMS

  ngOnInit(): void {
    if (this.slippageForm.get('slippageCheckBox')?.value) {
      this.slippageForm.get('slippageInput')?.disable();
    }
    this.secondDropValues = this.tokenArr;
    this.selectedOptionAname = this.tokenArr[0];
    this.selectedOptionBname = this.tokenArr[0];

    const wallet = localStorage.getItem('wallet')!;
    this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
      // this.assetArr = res;
      this.assetArr = res;
      console.log(this.assetArr);
      res.forEach((el) => {
        this.firstDropValues.push(el.name);
      });
      this.secondDropValues = this.algoArr;
      this.selectedOptionAname = this.firstDropValues[0];
      this.selectedOptionBname = this.firstDropValues[0];
      this.selectAsset(this.firstDropValues[0]);
    });
  }

  makeReverse() {
    this.rotate = !this.rotate;
  }

  onUserInput(input: HTMLInputElement) {
    this.btnFirst = false;
    this.btnSecond = false;
    this.btnThird = false;
    this.btnFourth = false;
  }

  handleCheckboxUpdate(event: any) {
    if (event === true) {
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(true, '', wallet).subscribe((res) => {
        // this.assetArr = res;
        this.assetArr = res;
        this.firstDropValues = [];
        res.forEach((el) => {
          this.firstDropValues.push(el.name);
        });
        this.secondDropValues = this.algoArr;
        this.selectedOptionAname = this.firstDropValues[0];
        this.selectedOptionBname = this.firstDropValues[0];
        this.selectAsset(this.firstDropValues[0]);
      });
    } else if (event === false) {
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
        // this.assetArr = res;
        this.assetArr = res;
        this.firstDropValues = [];
        res.forEach((el) => {
          this.firstDropValues.push(el.name);
        });
        this.secondDropValues = this.algoArr;
        this.selectedOptionAname = this.firstDropValues[0];
        this.selectedOptionBname = this.firstDropValues[0];
        this.selectAsset(this.firstDropValues[0]);
      });
    }
  }

  dropdownSelected(value: string, index: number) {
    if (index === 1) {
      if (value === 'Algo') {
        this.secondDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        this.secondDropValues = this.algoArr;
        this.selectedOptionAname = value;
        this.selectedOptionBname = value;
      }
    } else if (index === 2) {
      if (value === 'Algo') {
        // this.firstDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        // this.firstDropValues = this.algoArr;
        this.selectedOptionAname = value;
        this.selectedOptionBname = value;
      }
    }
  }

  selectAsset(assetName: string) {
    this.selectedOption = this.assetArr.find((el) => {
      return el.name === assetName;
    });
    console.log(this.selectedOption);
  }

  checkBoxClicked() {
    const slippageBox = this.slippageForm.get('slippageCheckBox');
    const slippageInput = this.slippageForm.get('slippageInput');

    if (!slippageBox?.value) {
      slippageInput?.enable();
    } else if (slippageBox.value) {
      slippageInput?.disable();
      slippageInput?.setValue(null);
    }
  }

  openPopUp() {
    this.isPopUpOpen = true;
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  async getValueFromDropDown($event: any, index: number) {
    // console.log($event);
    // if (index === 1 && $event) {
    //   this.secondDropValues.find( (item, i) =>  {
    //     item = $event;
    //     console.log(i);
    //     this.secondDropValues.splice(i+ 1, 1);
    //   })
    //   console.log(this.secondDropValues);
    // }

    this.selectAsset($event);
    console.log(this.selectedOption?.contractAddress);
    
    // get blockchain information of contract
    
    let globalState = await getGlobalState(4458)


    console.log(globalState)

    // fill deployed app settings with information
    // create deployed app object

    if (index === 1) {
      // if ($event === 'Algo') {
      // this.secondDropValues = this.tokenArr;
      // } else if ($event.includes('Token')) {
      // this.secondDropValues = this.algoArr;
      this.selectedOptionAname = $event;
      this.selectedOptionBname = $event;
      // }
    } else if (index === 2) {
      // if ($event === 'Algo') {
      // this.firstDropValues = this.tokenArr;
      // } else if ($event.includes('Token')) {
      // this.firstDropValues = this.algoArr;
      this.selectedOptionAname = $event;
      this.selectedOptionBname = $event;
      // }
    }
    this.selectedOptionAname = $event;
  }

  getPercentOfButton(index: number, inputRef: HTMLInputElement) {
    this.isClickedOnBtn = true;
    this.clickCounter++;
    if (index === 1) {
      this.btnFirst = true;
      this.btnSecond = false;
      this.btnThird = false;
      this.btnFourth = false;
      this.algoAmount = 2000 / 4;
      inputRef.value = this.algoAmount.toString();
    } else if (index === 2) {
      this.btnSecond = true;
      this.btnFirst = false;
      this.btnThird = false;
      this.btnFourth = false;
      this.algoAmount = 2000 / 2;
      inputRef.value = this.algoAmount.toString();
    } else if (index === 3) {
      this.btnThird = true;
      this.btnFirst = false;
      this.btnSecond = false;
      this.btnFourth = false;
      this.algoAmount = (2000 / 4) * 3;
      inputRef.value = this.algoAmount.toString();
    } else if (index === 4) {
      this.btnFourth = true;
      this.btnFirst = false;
      this.btnSecond = false;
      this.btnThird = false;
      this.algoAmount = 2000;
      inputRef.value = this.algoAmount.toString();
    }
    // if (this.clickCounter % 2 === 0) {
    //   this.btnFourth = false;
    //   this.btnFirst = false;
    //   this.btnSecond = false;
    //   this.btnThird = false;
    //   this.algoAmount = 0;
    // }
    console.log(this.algoAmount);
  }
}
