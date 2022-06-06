import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WalletsConnectService } from '../../../services/wallets-connect.service';
import { AuthService } from '../../../services/authService.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { PresaleBlockchainInformation, PresaleEntryData } from 'src/app/modules/launchpad/launch-detail/launch-detail.component';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { PresaleEntryModel } from 'src/app/models/presaleEntryModel';
import { getAlgodClient, isOptedIntoApp } from 'src/app/blockchain/algorand';
import {DeployedAppSettings, platform_settings as ps, StakingSetup} from 'src/app/blockchain/platform-conf';
import { StakingInfo, StakingUserInfo } from 'src/app/modules/staking/staking.component';
import { Algodv2 } from 'algosdk';
import { ProjectViewModel } from 'src/app/models/projectViewModel';
import { environment } from 'src/environments/environment';
import { DeployLb } from 'src/app/modules/deploy/deploy-api-logic-file/deploy.lb';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { StakingUtils } from 'src/app/blockchain/staking';

export type SmartToolData = {
  userSupplied: number,
  availableTokenAmount: number,
  availableAlgoAmount: number,
  userBorrowed: number,
  assetDecimals: number,
  contractId: number,
  totalBacking: number,
  totalBorrowed: number,
  totalSupply: number,
  optedIn: boolean,
  name: string,
  unitName: string
}

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss'],
})
export class PopUpComponent implements OnInit {
  @Output() isConnectedToWallet = new EventEmitter<boolean>();
  @Output() isClosed = new EventEmitter<boolean>();
  @Output() logInValue = new EventEmitter<string | null>();
  @Output() isLiquiditied = new EventEmitter<boolean>();

  @Output() makeRequest = new EventEmitter<FormGroup>();

  @Input() isChooseWallet: boolean = false;
  @Input() openWallet: boolean = false;
  @Input() isDeploy: boolean = false;
  @Input() isTrade: boolean = false;
  @Input() isBorrow: boolean = false;
  @Input() isBacking: boolean = false;

  @Input() isRestart: boolean = false;
  @Input() isFair: boolean = false;

  @Input() isDistributionPool: boolean = false;
  @Input() projectForDistributionPool: ProjectPreviewModel | undefined;
  tokensPerInterval: number = 0;
  availableAmountForDistribution: number = 0;

  @Input() stacking: boolean = false;
  @Input() stackingISStake: boolean = false;
  @Input() isD: boolean  = false;

  //deployed logic
  @Input() isDeployedSuccess: boolean = false;
  @Input() isDeployedFaied: boolean = false;
  @Input() isDeployedPending: boolean = false;
  //deployed logic
  isActiveFirst = true;
  isActiveSecond = false;

  returnedBacking: number = 0;
  presalePrice: number = 0;
  minInitialPrice = 0;
  maxInitialPrice = 0;
  initialFairLaunchPrice = 0;

  accountList: string[] = []
  assetIdsToOptIn: number[] = []
  isOptedInToVerseBacking = false

  @Input()
  stakingInfo: StakingUserInfo | undefined;

  @Input()
  smartToolData: SmartToolData = {
    assetDecimals: 0,
    availableTokenAmount: 0,
    availableAlgoAmount: 0,
    contractId: 0,
    userBorrowed: 0,
    userSupplied: 0,
    totalBacking: 0,
    totalBorrowed: 0,
    totalSupply: 0,
    optedIn: true,
    name: "",
    unitName: ""
  }

  @Input()
  presaleData: [PresaleBlockchainInformation, ProjectViewModel] | undefined;

  @Input()
  presaleEntryData: PresaleEntryData | undefined

  // FORMS

  // trade new popup flows
  @Input() isTradeLend: boolean = false;
  @Input() isTradeBacking: boolean = false;

  @Input() isTradeLendVerse: boolean = false;
  @Input() isTradeBackingVerse: boolean = false;

  // @Output() indexerOfChosenSection = new EventEmitter<number>();
  // trade new popup flows

  @Input() isPool: boolean = false;

  distributionPoolForm = this.fb.group({
    poolReward: [],
    poolStart: [],
    poolInterval: [],
    poolDuration: [],
  })

  tokenDetailBorrowForm = this.fb.group({
    supplyAmount: [],
    borrowAmount: [],
  });

  tokenDetailRepayForm = this.fb.group({
    borrowedAmount: [],
    repayAmount: [],
  });

  tokenDetailBackingForm = this.fb.group({
    tokenName: [],
    secondInput: [],
  });

  launchDetailControl = this.fb.control([]);
  tradeBackingControl = this.fb.control([]);

