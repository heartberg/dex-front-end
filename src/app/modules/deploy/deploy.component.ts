import {Component, DoCheck, ElementRef, OnInit, ViewChild} from '@angular/core';
// import {DeployedApp} from "../../blockchain/deployer_application";
import {WalletsConnectService} from "../../services/wallets-connect.service";
import {DeployedApp} from "../../blockchain/deployer_application";
import {DeployedAppSettings, StakingSetup} from "../../blockchain/platform-conf";
import {FormBuilder, FormGroup} from "@angular/forms";
import {environment} from "../../../environments/environment";
import {DeployLb} from "./deploy-api-logic-file/deploy.lb";
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { AssetViewModel } from 'src/app/models/assetViewModel';
import { platform_settings as ps } from '../../blockchain/platform-conf';
interface member {
  name: string,
  position: string,
  social: string,
}

export type AsaPresaleSettings = {
  contractId: number,
  presaleTokenAmount: number,
  presaleStart: number,
  presaleEnd: number,
  softcap: number,
  hardcap: number,
  walletcap: number
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
  position: string = '';
  social: string = '';

  isSmartAsaDeploy: boolean = true;
  isStakingDeploy: boolean = false;
  isAsaDeploy: boolean = false;
  isDistributionPool: boolean = false;

  isCheckedRoadMap: boolean = false;
  isCheckedTeamInfo: boolean = false;
  isCheckedStaking: boolean = false;
  extraFieldsArr: any[] = [
    1
  ];
  purposeIsChecked: boolean = false;
  presaleIsChecked: boolean = false;
  fee = environment.Y_FEE;

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

  constructor(
    private walletProviderService: WalletsConnectService,
    private deployedApp: DeployedApp,
    private fb: FormBuilder,
    private deployLib: DeployLb,
    private assetService: AssetReqService,

  ) {
  }


  ngDoCheck() {
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

  ngOnInit(): void {
    this.initializeForm();
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

    let obj = item;
    if (i === 0) {
      this.extraFieldsArr.push(obj);
    } else {
      this.extraFieldsArr.splice(i, 1)
    }
    console.log(i, this.extraFieldsArr);
    console.log(this.deployFormGroup.value.teamInfoOptionGroup);
  }

  triggerForm(value: any, item: any, i: number, name: string, position: string, social: string) {
    this.extraFieldsArr[i] = item;
    console.log(this.extraFieldsArr);
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
      extraFeeTime: this.fb.control(''),
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
    });

    this.stakingFormGroup.valueChanges.subscribe(x => {
      this.stakingSectionSetStakingFields()
    })
  }

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

    let tradeStart =  parseInt((new Date(this.deployFormGroup.get('tradingStart')?.value).getTime() / 1000).toFixed(0))

    let poolStart = parseInt((new Date(this.deployFormGroup.get('stakingGroup.poolStart')?.value).getTime() / 1000).toFixed(0))
    let poolRewards = Math.floor(+this.deployFormGroup.get('stakingGroup.rewardPool')?.value * Math.pow(10, decimals))
    let poolInterval = +this.deployFormGroup.get('stakingGroup.rewardInterval')?.value * 86400
    let poolDuration = +this.deployFormGroup.get('stakingGroup.poolDuration')?.value * 86400
    let rewardsPerInterval = undefined
    if(poolRewards != 0 && poolInterval != 0 && poolDuration != 0) {
      rewardsPerInterval = Math.floor(poolRewards / (poolDuration / poolInterval))
    }

    // @ts-ignore
    return this.blockchainObject = {
      extraFeeTime: +this.deployFormGroup.get('extraFeeTime')?.value,
      creator: this.sessionWallet.wallet.getDefaultAccount(),
      totalSupply: +this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, decimals),
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
      initialAlgoLiq: initial_algo_liq_with_fee - Math.floor(initial_algo_liq_with_fee * this.fee),
      additionalFee: +this.deployFormGroup.get('feesGroup.fee')?.value * 100,
      additionalFeeAddress: this.deployFormGroup.get('feesGroup.address')?.value,
      poolStart: poolStart,
      poolInterval: poolInterval,
      poolRewards: poolRewards,
      rewardsPerInterval: rewardsPerInterval,
      poolDuration: poolDuration,
      presaleSettings: {
        presaleTokenAmount: +this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, decimals),
        toLp: this.deployFormGroup.get('createPresaleOptionGroup.presaleLiquidity.presaleFundsToLiquidity')?.value * 100,
        presaleStart: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value).getTime() / 1000).toFixed(0)),
        presaleEnd: parseInt((new Date(this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value).getTime() / 1000).toFixed(0)),
        softcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value * 1_000_000,
        hardcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value * 1_000_000,
        walletcap: +this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value * 1_000_000,
      } || null
    }
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
