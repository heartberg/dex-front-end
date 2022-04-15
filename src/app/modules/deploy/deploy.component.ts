import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
// import {DeployedApp} from "../../blockchain/deployer_application";
import {WalletsConnectService} from "../../services/wallets-connect.service";
import { of } from 'rxjs';
import {DeployedApp} from "../../blockchain/deployer_application";
import {DeployedAppSettings} from "../../blockchain/platform-conf";
import {FormBuilder, FormGroup} from "@angular/forms";
import {environment} from "../../../environments/environment";
import {DeployLb} from "./deploy-api-logic-file/deploy.lb";

@Component({
  selector: 'app-deploy-api-logic-file',
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
  sessionWallet: any;
  blockchainObect: DeployedAppSettings | undefined;

  // @ts-ignore
  deployFormGroup: FormGroup;

  constructor(
    private walletProviderService: WalletsConnectService,
    private deployerBC: DeployedApp,
    private fb: FormBuilder,
    private deployLib: DeployLb
  ) {}

  ngOnInit(): void {

    this.initiializeForm();

    // of(this.walletProviderService.payToSetUpIndex('ZOLXPN2IQYCDBYQMA42S2WCPJJYMQ7V3OCMEBCBQFGUEUH3ATVPFCMUYYE', 1)).subscribe(
    //   (item: any) => {
    //     console.log(item);
    //   }
    // )

    // this.deployerBC.settings = {
    //   creator: 'saba',
    //   // @ts-ignore
    //   total_supply: 9007199254740991n,
    //   buy_burn: 210,
    //   sell_burn: 123,
    //   transfer_burn: 123,
    //   to_lp: 239,
    //   to_backing: 20,
    //   max_buy: 20,
    //   name: 'saeee',
    //   unit: 'dsfm',
    //   decimals: 2.4,
    //   url: '',
    //   trading_start: 23405,
    //   initial_token_liq: 23405,
    //   initial_algo_liq: 23405,
    //   initial_algo_liq_fee: 23405,
    //   contract_id: 2,
    //   contract_address: 'sjkjd',
    //   asset_id: 234,
    //   // @ts-ignore
    //   presale_settings: {}
    // }
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

  initiializeForm(): void {
    this.deployFormGroup = this.fb.group({
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
  }

  blockchainObjInitialize(): DeployedAppSettings {
    return this.blockchainObect = {
      creator: 'saba',
      total_supply: this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value,
      buy_burn: this.deployFormGroup.get('feesGroup.buyBurn')?.value,
      sell_burn: this.deployFormGroup.get('feesGroup.sellBurn')?.value,
      transfer_burn: this.deployFormGroup.get('feesGroup.sendBurn')?.value,
      to_lp: this.deployFormGroup.get('feesGroup.risingPriceFloor')?.value,
      to_backing: this.deployFormGroup.get('feesGroup.backing')?.value,
      max_buy: this.deployFormGroup.get('tokenInfoGroup.maxBuy')?.value,
      name: this.deployFormGroup.get('tokenInfoGroup.tokenName')?.value,
      unit: this.deployFormGroup.get('tokenInfoGroup.unitName')?.value || null,
      decimals: this.deployFormGroup.get('tokenInfoGroup.decimals')?.value,
      url: this.deployFormGroup.get('tokenInfoGroup.URL')?.value || null,
      trading_start: this.deployFormGroup.get('tradingStart')?.value,
      initial_token_liq: this.deployFormGroup.get('liquidity.tokensToLiq')?.value,
      initial_algo_liq: this.deployFormGroup.get('liquidity.algoToLiq')?.value,
      initial_algo_liq_fee: this.fee * +this.deployFormGroup.get('liquidity.algoToLiq')?.value,
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


  onSubmit() {
    this.sessionWallet = this.walletProviderService.sessionWallet;
    // console.log('sessionWallet', this.sessionWallet)
    // console.log('saba');
    // this.deployerBC.deploy(this.sessionWallet, this.blockchainObect);
    // this.deployLib.
    setTimeout(() => {
      this.deployLib.DeployFinalFunc(false, this.deployFormGroup);
    }, 2000)
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
