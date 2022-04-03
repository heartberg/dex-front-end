import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {DeployedApp} from "../../blockchain/deployer_application";
import {DeployedAppSettings} from "../../blockchain/platform-conf";

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

  blockchainObect: DeployedAppSettings = {
    creator: '',
    // @ts-ignore
    total_supply: 9007199254740991n,
    buy_burn: 22,
    sell_burn: 34,
    transfer_burn: 2,
    to_lp: 23,
    to_backing: 23,
    max_buy: 293,
    name: 'saba',
    unit: 'unit', // not *
    decimals: 21,
    url: 'url', // not *,
    trading_start: 23004,
    initial_token_liq: 23,
    initial_algo_liq: 2,
    initial_algo_liq_fee: 2,
    contract_id: 23, // not *
    contract_address: 'saba', // not *
    asset_id: 21, // not *
    presale_settings: {
      presale_token_amount: 21,
      presale_start: 21,
      presale_end: 12,
      to_lp: 1,
      softcap: 1,
      hardcap: 1,
      walletcap: 12
    } // not *
  };

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

  setObjForBlockchain(): void {
    // @ts-ignore
    this.blockchainObect = {
      creator: 'saba',
      total_supply: this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value,
      buy_burn: this.deployFormGroup.get('feesGroup.buyBurn')?.value,
      sell_burn: this.deployFormGroup.get('feesGroup.sellBurn')?.value,
      transfer_burn: this.deployFormGroup.get('tokenInfoGroup.sellBurn')?.value, // to ask
      to_lp: this.deployFormGroup.get('tokenInfoGroup.sellBurn')?.value, // to ask
      to_backing: this.deployFormGroup.get('feesGroup.backing')?.value,
      max_buy: this.deployFormGroup.get('tokenInfoGroup.maxBuy')?.value,
      name: this.deployFormGroup.get('tokenInfoGroup.tokenName')?.value,
      unit: this.deployFormGroup.get('tokenInfoGroup.unitName')?.value || null,
      decimals: this.deployFormGroup.get('tokenInfoGroup.decimals')?.value,
      url: this.deployFormGroup.get('tokenInfoGroup.URL')?.value || null,
      trading_start: this.deployFormGroup.get('tradingStart')?.value,
      initial_token_liq: this.deployFormGroup.get('liquidity.tokensToLiq')?.value,
      initial_algo_liq: this.deployFormGroup.get('liquidity.algoToLiq')?.value,
      // initial_algo_liq_fee: ,
      contract_id: this.deployFormGroup.get('additionalFeeOptionGroup.address')?.value || null, // ask
      contract_address: this.deployFormGroup.get('additionalFeeOptionGroup.address')?.value || null,
      asset_id: this.deployFormGroup.get('additionalFeeOptionGroup.address')?.value || null, // ask,
      presale_settings: {
        presale_token_amount: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value, // to ask
        presale_start: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value,
        presale_end: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value,
        to_lp: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value, // to ask
        softcap: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value,
        hardcap: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value,
        walletcap: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value,
      } || null
    }
  }

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

  submit() {
    // this.blockchainObect.creator =
  }

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