  stakeVerseControl = this.fb.control([])
  withdrawVerseControl = this.fb.control([])

  myPresaleRestartForm = this.fb.group({
    presaleStart: [],
    presaleEnd: [],
    tradingStart: [],
    tokenInPresale: [],
    tokenInLiquidity: [],
    algoInLiquidity: [],
    softCap: [],
    hardCap: [],
    walletCap: [],
    toLiquidity: [],
  });

  myPresaleFairLaunchForm = this.fb.group({
    tradingStart: [],
    tokenLiq: [],
    algoLiq: [],
  });

  stakingGroup = this.fb.group({});
  // FORMS
  constructor(
    private _walletsConnectService: WalletsConnectService,
    private authService: AuthService,
    private fb: FormBuilder,
    private verseApp: VerseApp,
    private deployedApp: DeployedApp,
    private projectService: projectReqService,
    private deployLib: DeployLb,
    private stakingUtils: StakingUtils
  ) {}


  async ngOnInit(): Promise<void> {

    // this.lendControl.valueChanges!.subscribe(
    //   (value: any) => {
    //     this.calculateBackingReturn(value)
    //   }
    // )

    this.tradeBackingControl.valueChanges!.subscribe(
      (value: any) => {
        this.calculateBackingReturn(value)
      }
    )
    this.myPresaleRestartForm.valueChanges!.subscribe(
      (value: any) => {
        console.log(value)
        this.getInitialPrices()
      }
    )

    this.myPresaleFairLaunchForm.valueChanges!.subscribe(
      (value: any) => {
        this.getFairLaunchPrices()
      }
    )

    this.distributionPoolForm.valueChanges!.subscribe(
      (value: any) => {
        this.getDistributionFields()
      }
    )

    if(this.isDistributionPool) {
      let client: Algodv2 = getAlgodClient()
      let wallet = this._walletsConnectService.sessionWallet
      let accInfo = await client.accountInformation(wallet!.getDefaultAccount()).do()
      let asset = accInfo['assets'].find((value: any) => {
        return value['asset-id'] == this.projectForDistributionPool!.asset.assetId
      })
      this.availableAmountForDistribution = asset['amount']
    }

    if(this.isTradeBacking){
      console.log("is trade backing")
      await this.checkOptedInBackingContract()
      await this.checkOptInBackingTokens()
    }
  }

