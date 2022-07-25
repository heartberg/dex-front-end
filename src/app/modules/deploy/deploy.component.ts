import {Component, DoCheck, ElementRef, OnInit, ViewChild} from '@angular/core';
// import {DeployedApp} from "../../blockchain/deployer_application";
import {WalletsConnectService} from "../../services/wallets-connect.service";
import {DeployedApp} from "../../blockchain/deployer_application";
import {DeployedAppSettings, StakingSetup, PresaleSettings} from "../../blockchain/platform-conf";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {environment} from "../../../environments/environment";
import {DeployLb} from "./deploy-api-logic-file/deploy.lb";
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { AssetViewModel } from 'src/app/models/assetViewModel';
import { platform_settings as ps } from '../../blockchain/platform-conf';
import { of } from 'rxjs';
import { VerseApp } from 'src/app/blockchain/verse_application';
interface member {
  name: string,
  role: string,
  social: string,
}

export type AsaPresaleSettings = {
  contractId: number,
  presaleTokenAmount: number,
  presaleStart: number,
  presaleEnd: number,
  softcap: number,
  hardcap: number,
  walletcap: number,
  vestingRelease?: number,
  vestingIntervalNumber?: number,
  vestingIntervalLength?: number
}

export type AsaSettings = {
  creator: string,
  totalSupply: number,
  name: string,
  unit: string,
  decimals: number,
  url: string,
  assetId?: number,
  poolStart?: number,
  poolRewards?: number,
  poolInterval?: number,
  rewardsPerInterval?: number,
  poolDuration?: number,
  stakingContractId?: number,
  isDistribution: boolean,
  presaleSettings?: AsaPresaleSettings
}

@Component({
  selector: 'app-deploy-api-logic-file',
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss']
})

export class DeployComponent implements OnInit, DoCheck {
  name: string = '';
  role: string = '';
  social: string = '';

  isSmartAsaDeploy: boolean = true;
  isStakingDeploy: boolean = false;
  isAsaDeploy: boolean = false;
  isDistributionPool: boolean = false;

  isCheckedVested: boolean = false;
  isCheckedRoadMap: boolean = false;
  isCheckedTeamInfo: boolean = false;
  isCheckedStaking: boolean = false;
  extraFieldsArr: any[] = [
    1
  ];
  purposeIsChecked: boolean = false;
  presaleIsChecked: boolean = false;
  feeState: any;

  tokenLiquidityPercentage = 0;
  tokenPresalePercentage = 0;
  initialPrice = 0;
  minInitialPrice = 0;
  presalePrice = 0;

  tokensPerInterval = 0;
  estimatedApy = 0;

  sessionWallet: any;
  blockchainObject: DeployedAppSettings | undefined;
  standardBlockchainObject: AsaSettings | undefined;
  // @ts-ignore
  deployFormGroup: FormGroup;
  // @ts-ignore
  stakingFormGroup: FormGroup;
  stakingSetup: StakingSetup | undefined;

  // Staking Section
  selectedStakingAsset: number = 0;
  selectedAssetContract: number | null = null;
  selectedAssetProject: string | null = null;
  selectedAssetDecimal = 0;

  smartAsas: AssetViewModel[] = []
  assetArray: string[] = []
  ownedAssets: any[] = []
  availableStakingAmount = 0

  ///
  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;
  ///

  teamInfo: any[] = [
  ];
  releasePerInterval: number = 0;

  // extra added for team members
  extraAdded: boolean = false;
  secondForm: boolean = false;
  thirdForm: boolean = false;
  fourthForm: boolean = false;
  fifthForm: boolean = false;
  sixthForm: boolean = false;
  seventhForm: boolean = false;
  eighthForm: boolean = false;
  ninethForm: boolean = false;
  tenthForm: boolean = false;
  eleventhForm: boolean = false;
  twelvethForm: boolean = false;
  thirteenthForm: boolean = false;
  fourtheenthForm: boolean = false;
  fifteenthForm: boolean = false;
  // #extra added for team members

  teamInfoOptionSecond: FormGroup | any = {};
  teamInfoOptionThird: FormGroup | any = {};
  teamInfoOptionFourth: FormGroup | any = {};
  teamInfoOptionFifth: FormGroup | any= {};
  teamInfoOptionSixth: FormGroup | any= {};
  // TIO = teamInfoOption
  TIOSeventh: FormGroup | any= {};
  TIOEighth: FormGroup | any= {};
  TIONineth: FormGroup | any= {};
  TIOTenth: FormGroup | any= {};
  TIOEleventh: FormGroup | any= {};
  TIOTwelveth: FormGroup | any= {};
  TIOThirteenth: FormGroup | any= {};
  TIOFourtheenth: FormGroup | any= {};
  TIOFifteenth: FormGroup | any= {};
  teamMemberFinal: any[] = [];

