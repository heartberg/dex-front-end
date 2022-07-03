import {Component, DoCheck, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { WalletsConnectService } from '../../../services/wallets-connect.service';
import { AuthService } from '../../../services/authService.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BackingTokenInfo, VerseApp } from 'src/app/blockchain/verse_application';
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
import {of} from "rxjs";
import { EOVERFLOW } from 'constants';

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
export class PopUpComponent implements OnInit, DoCheck {
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
  @Input() isAddBacking: boolean = false;

  @Input() isRestart: boolean = false;
  @Input() isFair: boolean = false;

  @Input() projectForDistributionPool: ProjectPreviewModel | undefined;
  tokensPerInterval: number = 0;
  availableAmountForDistribution: number = 0;

  @Input() stacking: boolean = false;
  @Input() stackingISStake: boolean = false;
  @Input() isD: boolean  = false;
  @Input() switcher: boolean = false;
  //deployed logic
  @Input() isDeployedSuccess: boolean = false;
  @Input() isDeployedFaied: boolean = false;
  @Input() isDeployedPending: boolean = false;
  //deployed logic

  // wallet switcher
  walletsForSwitching: any[] = [];

  assetInfo: any;

  isActiveFirst = true;
  isActiveSecond = false;

  isLend = true;
  isLendChecked = this.fb.control([])
  isLendVerseChecked = this.fb.control([])
  tradeBackingVerseControl = this.fb.control([])
  tradeLendVerseControl = this.fb.control([])

  tradeLendRepayTokenControl1 = this.fb.control([])
  tradeLendRepayTokenControl2 = this.fb.control([])
  tradeLendRepayTokenControl3 = this.fb.control([])
  tradeLendRepayTokenControl4 = this.fb.control([])
  tradeLendRepayTokenControl5 = this.fb.control([])
  tradeLendRepayTokenControl6 = this.fb.control([])
  tradeLendRepayTokenControl7 = this.fb.control([])

  verseBackingTokens: BackingTokenInfo[] | undefined = undefined

  verseReturnedBacking: number = 0;
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

  addBackingControl = this.fb.control([])

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

  stakeVerseControl = this.fb.control([0,])
  withdrawVerseControl = this.fb.control([])
  isStakeInvalid: boolean = false;
  isWithdrawInvalid: boolean = false;

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
    checkVested: [],
    release: [],
    releaseInterval: [],
    releaseIntervalNumbers: []
  });

  @ViewChild('checkVested', {static: false})
  // @ts-ignore
  private checkVested: ElementRef;

  isCheckedVested: boolean = false;

  myPresaleFairLaunchForm = this.fb.group({
    tradingStart: [],
    tokenLiq: [],
    algoLiq: [],
  });
  restartReleasePerInterval: number = 0;
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

  ngDoCheck() {
    if (this.stakeVerseControl.value.length) {
      this.stakeVerseControl.valueChanges.subscribe((res: any) => {
        if (+this.stakeVerseControl.value >  this.stakingInfo?.usersHolding!) {
          this.isStakeInvalid = true;
        } else {
          this.isStakeInvalid = false;
        }
      })
    }
    if (this.withdrawVerseControl.value.length) {
      this.withdrawVerseControl.valueChanges.subscribe((res: any) => {
        if (+this.withdrawVerseControl.value > this.stakingInfo?.usersStake!) {
          this.isWithdrawInvalid = true;
        } else {
          this.isWithdrawInvalid = false;
        }
      })
    }
  }

  async ngOnInit(): Promise<void> {
    // this.lendControl.valueChanges!.subscribe(
    //   (value: any) => {
    //     this.calculateBackingReturn(value)
    //   }
    // )

    if(this.isAddBacking) {
      let wallet = this._walletsConnectService.sessionWallet
      if(wallet) {
        this.smartToolData = await this.deployedApp.getSmartToolData(this.projectForDistributionPool!.asset.smartProperties!.contractId, wallet.getDefaultAccount())
      }
    }

    this.tradeBackingVerseControl.valueChanges!.subscribe(
      (value: any) => {
        console.log("tradebackingverse: ", value)
        this.calculateVerseBackingReturn(value)
        this.calculateTokenBackingReturnVerse(value)
      }
    )

    this.tradeLendVerseControl.valueChanges!.subscribe(
      (value: any) => {
        console.log("tradelendverse: ", value)
        this.calculateVerseBackingReturn(value)
        this.calculateTokenBackingReturnVerse(value)
      }
    )
    if(this.isTradeLendVerse) {
      console.log("lend verse")
      this.calculateVerseBackingReturn(0)
    }


    this.isLendVerseChecked.setValue(false)
    this.isLendVerseChecked.valueChanges!.subscribe(
      (value: any) => {
        console.log("lend verse changed", value)
        console.log(this.smartToolData)
        if(value == true) {
          this.isLend = false
        } else {
          this.isLend = true
        }
      }
    )

    this.isLendChecked.setValue(false)
    this.isLendChecked.valueChanges!.subscribe(
      (value: any) => {
        console.log(value)
        console.log(this.smartToolData)
        if(value == true) {
          this.isLend = false
        } else {
          this.isLend = true
        }
      }
    )

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

    if(this.isPool) {
      let client: Algodv2 = getAlgodClient()
      let wallet = this._walletsConnectService.sessionWallet
      let accInfo = await client.accountInformation(wallet!.getDefaultAccount()).do()
      let asset = accInfo['assets'].find((value: any) => {
        return value['asset-id'] == this.projectForDistributionPool!.asset.assetId
      })
      console.log(asset)
      console.log(accInfo)
      this.availableAmountForDistribution = asset['amount'] / Math.pow(10, this.projectForDistributionPool!.asset.decimals)
    }

    if(this.isTradeLendVerse){
      console.log("is trade lending verse")
      await this.checkOptInBackingTokens()
      // tradelendVerse
      let wallet = this._walletsConnectService.sessionWallet?.getDefaultAccount()
      console.log(wallet)
      this.verseBackingTokens = await this.verseApp.getBackingTokens(wallet)
    }

    if(this.stacking) {
      console.log(this.stakingInfo)
      let client: Algodv2 = getAlgodClient()
      // TODO: store in variable
      setTimeout(async () => {
        this.assetInfo = await client.getAssetByID(this.stakingInfo!.assetId).do()
      }, 600
      )
      //this.assetInfo = await client.getAssetByID(this.stakingInfo!.assetId).do()
    }
  }

  calculateTokenBackingReturnVerse(value: number) {
    if(this.isTradeLendVerse) {
      this.verseBackingTokens!.forEach(tokenInfo => {
        tokenInfo.output = tokenInfo.currentMaxBorrow + tokenInfo.backingPerToken * value
      });
    } else {
      this.verseBackingTokens!.forEach(tokenInfo => {
        tokenInfo.input = tokenInfo.backingPerToken * value
      });
    }

  }


  async onSubmit(formName: string) {
    console.log(this.presaleData![0])
    console.log(this.presaleData![1])
    console.log(this.myPresaleRestartForm.value)
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

      let vestingRelease = undefined;
      let vestingIntervalLength = undefined
      let vestingIntervalNumber = undefined

      if(this.isCheckedVested) {
        vestingRelease = parseInt((new Date(this.myPresaleRestartForm.get("release")?.value).getTime() / 1000).toFixed(0))
        vestingIntervalLength = Math.floor(this.myPresaleRestartForm.get("releaseInterval")?.value * 86400)
        vestingIntervalNumber = this.myPresaleRestartForm.get("releaseIntervalNumbers")?.value

      }
     let response = await this.deployedApp.resetupPresale(wallet, softCap, hardCap, presaleStart, presaleEnd, walletCap, toLiquidity,
        tradingStart, tokenInPresale, tokenInLiquidity, algoInLiquidity, this.presaleData![0].contractId, this.presaleData![0].assetId,
        vestingRelease, vestingIntervalLength, vestingIntervalNumber)

      this.presaleData![1].asset.smartProperties!.tradingStart = tradingStart

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
          teamMembers: this.presaleData![1].teamMembers
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
        this.presaleData![1].asset.smartProperties!.tradingStart = tradingStart
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
                    if (user) {
                      this.isConnectedToWallet.emit(false);
                      this.logInValue.emit(wallet);
                      this.isClosed.emit(false);
                    }
                  },
                  (error) => {
                    console.log('error', error);
                    this.authService.getUserByWallet(localStorage.getItem('wallet')!).subscribe(
                      (response: any) => {
                        console.log(response);
                        if (response) {
                          this.logInValue.emit(wallet);
                          this.isConnectedToWallet.emit(false);
                          this.isClosed.emit(false);
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

  async activateLendAndTrade(id: number) {
    if (id === 1) {
      if(this.smartToolData.contractId == ps.platform.verse_app_id) {
        console.log("activate backing verse")
        this.isTradeLend = false;
        this.isTradeBacking = false;
        this.isTradeLendVerse = false;
        this.isTradeBackingVerse = true;
        await this.checkOptInBackingTokens()
      } else {
        this.isTradeLend = false;
        this.isTradeBacking = true;
        this.isTradeLendVerse = false;
        this.isTradeBackingVerse = false;
        console.log("activate backing")
      }
    } else if (id === 2) {
      if(this.smartToolData.contractId == ps.platform.verse_app_id) {
        this.isTradeLend = false;
        this.isTradeBacking = false;
        this.isTradeLendVerse = true;
        this.isTradeBackingVerse = false;
        await this.checkOptInBackingTokens()
        console.log("activate lend verse")
      } else {
        this.isTradeLend = true;
        this.isTradeBacking = false;
        this.isTradeLendVerse = false;
        this.isTradeBackingVerse = false;
        console.log("activate lend")
      }
    }
  }

  pow(decimals: number) {
    return Math.pow(10, decimals)
  }

  calculateVerseBackingReturn(amount: any) {
    if(this.isTradeBackingVerse) {
      this.verseReturnedBacking = this.smartToolData.totalBacking / this.smartToolData.totalSupply * amount
    } else {
      let currentBorrowable = this.smartToolData.totalBacking / this.smartToolData.totalSupply * this.smartToolData.userSupplied - this.smartToolData.userBorrowed
      this.verseReturnedBacking =  currentBorrowable + this.smartToolData.totalBacking / this.smartToolData.totalSupply * amount
    }
  }

  calculateBackingReturn(amount: any) {
    console.log(amount)
    if(!amount)  {
      this.returnedBacking = 0
    } else {
      console.log(this.isLend)
      if(this.isLend) {
        this.returnedBacking = this.smartToolData.totalBacking / this.smartToolData.totalSupply * amount
      } else {
        if(this.smartToolData.userBorrowed > 0) {
          this.returnedBacking = amount / this.smartToolData.userBorrowed * this.smartToolData.userSupplied
        } else {
          this.returnedBacking = 0
        }

      }
    }
  }

  async withdrawBacking() {
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet) {
      let response = await this.verseApp.withdrawCollateral(wallet);
      if(response) {
        console.log("collateral withdrawn")
        this.verseBackingTokens = await this.verseApp.getBackingTokens(wallet.getDefaultAccount())
        this.smartToolData = await this.stakingUtils.getVerseSmartToolData(wallet.getDefaultAccount())
      }
    }
  }

  getDistributionFields() {
    let poolDuration = +this.distributionPoolForm.get('poolDuration')?.value * 86400
    let poolInterval = +this.distributionPoolForm.get('poolInterval')?.value * 86400
    let poolRewards = +this.distributionPoolForm.get('poolReward')?.value

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

    let releaseIntervalNumber = +this.myPresaleRestartForm.get('releaseIntervalNumbers')?.value || 0
    if(releaseIntervalNumber > 0) {
      this.restartReleasePerInterval = 1 / releaseIntervalNumber * 100
    } else {
      this.restartReleasePerInterval = 0
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
      if(this.stakingInfo!.contractId == ps.platform.staking_id) {
        let response = await this.stakingUtils.optInVerseStaking(wallet)
        if(response){
          this.stakingInfo!.optedIn = true;
        }
      } else {
        let response = await this.deployedApp.optInStakingPool(wallet, this.stakingInfo!.contractId)
        if(response){
          this.stakingInfo!.optedIn = true;
        }
      }

    } else {
      console.log("please connect")
    }
  }

  async stake(){
    let stakeAmount = +this.stakeVerseControl.value | 0
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(this.stakingInfo!.contractId == ps.platform.staking_id){
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
        if(stakeAmount > 0) {
          stakeAmount = stakeAmount * Math.pow(10, this.assetInfo['params']['decimals'])
          let response = await this.deployedApp.stakeDistributionPool(wallet, stakeAmount, this.stakingInfo!.contractId, this.stakingInfo!.isSmartPool)
          if(response) {
            console.log("staked")
            this.closePopUp(true)
          }
        } else {
          console.log("input > 0 please")
        }
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
        if(this.stakingInfo!.contractId == ps.platform.staking_id) {
          withdraw = withdraw * Math.pow(10, ps.platform.verse_decimals)
          let response = await this.verseApp.withdraw(wallet, withdraw)
          if(response) {
            console.log("withdrew")
            this.closePopUp(true)
          }
        } else {
          withdraw = withdraw * Math.pow(10, this.assetInfo['params']['decimals'])
          let response = await this.deployedApp.withdrawDistributionPool(wallet, this.stakingInfo!.contractId, withdraw, this.stakingInfo!.isSmartPool)
          if(response) {
            console.log("withdrew")
            this.closePopUp(true)
          }
        }

      } else {
        console.log("input > 0 please")
      }
    } else {
      console.log("please connect")
    }
  }

  async getBackingTrade() {
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
        if(this.smartToolData.contractId == ps.platform.verse_app_id) {
          let amount = +this.tradeBackingVerseControl.value
          amount = amount * Math.pow(10, ps.platform.verse_decimals)
          let response = await this.verseApp.getBacking(wallet, amount)
          if(response) {
            console.log("backing done")
            this.closePopUp(true)
          }
        } else {
          let amount = +this.tradeBackingControl.value
          amount = amount * Math.pow(10, this.smartToolData.assetDecimals)
          let response = await this.deployedApp.getBacking(wallet, amount, this.smartToolData.contractId)
          if(response) {
            console.log("got backing")
            this.closePopUp(true)
          }
      }
    } else {
      console.log("please connect wallet")
    }
  }

  assetCheckBoxClicked(info: BackingTokenInfo) {
    info.isChecked = !info.isChecked
  }

  async lendTrade() {
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(this.smartToolData.contractId == ps.platform.verse_app_id) {
        console.log("lend verse")
        let selectedAssets: number[] = []
        if(this.verseBackingTokens) {
          this.verseBackingTokens!.forEach(element => {
            if(element.isChecked) {
              selectedAssets.push(element.assetId)
            }
          });
        }
        let response = await this.verseApp.borrow(wallet, selectedAssets)
        if(response) {
          console.log("backing done")
          this.smartToolData = await this.stakingUtils.getVerseSmartToolData(wallet.getDefaultAccount())
          this.verseBackingTokens = await this.verseApp.getBackingTokens(wallet.getDefaultAccount())
        }
      } else {
        let amount = parseFloat(this.tradeBackingControl.value)
        console.log(amount)
        if(amount > 0) {

          amount = Math.floor(amount * Math.pow(10, this.smartToolData.assetDecimals))
          console.log(amount)
          let response = await this.deployedApp.borrow(wallet, amount, this.smartToolData.contractId)
          if(response) {
            console.log("backing done")
            this.smartToolData = await this.deployedApp.getSmartToolData(this.smartToolData.contractId, wallet.getDefaultAccount())
          }
        }
      }
    } else {
      console.log("please connect wallet")
    }
  }

  getAssetIdsAndAmounts() {
    let assetAmounts = []
    let assetIds = []
    if(this.verseBackingTokens!.length > 0){
      if(this.tradeLendRepayTokenControl1.value != 0) {
        assetIds.push(this.verseBackingTokens![0].assetId)
        assetAmounts.push(this.tradeLendRepayTokenControl1.value * Math.pow(10, this.verseBackingTokens![0].assetDecimals))
      }
      if(this.verseBackingTokens!.length > 1){
        if(this.tradeLendRepayTokenControl2.value != 0) {
          assetIds.push(this.verseBackingTokens![1].assetId)
          assetAmounts.push(this.tradeLendRepayTokenControl2.value * Math.pow(10, this.verseBackingTokens![1].assetDecimals))
        }
        if(this.verseBackingTokens!.length > 2){
          if(this.tradeLendRepayTokenControl3.value != 0) {
            assetIds.push(this.verseBackingTokens![2].assetId)
            assetAmounts.push(this.tradeLendRepayTokenControl3.value * Math.pow(10, this.verseBackingTokens![2].assetDecimals))
          }
          if(this.verseBackingTokens!.length > 3){
            if(this.tradeLendRepayTokenControl4.value != 0) {
              assetIds.push(this.verseBackingTokens![3].assetId)
              assetAmounts.push(this.tradeLendRepayTokenControl4.value * Math.pow(10, this.verseBackingTokens![3].assetDecimals))
            }
            if(this.verseBackingTokens!.length > 4){
              if(this.tradeLendRepayTokenControl5.value != 0) {
                assetIds.push(this.verseBackingTokens![4].assetId)
                assetAmounts.push(this.tradeLendRepayTokenControl5.value * Math.pow(10, this.verseBackingTokens![4].assetDecimals))
              }
              if(this.verseBackingTokens!.length > 5){
                if(this.tradeLendRepayTokenControl6.value != 0) {
                  assetIds.push(this.verseBackingTokens![5].assetId)
                  assetAmounts.push(this.tradeLendRepayTokenControl6.value * Math.pow(10, this.verseBackingTokens![5].assetDecimals))
                }
                if(this.verseBackingTokens!.length > 6){
                  if(this.tradeLendRepayTokenControl7.value != 0) {
                    assetIds.push(this.verseBackingTokens![6].assetId)
                    assetAmounts.push(this.tradeLendRepayTokenControl7.value * Math.pow(10, this.verseBackingTokens![6].assetDecimals))
                  }
                }
              }
            }
          }
        }
      }
    }
    return [assetIds, assetAmounts]
  }

  async repayTrade() {

    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
        if(this.smartToolData.contractId == ps.platform.verse_app_id) {
          let amount = parseFloat(this.tradeLendVerseControl.value)
          amount = Math.floor(amount * Math.pow(10, ps.platform.verse_decimals))
          let data = this.getAssetIdsAndAmounts()
          console.log(data)
          let response = await this.verseApp.repay(wallet, amount, data[0], data[1])
          if(response) {
            console.log("backing done")
            this.smartToolData = await this.stakingUtils.getVerseSmartToolData(wallet.getDefaultAccount())
            this.verseBackingTokens = await this.verseApp.getBackingTokens(wallet.getDefaultAccount())
          }
        } else {
          let amount = parseFloat(this.tradeBackingControl.value)
          amount = Math.floor(amount * Math.pow(10, 6))
          let response = await this.deployedApp.repay(wallet, amount, this.smartToolData.contractId)
          if(response) {
            console.log("backing done")
            this.smartToolData = await this.deployedApp.getSmartToolData(this.smartToolData.contractId, wallet.getDefaultAccount());
          }
        }
      } else {
        console.log("please connect wallet")
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
      if(this.smartToolData.contractId == ps.platform.verse_app_id) {
        let response = await this.verseApp.optIn(wallet)
        if(response) {
          this.smartToolData.optedIn = true
        }
      } else {
        let response = await this.deployedApp.optIn(wallet, this.smartToolData.contractId)
        if(response) {
          this.smartToolData.optedIn = true
        }
      }
    }
  }

  async lockVerseTokens() {
    console.log("lock verse")
    let amount = this.tradeLendVerseControl.value
    console.log(amount)
    let wallet = this._walletsConnectService.sessionWallet
    if(wallet){
      if(amount > 0) {
        amount = Math.floor(amount * Math.pow(10, ps.platform.verse_decimals))
        let response = await this.verseApp.supply(wallet, amount)
        if(response) {
          console.log("Supplied")
          this.smartToolData = await this.stakingUtils.getVerseSmartToolData(wallet.getDefaultAccount())
          this.verseBackingTokens = await this.verseApp.getBackingTokens(wallet.getDefaultAccount())
          this.calculateVerseBackingReturn(0)
          this.calculateTokenBackingReturnVerse(0)
          this.tradeLendVerseControl.setValue(null)
        }
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
      assetContractId: this.projectForDistributionPool!.asset.smartProperties!.contractId,
      assetId: this.projectForDistributionPool!.asset.assetId,
      poolDuration: poolDuration,
      poolInterval: poolInterval,
      poolRewards: poolReward,
      poolStart: poolStart,
      projectId: this.projectForDistributionPool!.projectId,
      rewardsPerInterval: poolIntervalRewards,
      isDistribution: true
    }
    console.log(stakingSetup)
    await this.deployLib.deployStaking(stakingSetup)
    this.closePopUp(true)
  }

  wallet(): any {
      this.walletsForSwitching = JSON.parse(localStorage.getItem('sessionWallet')!).wallet.accounts;
      return this.walletsForSwitching;
  }

  // returnAddress(acc: string) {
  //  let start: string = '';
  //  let last: string = ''
  //  start = acc.substring(0,3);
  //  last = acc.substring(acc.length, acc.length - 3);
  //  let final = start + '...' + last;
  //  return final
  // }

  // getActive(acc: string) {
  //   if (localStorage.getItem('wallet') === acc) {
  //     return true
  //   } else {
  //     return  false
  //   }
  // }

  switchAcc(i: number) {
    localStorage.removeItem('wallet');
    localStorage.setItem('walletIndex', JSON.stringify(i));
    this.setelectWalletConnect('MyAlgoWallet');
  }

  getValueFromDropDown($event: any) {
    let index = +$event.i - 1;
    this.switchAcc(+index);
    console.log($event)
  }

  isFinishedPool(time: number | undefined){
    console.log(time)
    if(time == 0) {
      return false
    }
    if(!time) {
      console.log("not time")
      return true
    }
    let now = Math.floor(new Date().getTime() / 1000)
    if(now > time) {
      return true
    } else {
      return false
    }
  }

  activateVestedSection() {
    if(this.checkVested.nativeElement.checked) {
      this.isCheckedVested = true;
    } else {
      this.isCheckedVested = false;
      this.myPresaleRestartForm.get('releaseIntervalNumber')?.setValue(null)
      this.myPresaleRestartForm.get('release')?.setValue(null)
      this.myPresaleRestartForm.get('releaseInterval')?.setValue(null)
    }
  }

  async addBacking() {
    let amount = this.addBackingControl.value * Math.pow(10, 6)
    let wallet = this._walletsConnectService.sessionWallet
    if(amount > 0) {
      let response = await this.deployedApp.addBacking(wallet!, amount, this.smartToolData.contractId)
      if(response) {
        this.closePopUp(true)
      }
    }
  }

}