  // tradelendVerse
  lendVerse = [
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      BackingPerToken: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    },
    {
      name: 'Algo',
      totalBanking: 'Y Algo',
      Backing: 'X Algo'
    }
  ]
  // #tradelendVerse

  async onSubmit(formName: string) {
    console.log(this.presaleData![1])
    let wallet = this._walletsConnectService.sessionWallet!
    if (formName === 'myPresaleRestartForm') {
      //this.makeRequest.next(this.myPresaleRestartForm);
      let softCap = this.myPresaleRestartForm.get("softCap")?.value * 1_000_000
      let hardCap = this.myPresaleRestartForm.get("hardCap")?.value * 1_000_000
      let tokenInPresale = this.myPresaleRestartForm.get("tokenInPresale")?.value * Math.pow(10, this.presaleData![1].asset.decimals)
      let presaleStart = parseInt((new Date(this.myPresaleRestartForm.get("presaleStart")?.value).getTime() / 1000).toFixed(0))
      let presaleEnd = parseInt((new Date(this.myPresaleRestartForm.get("presaleEnd")?.value).getTime() / 1000).toFixed(0))
      let tradingStart = parseInt((new Date(this.myPresaleRestartForm.get("tradingStart")?.value).getTime() / 1000).toFixed(0))
      let tokenInLiquidity = this.myPresaleRestartForm.get("tokenInLiquidity")?.value * Math.pow(10, this.presaleData![1].asset.decimals)
      let algoInLiquidity = this.myPresaleRestartForm.get("algoInLiquidity")?.value * 1_000_000
      let walletCap = this.myPresaleRestartForm.get("walletCap")?.value * 1_000_000
      let toLiquidity = this.myPresaleRestartForm.get("toLiquidity")?.value * 100

      let response = await this.deployedApp.resetupPresale(wallet, softCap, hardCap, presaleStart, presaleEnd, walletCap, toLiquidity,
        tradingStart, tokenInPresale, tokenInLiquidity, algoInLiquidity, this.presaleData![0].contractId, this.presaleData![0].assetId)
      if(response){
        let projectView: ProjectViewModel = {
          presale: {
            endingTime: presaleEnd,
            hardCap: hardCap,
            presaleId: this.presaleData![1].presale!.presaleId,
            presaleToLiquidity: toLiquidity,
            softCap: softCap,
            startingTime: presaleStart,
            tokenAmount: tokenInPresale,
            totalRaised: this.presaleData![0].totalRaised,
            walletCap: walletCap,
            toFairLaunch: false
          },
          asset: this.presaleData![1].asset,
          creatorWallet: this.presaleData![1].creatorWallet,
          description: this.presaleData![1].description,
          initialAlgoLiquidity: algoInLiquidity,
          initialAlgoLiquidityWithFee: Math.floor(algoInLiquidity / (1 - environment.Y_FEE)),
          initialTokenLiquidity: tokenInLiquidity,
          projectId: this.presaleData![1].projectId,
          projectImage: this.presaleData![1].projectImage,
          projectName: this.presaleData![1].projectName,
          teamMembers: this.presaleData![1].teamMembers,
          contractAddress: this.presaleData![1].contractAddress,
          contractId: this.presaleData![1].contractId
        }
        console.log(projectView)
        console.log("send to bc")

        this.projectService.reSetupPresale(projectView).subscribe(
          (value: any) => {
            console.log("resetup")
          }
        )
      }
      this.myPresaleRestartForm.reset();
      console.log(this.presaleData)
    }

    if (formName === 'myPresaleFairLaunchForm') {
      let tokenLiq = this.myPresaleFairLaunchForm.get("tokenLiq")?.value * Math.pow(10, this.presaleData![1].asset.decimals)
      let algoLiq = this.myPresaleFairLaunchForm.get("algoLiq")?.value * Math.pow(10, 6)
      let tradingStart = parseInt((new Date(this.myPresaleFairLaunchForm.get("tradingStart")?.value).getTime() / 1000).toFixed(0))
      let response = await this.deployedApp.resetupPresaleToFairLaunch(wallet, tradingStart, tokenLiq, algoLiq, this.presaleData![0].contractId, this.presaleData![0].assetId)
      if(response){
        console.group("send to bc")
        this.presaleData![1].asset.tradingStart = tradingStart
        this.projectService.fairLaunch(this.presaleData![1].asset).subscribe(
          (value: any) => {
            console.log("to fairlaunch on backend")
          }
        )

      }
      this.myPresaleFairLaunchForm.reset();
      console.log(this.presaleData)
    }
  }

  closePopUp(value: any) {
    this.isClosed.emit(false);
  }

  async setelectWalletConnect(value: string) {

    if (value === 'MyAlgoWallet') {
      await this._walletsConnectService.connect('my-algo-connect');
      if (this._walletsConnectService.myAlgoAddress && this._walletsConnectService.myAlgoName !== undefined) {
        // this.isConnectedToWallet.emit(false);
            let wallet = localStorage.getItem('wallet');
            if (
              this._walletsConnectService.myAlgoAddress &&
              this._walletsConnectService.myAlgoName !== undefined
            ) {
              this.authService
                .createUser(
                  // @ts-ignore
                  {
                    wallet: wallet,
                    name: 'Name',
                    verified: false,
                    bio: 'Nothing yet...',
                    profileImage: '',
                    banner: '',
                    featuredImage: '',
                    customUrl: '',
                    twitter: '',
                    instagram: '',
                    website: '',
                  }
                )
                .subscribe(
                  (user: any) => {
                    console.log(user);
                    this.isConnectedToWallet.emit(false);
                    this.logInValue.emit(wallet);
                  },
                  (error) => {
                    console.log('error', error);
                    this.authService.getUserByWallet(localStorage.getItem('wallet')!).subscribe(
                      (response: any) => {
                        console.log(response);
                        if (response) {
                          this.logInValue.emit(wallet);
                          this.isConnectedToWallet.emit(false);
                        }
                      }
                    );
                  }
                );
            }
        console.log('emited')
        console.log('Connected to MyAlgoWallet')
      }
    } else if (value == 'WalletConnect') {
      await this._walletsConnectService.connect('wallet-connect');
      if (this._walletsConnectService.myAlgoAddress && this._walletsConnectService.myAlgoName !== undefined) {
        this.isConnectedToWallet.emit(false);
        console.log('Connected to MyAlgoWallet')
      }
    }
  }

  activeFirst() {
    this.isActiveFirst = true;
    this.isActiveSecond = false;
  }

  activeSecond() {
    this.isActiveSecond = true;
    this.isActiveFirst = false;
  }

  triggetLiquidity() {
    this.isLiquiditied.emit(true);
  }

  async activateLandAndTrade(id: number) {
    if (id === 1) {
      this.isTradeLend = false;
      this.isTradeBacking = false;
    } else if (id === 2) {
      this.isTradeLend = true;
      this.isTradeBacking = false;
    } else if (id === 3) {
      this.isTradeLend = false;
      this.isTradeBacking = true;
      await this.checkOptedInBackingContract()
      await this.checkOptInBackingTokens()
    }
  }

  pow(decimals: number) {
    return Math.pow(10, decimals)
  }

  borrow() {
    console.log("borrow")
  }

  calculateBackingReturn(amount: any) {
    if(!amount)  {
      this.returnedBacking = 0
    } else {
      this.returnedBacking = this.smartToolData.totalBacking / this.smartToolData.totalSupply * amount
    }
  }

  getDistributionFields() {
    let poolDuration = +this.distributionPoolForm.get('poolDuration')?.value * 86400
    let poolInterval = this.distributionPoolForm.get('rewardInterval')?.value * 86400
    let poolRewards = this.distributionPoolForm.get('rewardPool')?.value * Math.pow(10, this.projectForDistributionPool!.asset.decimals)

    if(poolRewards != 0 && poolDuration != 0 && poolInterval != 0) {
      this.tokensPerInterval = poolRewards / (poolDuration / poolInterval)
    } else {
      this.tokensPerInterval = 0
    }
  }

  getInitialPrices() {
    let hardCap = +this.myPresaleRestartForm.get('hardCap')?.value || 0
    let softCap = +this.myPresaleRestartForm.get('softCap')?.value || 0
    let algoLiq = +this.myPresaleRestartForm.get('algoInLiquidity')?.value || 0
    let presaleAlgoToLiq = +this.myPresaleRestartForm.get('toLiquidity')?.value || 0
    let tokensInPresale = +this.myPresaleRestartForm.get('tokenInPresale')?.value || 0
    let tokenLiq = +this.myPresaleRestartForm.get('tokenInLiquidity')?.value || 0
    if(tokenLiq == 0) {
      this.maxInitialPrice = 0
      this.minInitialPrice = 0
    } else {
      this.maxInitialPrice = (algoLiq + presaleAlgoToLiq * hardCap / 100) / tokenLiq
      this.minInitialPrice = (algoLiq + presaleAlgoToLiq * softCap / 100) / tokenLiq
    }
    if(tokensInPresale == 0) {
      this.presalePrice = 0
    } else {
      this.presalePrice = hardCap / tokensInPresale
    }
  }

  getFairLaunchPrices() {
    let algoLiq = +this.myPresaleFairLaunchForm.get("algoLiq")?.value || 0
    let tokenLiq = + this.myPresaleFairLaunchForm.get("tokenLiq")?.value || 0
    if(tokenLiq == 0){
      this.initialFairLaunchPrice = 0;
    } else {
      this.initialFairLaunchPrice = algoLiq / tokenLiq
    }
  }

  async buyPresale() {
    console.log("buy")
    let amount = +this.launchDetailControl.value;
    const addr = localStorage.getItem("wallet")
    if(addr){
      let wallet = this._walletsConnectService.sessionWallet!;
      if(amount){
        amount = amount * Math.pow(10, 6)
        console.log(amount)
        let response = await this.deployedApp.buyPresale(wallet, amount, this.presaleEntryData!.contractId)
        if(response){
          let entryViewModel: PresaleEntryModel = {
            amount: amount,
            wallet: addr,
            presaleId: this.presaleEntryData!.presaleId
          };
          this.projectService.createPresaleEntry(entryViewModel).subscribe(
            (value: any) => {
              console.log("presale entered!")
            }
          )
        }
        this.closePopUp(true)
      } else {
        console.log("please enter amount")
      }
    } else {
      console.log("please connect wallet")
    }

  }

  async optInToPresaleContract(){
    console.log("opt in clicked")
    const wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      let response = await this.deployedApp.optIn(wallet, this.presaleEntryData!.contractId)
      if(response){
        this.presaleEntryData!.isOptedIn = true;
      }
    } else {
      console.log("please connect")
    }
  }

  async optInToStaking(){
    console.log("opt in to stake")
    const wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      let response = await this.stakingUtils.optInVerseStaking(wallet)
      if(response){
        this.stakingInfo!.optedIn = true;
      }
    } else {
      console.log("please connect")
    }
  }

  async stake(){
    let stakeAmount = +this.stakeVerseControl.value | 0
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(stakeAmount > 0) {
        stakeAmount = stakeAmount * Math.pow(10, ps.platform.verse_decimals)
        let response = await this.verseApp.stake(wallet, stakeAmount)
        if(response) {
          console.log("staked")
          this.closePopUp(true)
        }
      } else {
        console.log("input > 0 please")
      }
    } else {
      console.log("please connect")
    }

  }

  async withdrawStake(){
    let withdraw = +this.withdrawVerseControl.value | 0
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(withdraw > 0) {
        withdraw = withdraw * Math.pow(10, ps.platform.verse_decimals)
        let response = await this.verseApp.withdraw(wallet, withdraw)
        if(response) {
          console.log("withdrew")
          this.closePopUp(true)
        }
      } else {
        console.log("input > 0 please")
      }
    } else {
      console.log("please connect")
    }
  }

  async getBackingTrade() {
    let amount = +this.tradeBackingControl.value
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(amount > 0) {
        if(this.smartToolData.contractId == ps.platform.verse_app_id) {
          amount = amount * Math.pow(10, ps.platform.verse_decimals)
          let response = await this.verseApp.getBacking(wallet, amount)
          if(response) {
            console.log("backing done")
            this.closePopUp(true)
          }
        } else {
          amount = amount * Math.pow(10, this.smartToolData.assetDecimals)
          let response = await this.deployedApp.getBacking(wallet, amount, this.smartToolData.contractId)
          if(response) {
            console.log("got backing")
            this.closePopUp(true)
          }
        }
      } else {
        console.log("enter > 0")
      }
    } else {
      console.log("please connect wallet")
    }
  }

  async lendTrade() {
    let amount = this.tradeBackingControl.value | 0
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(amount > 0) {
        if(this.smartToolData.contractId == ps.platform.verse_app_id) {
          amount = amount * Math.pow(10, ps.platform.verse_decimals)
          let response = await this.verseApp.getBacking(wallet, amount)
          if(response) {
            console.log("backing done")
          }
        } else {
          console.log("enter > 0")
        }
      } else {
        console.log("please connect wallet")
      }
    }
  }

  async checkOptedInBackingContract(){
    const addr = localStorage.getItem("wallet")
    if(addr) {
      if (await isOptedIntoApp(addr, ps.platform.backing_id)) {
        this.isOptedInToVerseBacking = true
      } else {
        this.isOptedInToVerseBacking = false
      }
    }
  }

  async checkOptInBackingTokens(){
    const wallet = this._walletsConnectService.sessionWallet
    const addr = localStorage.getItem("wallet")
    if(wallet) {
      this.assetIdsToOptIn = await this.stakingUtils.checkOptedInToBackingAssets(addr!)
      console.log(this.assetIdsToOptIn)
    }
  }

  async optInToBacking(){
    const wallet = this._walletsConnectService.sessionWallet
    if(wallet) {
      let response = await this.verseApp.optIn(wallet)
      if(response) {
        this.isOptedInToVerseBacking = true
      }
    }
  }

  async optInToBackingTokens(){
    const wallet = this._walletsConnectService.sessionWallet
    if(wallet) {
      await this.checkOptInBackingTokens()
      let response = await this.stakingUtils.optInBackingAssets(wallet, this.assetIdsToOptIn)
      if(response) {
        this.assetIdsToOptIn = []
      }
    }
  }

  async createDistributionPool() {
    console.log("create pool")
    let poolReward = +this.distributionPoolForm.get('poolReward')?.value * Math.pow(10, this.projectForDistributionPool!.asset.decimals)
    let poolDuration = +this.distributionPoolForm.get('poolDuration')?.value * 86400
    let poolInterval = +this.distributionPoolForm.get('poolInterval')?.value * 86400
    let poolStart = parseInt((new Date(this.distributionPoolForm.get('poolStart')?.value).getTime() / 1000).toFixed(0))
    let poolIntervalRewards = parseInt((this.tokensPerInterval * Math.pow(10, this.projectForDistributionPool!.asset.decimals)).toFixed(0))

    let stakingSetup: StakingSetup = {
      assetContractId: this.projectForDistributionPool!.asset.contractId,
      assetId: this.projectForDistributionPool!.asset.assetId,
      poolDuration: poolDuration,
      poolInterval: poolInterval,
      poolRewards: poolReward,
      poolStart: poolStart,
      projectId: this.projectForDistributionPool!.projectId,
      rewardsPerInterval: poolIntervalRewards,
      isDistribution: true
    }
    await this.deployLib.deployStaking(stakingSetup)
  }
}