  // validators
  totalSupplyIsInvalid: boolean = false;
  maxBuyIsInvalid: boolean = false;

  constructor(
    private walletProviderService: WalletsConnectService,
    private verseApp: VerseApp,
    private fb: FormBuilder,
    private deployLib: DeployLb,
    private assetService: AssetReqService,

  )
  {
    // TODO Tesco
    this.sessionWallet = this.walletProviderService.sessionWallet;
  }


  ngDoCheck() {
    // if (this.deployFormGroup.get('tokenInfoGroup')?.value) {
    //   if (this.deployFormGroup.get('tokenInfoGroup')?.value.totalSupply.value) {
    //     this.deployFormGroup.get('tokenInfoGroup')?.value.totalSupply.value.valueChanges((res: any) => {
    //       // @ts-ignore
    //       if (+this.deployFormGroup.get('tokenInfoGroup')?.value.totalSupply.value * 10 ^ +this.deployFormGroup.get('tokenInfoGroup')?.value.decimals.value < 2 ^ 64 - 1) {
    //         this.totalSupplyIsInvalid = true
    //       } else {
    //         this.totalSupplyIsInvalid = false;
    //       }
    //     })
    //   }
    // }
    //
    // if (this.deployFormGroup.get('tokenInfoGroup')?.value.maxBuy.value) {
    //   if (this.deployFormGroup.get('tokenInfoGroup')?.value.maxBuy.value) {
    //     this.deployFormGroup.get('tokenInfoGroup')?.value.maxBuy.value.valueChanges((res: any) => {
    //       // @ts-ignore
    //       if (+this.deployFormGroup.get('tokenInfoGroup')?.value.maxBuy.value < 2 ^ 64 - 1) {
    //         this.maxBuyIsInvalid = true
    //       } else {
    //         this.maxBuyIsInvalid = false;
    //       }
    //     });
    //   }
    // }

    if(localStorage.getItem('sendWaitSuccess') === 'pending') {
      this.closePopup = true;
      this.isPending = true;
      this.isFailed = false;
      this.finalStepApi = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'fail') {
      this.closePopup = true;
      this.isFailed = true;
      this.finalStepApi = false;
      this.isPending = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'success') {
      this.closePopup = true;
      this.finalStepApi = true;
      this.isFailed = false;
      this.isPending = false;
    }

  }

