import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
// import {DeployedApp} from "../../blockchain/deployer_application";
import {WalletsConnectService} from "../../services/wallets-connect.service";
import { of } from 'rxjs';
import {DeployedApp} from "../../blockchain/deployer_application";
import {DeployedAppSettings} from "../../blockchain/platform-conf";
import {FormBuilder} from "@angular/forms";
import {environment} from "../../../environments/environment";
import { PropertyWrite } from '@angular/compiler';
import { env } from 'process';

@Component({
  selector: 'app-deploy',
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss']
})
export class DeployComponent implements OnInit {
  isCheckedRoadMap: boolean = false;
  isCheckedTeamInfo: boolean = false;
  extraFieldsArr: number[] = [1];
  purposeIsChecked: boolean = false;
  presaleIsChecked: boolean = false;
  fee = environment.Y_FEE;
  blockchainObect: DeployedAppSettings = {
    creator: '',
    // @ts-ignore
    extra_fee_time: 300,
    total_supply: 9007199254740991,
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
    initial_algo_liq_with_fee: 2,
    initial_algo_liq: 3,
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

  sessionWallet: any;

  constructor(
    private walletProviderService: WalletsConnectService,
    private deployerBC: DeployedApp,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.sessionWallet = this.walletProviderService.sessionWallet;
    console.log('sessionWallet', this.sessionWallet)
  }

  @ViewChild('checkbox', { static: false})
  // @ts-ignore
  private checkbox: ElementRef;

  @ViewChild('checkboxSecond', {static: false})
  // @ts-ignore
  private checkboxSecond: ElementRef;

  @ViewChild('checkboxPurpose', {static: false})
  // @ts-ignore
  private checkboxPurpose: ElementRef;

  @ViewChild('checkPresale', {static: false})
  // @ts-ignore
  private checkPresale: ElementRef;

  imageURL: string = ''

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
      this.extraFieldsArr.pop()
    }
  }

  // for form intitialize
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
  // for form intitialize

  blockchainObjInitialize(): DeployedAppSettings {
    let initial_algo_liq_with_fee;
    let initial_token_liq;

    let decimals = +this.deployFormGroup.get('tokenInfoGroup.decimals')?.value
    if(this.presaleIsChecked){
      initial_algo_liq_with_fee = Math.floor(+this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.algoToLiquidity')?.value  * 1_000_000 / (1 - this.fee))
      initial_token_liq = +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInLiquidity')?.value * Math.pow(10, decimals)
    } else {
      initial_algo_liq_with_fee = Math.floor(+this.deployFormGroup.get('liquidity.algoToLiq')?.value  * 1_000_000 / (1 - this.fee))
      initial_token_liq = +this.deployFormGroup.get('liquidity.tokensToLiq')?.value * Math.pow(10, decimals)
    }
    console.log(initial_algo_liq_with_fee)
    console.log(initial_token_liq)
    let tradeStart =  parseInt((new Date(this.deployFormGroup.get('tradingStart')?.value).getTime() / 1000).toFixed(0))
    
    return this.blockchainObect = {
      extra_fee_time: 300,
      creator: this.sessionWallet.wallet.getDefaultAccount(),
      total_supply: +this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, decimals),
      buy_burn: +this.deployFormGroup.get('feesGroup.buyBurn')?.value * 100,
      sell_burn: +this.deployFormGroup.get('feesGroup.sellBurn')?.value * 100,
      transfer_burn: +this.deployFormGroup.get('feesGroup.sendBurn')?.value * 100,
      to_lp: +this.deployFormGroup.get('feesGroup.risingPriceFloor')?.value * 100,
      to_backing: +this.deployFormGroup.get('feesGroup.backing')?.value * 100,
      max_buy: +this.deployFormGroup.get('tokenInfoGroup.maxBuy')?.value,
      name: this.deployFormGroup.get('tokenInfoGroup.tokenName')?.value,
      unit: this.deployFormGroup.get('tokenInfoGroup.unitName')?.value || null,
      decimals: decimals,
      url: this.deployFormGroup.get('tokenInfoGroup.URL')?.value || null,
      trading_start: tradeStart,
      initial_token_liq: initial_token_liq,
      initial_algo_liq_with_fee: initial_algo_liq_with_fee,
      initial_algo_liq: initial_algo_liq_with_fee - Math.floor(initial_algo_liq_with_fee * this.fee),
      presale_settings: {
        presale_token_amount: +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, decimals),
        to_lp: this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.presaleFundsToLiquidity')?.value * 100,
        presale_start: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value).getTime() / 1000).toFixed(0)),
        presale_end: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value).getTime() / 1000).toFixed(0)),
        softcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value,
        hardcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value,
        walletcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value,
      } || null
    }
  }

  async onSubmit() {
    this.sessionWallet = this.walletProviderService.sessionWallet;

    this.blockchainObjInitialize();
    console.log(this.blockchainObect);
    console.log(this.sessionWallet);
    let response = await this.deployerBC.deploy(this.sessionWallet, this.blockchainObect);
    console.log(response)
    // If successfull show popup: "Deployed Contract", send to backend
    
    response = await this.deployerBC.mint(this.sessionWallet, this.blockchainObect);
    // If successfull show popup: "Minted", send to backend

    response = await this.deployerBC.payAndOptInBurn(this.sessionWallet, this.blockchainObect);
    // If successfull show popup: "Opted In Burn address", send to backend

    //If no presale:
    //response = await this.deployerBC.setupNoPresale(this.sessionWallet, this.blockchainObect);
    // If presale: 
    response = this.deployerBC.setupWithPresale(this.sessionWallet, this.blockchainObect);
    // If successfull show popup: "Smart Token successfully deployed!" and send to backend

  }

  activatePurposeSection() {
    if (this.checkboxPurpose.nativeElement.checked) {
      this.purposeIsChecked = true
    } else  {
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
    }
    reader.readAsDataURL(imageFile);
  }
}
