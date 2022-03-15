import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-deploy',
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss'],
})
export class DeployComponent implements OnInit {
  isCheckedRoadMap: boolean = false;
  isCheckedTeamInfo: boolean = false;
  extraFieldsArr: number[] = [1];
  purposeIsChecked: boolean = false;
  presaleIsChecked: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}
  @ViewChild('checkbox', { static: false })
  // @ts-ignore
  private checkbox: ElementRef;

  @ViewChild('checkboxSecond', { static: false })
  // @ts-ignore
  private checkboxSecond: ElementRef;

  @ViewChild('checkboxPurpose', { static: false })
  // @ts-ignore
  private checkboxPurpose: ElementRef;

  @ViewChild('checkPresale', { static: false })
  // @ts-ignore
  private checkPresale: ElementRef;

  imageURL: string = '';

  deployFormGroup = this.fb.group({
    tokenInfoGroup: this.fb.group({
      tokenName: '',
      unitName: '',
      totalSupply: '',
      decimals: '',
      URL: '',
      maxBuy: '',
    }),
    feesGroup: this.fb.group({
      risingPriceFloor: '',
      backing: '',
      buyBurn: '',
      sellBurn: '',
      sendBurn: '',
    }),
    additionalFeeOptionGroup: this.fb.group({
      addFeeCheck: this.fb.control(false),
      purpose: '',
      address: '',
      fee: '',
    }),
    presaleOptionsGroupDescription: this.fb.control(''),
    createPresaleOptionGroup: this.fb.group({
      presaleSettings: this.fb.group({
        presaleStart: '',
        presaleEnd: '',
        softCap: '',
        hardCap: '',
        walletCap: '',
      }),
      presaleLiquidity: this.fb.group({
        tokensInPresale: '',
        tokensInLiquidity: '',
        algoToLiquidity: '',
        presaleFundsToLiquidity: '',
      }),
    }),
    liquidity: this.fb.group({
      tokensToLiq: '',
      algoToLiq: '',
    }),
    tradingStart: this.fb.control(''),
    addRoadMapOptionGroup: this.fb.group({
      roadmapDescription: '',
      roadmapImage: '',
    }),
    teamInfoOptionGroup: this.fb.group({
      teamInfoImage: '',
      name: '',
      position: '',
      social: '',
    }),
    presaleCheck: this.fb.control(false),
    roadmapCheck: this.fb.control(false),
    teamInfoCheck: this.fb.control(false),
  });

  submit() {}

  check() {
    if (this.checkbox.nativeElement.checked) {
      this.isCheckedRoadMap = true;
    } else {
      this.isCheckedRoadMap = false;
    }
  }

  checkSecond() {
    if (this.checkboxSecond.nativeElement.checked) {
      this.isCheckedTeamInfo = true;
    } else {
      this.isCheckedTeamInfo = false;
    }
  }

  addExtraFields(index: number) {
    if (index === 0) {
      this.extraFieldsArr.push(1);
    } else {
      this.extraFieldsArr.pop();
    }
  }

  activatePurposeSection() {
    if (this.checkboxPurpose.nativeElement.checked) {
      this.purposeIsChecked = true;
    } else {
      this.purposeIsChecked = false;
    }
  }

  activatePresaleSection() {
    if (this.checkPresale.nativeElement.checked) {
      this.presaleIsChecked = true;
    } else {
      this.presaleIsChecked = false;
    }
  }

  onImageUpload(event: any) {
    let imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageURL = reader.result as string;
    };
    reader.readAsDataURL(imageFile);
  }
}