  async ngOnInit(): Promise<void> {
    this.initializeForm();
    this.initFormExtra();
    this.feeState = await this.verseApp.getFees()
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

  @ViewChild('checkVested', {static: false})
  // @ts-ignore
  private checkVested: ElementRef;

  @ViewChild('checkDistributionPool', {static: false})
  // @ts-ignore
  private checkDistributionPool: ElementRef;

  @ViewChild('checkboxStaking', {static: false})
  // @ts-ignore
  private checkStaking: ElementRef;

  imageURL: string = ''
  closePopup: boolean = false;

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

  addExtraFields(item: any, i: number) {
    if (i === 1) {
      this.extraAdded = true;
      if (!this.secondForm) {
        this.teamMemberFinal.push(this.deployFormGroup.value.teamInfoOptionGroup);
      } else {
        return;
      }
      this.secondForm = true;
    } else if (i === 2) {
      if (!this.thirdForm) {
        this.teamMemberFinal.push(this.teamInfoOptionSecond.value);
      } else {
        return;
      }
      this.thirdForm = true;
    } else if (i === 3) {
      if (!this.fourthForm) {
        this.teamMemberFinal.push(this.teamInfoOptionThird.value)
      } else {
        return;
      }
      this.fourthForm = true;
    } else if (i === 4) {
      if (!this.fifthForm) {
        this.teamMemberFinal.push(this.teamInfoOptionFourth.value)
      } else {
        return;
      }
      this.fifthForm = true;
    } else if (i === 5) {
      if (!this.sixthForm) {
        this.teamMemberFinal.push(this.teamInfoOptionFifth.value)
      } else {
        return;
      }
      this.sixthForm = true;
    } else if (i === 6) {
      if (!this.seventhForm) {
        this.teamMemberFinal.push(this.teamInfoOptionSixth.value)
      } else {
        return;
      }
      this.seventhForm = true;
    } else if (i === 7) {
      if (!this.eighthForm) {
        this.teamMemberFinal.push(this.TIOSeventh.value)
      } else {
        return;
      }
      this.eighthForm = true;
    } else if (i === 8) {
      if (!this.ninethForm) {
        this.teamMemberFinal.push(this.TIOEighth.value)
      } else {
        return;
      }
      this.ninethForm = true;
    } else if (i === 9) {
      if (!this.tenthForm) {
        this.teamMemberFinal.push(this.TIONineth.value)
      } else {
        return;
      }
      this.tenthForm = true;
    } else if (i === 10) {
      if (!this.eleventhForm) {
        this.teamMemberFinal.push(this.TIOTenth.value)
      } else {
        return;
      }
      this.eleventhForm = true;
    } else if (i === 11) {
      if (!this.twelvethForm) {
        this.teamMemberFinal.push(this.TIOEleventh.value)
      } else {
        return;
      }
      this.twelvethForm = true;
    } else if (i === 12) {
      if (!this.thirteenthForm) {
        this.teamMemberFinal.push(this.TIOTwelveth.value)
      } else {
        return;
      }
      this.thirteenthForm = true;
    } else if (i === 13) {
      if (!this.fourtheenthForm) {
        this.teamMemberFinal.push(this.TIOThirteenth.value)
      } else {
        return;
      }
      this.fourtheenthForm = true;
    } else if (i === 14) {
      if (!this.fifteenthForm) {
        this.teamMemberFinal.push(this.TIOFourtheenth.value)
      } else {
        return;
      }
      this.fifteenthForm = true;
    } else if (i === 15) {
      this.teamMemberFinal.push(this.TIOFifteenth.value);
    }

  }

  removeExtraField(i: number) {
    if (i === 2) {
      this.secondForm = false;
      this.teamInfoOptionSecond.value.name = '';
      this.teamInfoOptionSecond.value.social = '';
      this.teamInfoOptionSecond.value.role = '';
      this.teamInfoOptionSecond.value.image = '';
    } else if (i === 3) {
      this.thirdForm = false;
      this.teamInfoOptionThird.value.name = '';
      this.teamInfoOptionThird.value.social = '';
      this.teamInfoOptionThird.value.role = '';
      this.teamInfoOptionThird.value.image = '';
    } else if (i === 4) {
      this.fourthForm = false;
      this.teamInfoOptionFourth.value.name = '';
      this.teamInfoOptionFourth.value.social = '';
      this.teamInfoOptionFourth.value.role = '';
      this.teamInfoOptionFourth.value.image = '';
    } else if (i === 5) {
      this.fifthForm = false;
      this.teamInfoOptionFifth.value.name = '';
      this.teamInfoOptionFifth.value.social = '';
      this.teamInfoOptionFifth.value.role = '';
      this.teamInfoOptionFifth.value.image = '';
    } else if (i === 6) {
      this.sixthForm = false;
      this.teamInfoOptionSixth.value.name = '';
      this.teamInfoOptionSixth.value.social = '';
      this.teamInfoOptionSixth.value.role = '';
      this.teamInfoOptionSixth.value.image = '';
    } else if (i === 7) {
      this.seventhForm = false;
      this.TIOSeventh.value.name = '';
      this.TIOSeventh.value.social = '';
      this.TIOSeventh.value.role = '';
      this.TIOSeventh.value.image = '';
    } else if (i === 8) {
      this.eighthForm = false;
      this.TIOEighth.value.name = '';
      this.TIOEighth.value.social = '';
      this.TIOEighth.value.role = '';
      this.TIOEighth.value.image = '';
    } else if (i === 9) {
      this.ninethForm = false;
      this.TIONineth.value.name = '';
      this.TIONineth.value.social = '';
      this.TIONineth.value.role = '';
      this.TIONineth.value.image = '';
    } else if (i === 10) {
      this.tenthForm = false;
      this.TIOTenth.value.name = '';
      this.TIOTenth.value.social = '';
      this.TIOTenth.value.role = '';
      this.TIOTenth.value.image = '';
    } else if (i === 11) {
      this.eleventhForm = false;
      this.TIOEleventh.value.name = '';
      this.TIOEleventh.value.social = '';
      this.TIOEleventh.value.role = '';
      this.TIOEleventh.value.image = '';
    } else if (i === 12) {
      this.twelvethForm = false;
      this.TIOTwelveth.value.name = '';
      this.TIOTwelveth.value.social = '';
      this.TIOTwelveth.value.role = '';
      this.TIOTwelveth.value.image = '';
    } else if (i === 13) {
      this.thirteenthForm = false;
      this.TIOThirteenth.value.name = '';
      this.TIOThirteenth.value.social = '';
      this.TIOThirteenth.value.role = '';
      this.TIOThirteenth.value.image = '';
    } else if (i === 14) {
      this.fourtheenthForm = false;
      this.TIOFourtheenth.value.name = '';
      this.TIOFourtheenth.value.social = '';
      this.TIOFourtheenth.value.role = '';
      this.TIOFourtheenth.value.image = '';
    } else if (i === 15) {
      this.fifteenthForm = false;
      this.TIOFifteenth.value.name = '';
      this.TIOFifteenth.value.social = '';
      this.TIOFifteenth.value.role = '';
      this.TIOFifteenth.value.image = '';
    }
    i = i -1;
    this.teamMemberFinal = this.teamMemberFinal.splice(i, 1);
    console.log(this.teamMemberFinal);
  }

  initFormExtra(): void {
    this.teamInfoOptionSecond = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
      this.teamInfoOptionThird = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
      this.teamInfoOptionFourth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
      this.teamInfoOptionFifth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
      this.teamInfoOptionSixth = this.fb.group({
        image: '',
        name: '',
        role: '',
        social: '',
      });
    this.TIOSeventh = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOEighth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIONineth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOTenth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOEleventh = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOTwelveth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOThirteenth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOFourtheenth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
    this.TIOFifteenth = this.fb.group({
      image: '',
      name: '',
      role: '',
      social: '',
    });
  }
  // for form intitialize

  initializeForm(): void {

    this.stakingFormGroup = this.fb.group({
      assetId: '',
      rewardPool:  null,
      rewardInterval: null,
      poolDuration: null,
      poolStart: null,
      distributionPoolCheck: false
    });

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
        purpose: null,
        address: null,
        fee: null
      }),
      projectName: this.fb.control(''),
      presaleOptionsGroupDescription: this.fb.control(''),
      website: this.fb.control(''),
      discord: this.fb.control(''),
      twitter: this.fb.control(''),
      telegram: this.fb.control(''),
      createPresaleOptionGroup: this.fb.group({
        presaleSettings: this.fb.group({
          presaleStart: '',
          presaleEnd: '',
          softCap: '',
          hardCap: '',
          walletCap: ''
        }),
        checkVested: this.fb.control(false),
        vestedReleaseSettings: this.fb.group({
          release: '',
          releaseInterval: '',
          releaseIntervalNumber: ''
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
      extraFeeTime: this.fb.control(''),
      addRoadMapOptionGroup: this.fb.group({
        roadmapDescription: '',
        roadmapImage: '',
      }),
      teamInfoOptionGroup: this.fb.group({
        image: '',
        name: '',
        role: '',
        social: '',
      }),
      presaleCheck: this.fb.control(false),
      roadmapCheck: this.fb.control(false),
      teamInfoCheck: this.fb.control(false),
      stakingCheck: this.fb.control(false),
      stakingGroup: this.fb.group({
        rewardPool:  null,
        rewardInterval: null,
        poolDuration: null,
        poolStart: null
      })
    });
    // for form intitialize
    this.deployFormGroup.valueChanges.subscribe(x => {
      this.setPriceFields()
      this.setStakingFields()
      this.setVestingFields()
    });

    this.stakingFormGroup.valueChanges.subscribe(x => {
      this.stakingSectionSetStakingFields()
    })
  }

  setVestingFields() {
    if(this.isCheckedVested) {
      let releaseIntervalNumbers = +this.deployFormGroup.get("createPresaleOptionGroup.vestedReleaseSettings.releaseIntervalNumber")?.value
      if(releaseIntervalNumbers != 0){
        this.releasePerInterval = (1 / releaseIntervalNumbers) * 100
      } else {
        this.releasePerInterval = 0
      }
    } else {
      this.releasePerInterval = 0
    }
  }

  blockchainObjInitialize(): DeployedAppSettings {
    let initial_algo_liq_with_fee;
    let initial_algo_liq;
    let initial_token_liq;
    let release;
    let releaseInterval;
    let releaseIntervalNumber = undefined;
    let presaleSettings = undefined;

    let decimals = +this.deployFormGroup.get('tokenInfoGroup.decimals')?.value
    if(this.presaleIsChecked){
      initial_algo_liq = Math.floor(+this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.algoToLiquidity')?.value  * 1_000_000)
      initial_algo_liq_with_fee = Math.floor(initial_algo_liq / (10000 - this.feeState.presale_fee) / 10000)
      initial_token_liq = +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInLiquidity')?.value * Math.pow(10, decimals)
      if(this.isCheckedVested) {
        release = parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.release')?.value).getTime() / 1000).toFixed(0))
        releaseInterval = +this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.releaseInterval')?.value * 86400
        releaseIntervalNumber = +this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.releaseIntervalNumber')?.value
      }

      presaleSettings = {
        presaleTokenAmount: +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, decimals),
        toLp: this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.presaleFundsToLiquidity')?.value * 100,
        presaleStart: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value).getTime() / 1000).toFixed(0)),
        presaleEnd: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value).getTime() / 1000).toFixed(0)),
        softcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value * 1_000_000,
        hardcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value * 1_000_000,
        walletcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value * 1_000_000,
        vestingRelease: release,
        vestingReleaseInterval: releaseInterval,
        vestingReleaseIntervalNumber: releaseIntervalNumber
      }
    } else {
      initial_algo_liq = Math.floor(+this.deployFormGroup.get('liquidity.algoToLiq')?.value  * 1_000_000)
      initial_algo_liq_with_fee = Math.floor(initial_algo_liq / (10000 - this.feeState.presale_fee) / 10000)
      initial_token_liq = +this.deployFormGroup.get('liquidity.tokensToLiq')?.value * Math.pow(10, decimals)
    }

    let tradeStart =  parseInt((new Date(this.deployFormGroup.get('tradingStart')?.value).getTime() / 1000).toFixed(0))
    let totalSupply = +this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value

    let poolStart = parseInt((new Date(this.deployFormGroup.get('stakingGroup.poolStart')?.value).getTime() / 1000).toFixed(0))
    let poolRewards = Math.floor(+this.deployFormGroup.get('stakingGroup.rewardPool')?.value * Math.pow(10, decimals))
    let poolInterval = +this.deployFormGroup.get('stakingGroup.rewardInterval')?.value * 86400
    let poolDuration = +this.deployFormGroup.get('stakingGroup.poolDuration')?.value * 86400
    let rewardsPerInterval = undefined
    if(poolRewards != 0 && poolInterval != 0 && poolDuration != 0) {
      rewardsPerInterval = Math.floor(poolRewards / (poolDuration / poolInterval))
      if(poolRewards >= 0.03 * totalSupply) {
        initial_algo_liq_with_fee = initial_algo_liq
      }
    }

    // @ts-ignore
    return this.blockchainObject = {
      extraFeeTime: +this.deployFormGroup.get('extraFeeTime')?.value,
      creator: this.sessionWallet.wallet.getDefaultAccount(),
      totalSupply: totalSupply * Math.pow(10, decimals),
      buyBurn: +this.deployFormGroup.get('feesGroup.buyBurn')?.value * 100,
      sellBurn: +this.deployFormGroup.get('feesGroup.sellBurn')?.value * 100,
      transferBurn: +this.deployFormGroup.get('feesGroup.sendBurn')?.value * 100,
      toLp: +this.deployFormGroup.get('feesGroup.risingPriceFloor')?.value * 100,
      toBacking: +this.deployFormGroup.get('feesGroup.backing')?.value * 100,
      maxBuy: +this.deployFormGroup.get('tokenInfoGroup.maxBuy')?.value * 1_000_000,
      name: this.deployFormGroup.get('tokenInfoGroup.tokenName')?.value,
      unit: this.deployFormGroup.get('tokenInfoGroup.unitName')?.value || null,
      decimals: decimals,
      url: this.deployFormGroup.get('tokenInfoGroup.URL')?.value || null,
      tradingStart: tradeStart,
      initialTokenLiq: initial_token_liq,
      initialAlgoLiqWithFee: initial_algo_liq_with_fee,
      initialAlgoLiq: initial_algo_liq_with_fee - Math.floor(initial_algo_liq_with_fee * this.feeState.presale_fee / 10000),
      additionalFee: +this.deployFormGroup.get('feesGroup.fee')?.value * 100,
      additionalFeeAddress: this.deployFormGroup.get('feesGroup.address')?.value,
      poolStart: poolStart,
      poolInterval: poolInterval,
      poolRewards: poolRewards,
      rewardsPerInterval: rewardsPerInterval,
      poolDuration: poolDuration,
      presaleSettings: presaleSettings
    } || null
  }

  async smartAsaDeploy() {
    this.blockchainObjInitialize();
    console.log(this.blockchainObject)
    localStorage.setItem('blockchainObj', JSON.stringify(this.blockchainObject)!);
    // this.deployLib.initializeApiObj(this.deployFormGroup);
    if(this.presaleIsChecked){
      this.deployLib.initializeApiObjWithPresale(this.deployFormGroup);
      console.log(this.deployFormGroup.value);
      this.deployLib.DeployFinalFunc(true, this.deployFormGroup);
    } else {
      this.deployLib.initializeApiObjWithoutPresale(this.deployFormGroup);
      console.log(this.deployFormGroup.value);
      this.deployLib.DeployFinalFunc(false, this.deployFormGroup);
    }

    console.log(this.blockchainObject);
    console.log(this.sessionWallet);
  }

  async getSelectedAsset(event: string) {
    let splits = event.split(" ")
    console.log(splits)
    let length = splits.length
    this.selectedStakingAsset = parseInt(splits[length-1])
    let asset = this.ownedAssets.find(element => {
      return element['asset-id'] == this.selectedStakingAsset
    });
    if(asset){
      let client: Algodv2 = getAlgodClient()
      let assetInfo = await client.getAssetByID(this.selectedStakingAsset).do()
      this.availableStakingAmount = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
      this.selectedAssetDecimal = assetInfo['params']['decimals']
    } else {
      this.availableStakingAmount = 0
    }
  }

  initializeStakingObject() {
    this.stakingSetup = {
      assetId: this.selectedStakingAsset,
      poolDuration: +this.stakingFormGroup.get('poolDuration')?.value * 86400,
      poolInterval: this.stakingFormGroup.get('rewardInterval')?.value * 86400,
      poolRewards: this.stakingFormGroup.get('rewardPool')?.value * Math.pow(10, this.selectedAssetDecimal),
      poolStart: parseInt((new Date(this.stakingFormGroup.get('poolStart')?.value).getTime() / 1000).toFixed(0)),
      rewardsPerInterval: parseInt((this.tokensPerInterval * Math.pow(10, this.selectedAssetDecimal)).toFixed(0)),
      assetContractId: null,
      projectId: null,
      isDistribution: this.isDistributionPool
    }
  }

  async stakingDeploy() {
    this.initializeStakingObject()
    this.deployLib.deployStaking(this.stakingSetup!)
  }

  asaObjectInitialize() {
    let decimals = +this.deployFormGroup.get('tokenInfoGroup.decimals')?.value

    let poolStart = parseInt((new Date(this.deployFormGroup.get('stakingGroup.poolStart')?.value).getTime() / 1000).toFixed(0))
    let poolRewards = Math.floor(+this.deployFormGroup.get('stakingGroup.rewardPool')?.value * Math.pow(10, decimals))
    let poolInterval = +this.deployFormGroup.get('stakingGroup.rewardInterval')?.value * 86400
    let poolDuration = +this.deployFormGroup.get('stakingGroup.poolDuration')?.value * 86400
    let rewardsPerInterval = undefined
    let standardDistribution = false
    if(poolRewards != 0 && poolInterval != 0 && poolDuration != 0) {
      rewardsPerInterval = Math.floor(poolRewards / (poolDuration / poolInterval))
    }

    this.standardBlockchainObject = {
      creator: this.sessionWallet.wallet.getDefaultAccount(),
      totalSupply: +this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, decimals),
      name: this.deployFormGroup.get('tokenInfoGroup.tokenName')?.value,
      unit: this.deployFormGroup.get('tokenInfoGroup.unitName')?.value || null,
      decimals: decimals,
      url: this.deployFormGroup.get('tokenInfoGroup.URL')?.value || null,
      poolStart: poolStart,
      poolInterval: poolInterval,
      poolRewards: poolRewards,
      rewardsPerInterval: rewardsPerInterval,
      poolDuration: poolDuration,
      isDistribution: false,
      presaleSettings: {
        contractId: 0,
        presaleTokenAmount: +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, decimals),
        presaleStart: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value).getTime() / 1000).toFixed(0)),
        presaleEnd: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value).getTime() / 1000).toFixed(0)),
        softcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value * 1_000_000,
        hardcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value * 1_000_000,
        walletcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value * 1_000_000,
      } || null
    }
  }

  async asaDeploy() {
    this.asaObjectInitialize()
    localStorage.setItem('standardBlockchainObj', JSON.stringify(this.standardBlockchainObject)!);
    if(this.presaleIsChecked) {
      this.deployLib.initializeApiObjWithPresale(this.deployFormGroup)
      this.deployLib.DeployStandardAssetWithPresale()
    } else {
      this.deployLib.initializeApiObjWithoutPresale(this.deployFormGroup)
      this.deployLib.DeployStandardAssetWithoutPresale()
    }

  }

  async onSubmit() {
    this.teamMemberFinal = [];
    this.teamMemberFinal.push(this.deployFormGroup.value.teamInfoOptionGroup, this.teamInfoOptionSecond.value, this.teamInfoOptionThird.value, this.teamInfoOptionFourth.value, this.teamInfoOptionFifth.value, this.teamInfoOptionSixth.value, this.TIOSeventh.value, this.TIOEighth.value, this.TIONineth.value, this.TIOTenth.value, this.TIOEleventh.value, this.TIOTwelveth.value, this.TIOThirteenth.value, this.TIOFourtheenth.value, this.TIOFifteenth.value);
    let finalArr: any[] = [];
    this.teamMemberFinal.filter((item: {name: string, social: string, role: string, image: string}, index: number) => {
      if (!item.name.length) {
        this.teamMemberFinal.splice(index, 1);
      } else {
        finalArr.push(this.teamMemberFinal[index])
      }
    })
    this.teamMemberFinal = [];
    this.teamMemberFinal = [...finalArr];
    console.log(this.teamMemberFinal, 'final');
    localStorage.setItem('teamArray', JSON.stringify(this.teamMemberFinal));
    // end of extra field
    this.sessionWallet = this.walletProviderService.sessionWallet;
    console.log(this.sessionWallet)
    if(this.isSmartAsaDeploy) {
      await this.smartAsaDeploy()
    } else if(this.isStakingDeploy){
      await this.stakingDeploy()
    } else {
      await this.asaDeploy()
    }
  }

  activatePurposeSection() {
    if (this.checkboxPurpose.nativeElement.checked) {
      this.purposeIsChecked = true
    } else  {
      this.purposeIsChecked = false;
      this.deployFormGroup.get('feesGroup.fee')?.setValue(null)
      this.deployFormGroup.get('feesGroup.purpose')?.setValue(null)
      this.deployFormGroup.get('feesGroup.address')?.setValue(null)
    }
  }

  activatePresaleSection() {
    if (this.checkPresale.nativeElement.checked) {
      this.presaleIsChecked = true;
    } else {
      this.presaleIsChecked = false;
      this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('presaleStart')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('presaleEnd')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('hardCap')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('softCap')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('walletCap')?.setValue(null)

      this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('tokensInPresale')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('tokensInLiquidity')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('algoToLiquidity')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('presaleFundsToLiquidity')?.setValue(null)

      this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.releaseIntervalNumber')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.release')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.releaseInterval')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.checkVested')?.setValue(false)
      this.isCheckedVested = false;
    }
  }

  activateVestedSection() {
    if(this.checkVested.nativeElement.checked) {
      this.isCheckedVested = true;
    } else {
      this.isCheckedVested = false;
      this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.releaseIntervalNumber')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.release')?.setValue(null)
      this.deployFormGroup.get('createPresaleOptionGroup.vestedReleaseSettings.releaseInterval')?.setValue(null)
    }
  }

  activateDistributionPool() {
    if(this.checkDistributionPool.nativeElement.checked) {
      this.isDistributionPool = true;
    } else {
      this.isDistributionPool = false;
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

  setPriceFields() {
    let totalSupply = +this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value
    if(this.presaleIsChecked){
      let hardCap = +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value
      let softCap = +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value
      let algoLiq = +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.algoToLiquidity')?.value
      let presaleAlgoToLiq = +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.presaleFundsToLiquidity')?.value
      let tokensInPresale = +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value
      let tokenLiq = +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInLiquidity')?.value

      if(tokenLiq == 0) {
        this.initialPrice = 0
        this.minInitialPrice = 0
      } else {
        this.initialPrice = (algoLiq + presaleAlgoToLiq * hardCap / 100) / tokenLiq
        this.minInitialPrice = (algoLiq + presaleAlgoToLiq * softCap / 100) / tokenLiq
      }
      if(tokensInPresale == 0) {
        this.presalePrice = 0
      } else {
        this.presalePrice = hardCap / tokensInPresale
      }
      if(totalSupply == 0){
        this.tokenLiquidityPercentage = 0
        this.tokenPresalePercentage = 0
      } else {
        this.tokenLiquidityPercentage = tokenLiq / totalSupply * 100
        this.tokenPresalePercentage = tokensInPresale / totalSupply * 100
      }

    } else {
      let algoLiq = +this.deployFormGroup.get('liquidity.algoToLiq')?.value
      let tokenLiq = +this.deployFormGroup.get('liquidity.tokensToLiq')?.value

      if(tokenLiq == 0){
        this.initialPrice = 0
      } else {
        this.initialPrice = algoLiq / tokenLiq
      }
      if(totalSupply == 0) {
        this.tokenLiquidityPercentage = 0
      } else {
        this.tokenLiquidityPercentage = tokenLiq / totalSupply * 100
      }

    }

  }

  setStakingFields() {
    if(this.isCheckedStaking) {
      let rewardPool = +this.deployFormGroup.get('stakingGroup.rewardPool')?.value
      let poolDuration = +this.deployFormGroup.get('stakingGroup.poolDuration')?.value
      let poolInterval = +this.deployFormGroup.get('stakingGroup.rewardInterval')?.value
      if(rewardPool != 0 && poolDuration != 0 && poolInterval != 0) {
        this.tokensPerInterval = rewardPool / (poolDuration / poolInterval)
      } else {
        this.tokensPerInterval = 0
      }
    }
  }

  stakingSectionSetStakingFields() {
    let poolDuration = +this.stakingFormGroup.get('poolDuration')?.value
    let poolInterval = this.stakingFormGroup.get('rewardInterval')?.value
    let poolRewards = this.stakingFormGroup.get('rewardPool')?.value
    if(poolRewards != 0 && poolDuration != 0 && poolInterval != 0) {
      this.tokensPerInterval = poolRewards / (poolDuration / poolInterval)
    } else {
      this.tokensPerInterval = 0
    }
  }

  activateStakingSection() {
    if (this.checkStaking.nativeElement.checked) {
      this.isCheckedStaking = true;
    } else {
      this.isCheckedStaking = false;
    }
  }

  closePopUp(event: boolean) {
    this.closePopup = event;
  }

  smartAsa() {
    this.isSmartAsaDeploy = true;
    this.isStakingDeploy = false;
    this.isAsaDeploy = false;
    this.resetFormGroup()
    this.setStakingFields()
  }

  asa() {
    this.isSmartAsaDeploy = false;
    this.isStakingDeploy = false;
    this.isAsaDeploy = true;
    this.resetFormGroup()
  }

  async staking() {
    this.isSmartAsaDeploy = false;
    this.isStakingDeploy = true;
    this.isAsaDeploy = false;
    this.resetFormGroup()
    this.stakingSectionSetStakingFields()
    let client: Algodv2 = getAlgodClient()
    let wallet = localStorage.getItem('wallet')
    if(wallet) {
      this.assetArray = []
      this.assetService.getAssetPairs(true, '', wallet).subscribe(
        async (res: AssetViewModel[]) => {
          this.smartAsas = res
          let info = await client.accountInformation(wallet!).do()
          let assetsInWallet = info['assets']
          this.ownedAssets = assetsInWallet
          assetsInWallet.forEach(async (element: { [key: string]: number; }) => {
            let asset = res.find( x => {
              return x.assetId == element['asset-id']
            })
            console.log(asset)
            if(!asset) {
              let assetInfo = await client.getAssetByID(element['asset-id']).do()
              this.assetArray.push(assetInfo['params']['name'] + " ASA ID: " + element['asset-id'])
            }
          });
        }
      )
    } else {
      console.log("connect wallet")
    }
  }

  removeVerse(arr: AssetViewModel[]){
    arr.forEach( (item, index) => {
      if(item.assetId === ps.platform.verse_asset_id) arr.splice(index,1);
    });
  }

  resetFormGroup() {
    this.purposeIsChecked = false
    this.deployFormGroup.get('tokenInfoGroup')?.get('maxBuy')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('risingPriceFloor')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('backing')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('buyBurn')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('sellBrun')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('sendBurn')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('purpose')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('purpose')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('address')?.setValue(null)
    this.deployFormGroup.get('feesGroup')?.get('fee')?.setValue(null)

    this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('presaleStart')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('presaleEnd')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('hardCap')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('softCap')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings')?.get('walletCap')?.setValue(null)

    this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('tokensInPresale')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('tokensInLiquidity')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('algoToLiquidity')?.setValue(null)
    this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity')?.get('presaleFundsToLiquidity')?.setValue(null)

    this.deployFormGroup.get('liquidity')?.get('tokensToLiq')?.setValue(null)
    this.deployFormGroup.get('liquidity')?.get('algoToLiq')?.setValue(null)

    this.deployFormGroup.get('tradingStart')?.setValue(null)
    this.deployFormGroup.get('extraFeeTime')?.setValue(null)


  }

}
