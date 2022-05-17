import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WalletsConnectService } from '../../../services/wallets-connect.service';
import { AuthService } from '../../../services/authService.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { PresaleBlockchainInformation, PresaleEntryData } from 'src/app/modules/launchpad/launch-detail/launch-detail.component';


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

  @Input() openWallet: boolean = false;
  @Input() isDeploy: boolean = false;
  @Input() isTrade: boolean = false;
  @Input() isBorrow: boolean = false;
  @Input() isBacking: boolean = false;

  @Input() isRestart: boolean = false;
  @Input() isFair: boolean = false;

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
  presaleData: PresaleBlockchainInformation | undefined;
  
  @Input()
  presaleEntryData: PresaleEntryData | undefined

  // FORMS

  // trade new popup flows
  @Input() isTradeLend: boolean = false;
  @Input() isTradeBacking: boolean = true;
  @Input() isTradeTrade: boolean = false;
  // trade new popup flows

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

  // FORMS

  onSubmit(formName: string) {
    if (formName === 'myPresaleRestartForm') {
      this.makeRequest.next(this.myPresaleRestartForm);
      this.myPresaleRestartForm.reset();
      console.log(this.presaleData)
    }

    if (formName === 'myPresaleFairLaunchForm') {
      this.makeRequest.next(this.myPresaleFairLaunchForm);
      this.myPresaleFairLaunchForm.reset();
      console.log(this.presaleData)
    }
  }

  constructor(
    private _walletsConnectService: WalletsConnectService,
    private authService: AuthService,
    private fb: FormBuilder,
    private verseApp: VerseApp,
    private deployedApp: DeployedApp
  ) {}

  ngOnInit(): void {
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
  }

  closePopUp(value: any) {
    this.isClosed.emit(false);
  }

  // async setelectWalletConnect(value: string) {
  //   if (value === 'MyAlgoWallet') {
  //     await of(this._walletsConnectService.connectToMyAlgo()).toPromise();
  //     let wallet = localStorage.getItem('wallet');
  //     if (
  //       this._walletsConnectService.myAlgoAddress &&
  //       this._walletsConnectService.myAlgoName !== undefined
  //     ) {
  //       this.authService
  //         .createUser(
  //           // @ts-ignore
  //           {
  //             wallet: wallet,
  //             name: 'Name',
  //             verified: false,
  //             bio: 'Nothing yet...',
  //             profileImage: '',
  //             banner: '',
  //             featuredImage: '',
  //             customUrl: '',
  //             twitter: '',
  //             instagram: '',
  //             website: '',
  //           }
  //         )
  //         .subscribe(
  //           (user: any) => {
  //             console.log(user);
  //             this.isConnectedToWallet.emit(false);
  //             this.logInValue.emit(wallet);
  //           },
  //           (error) => {
  //             console.log('error', error);
  //             this.logInValue.emit(wallet);
  //             this.isConnectedToWallet.emit(false);
  //           }
  //         );
  //     }
  //   }
  // }


  async setelectWalletConnect(value: string) {
    // if (value === 'MyAlgoWallet') {
    //   await of(this._walletsConnectService.connectToMyAlgo()).toPromise();
    //   if (this._walletsConnectService.myAlgoAddress && this._walletsConnectService.myAlgoName !== undefined) {
    //     this.isConnectedToWallet.emit(false);
    //     console.log('emited')
    //     console.log('Connected to MyAlgoWallet')
    //   }
    // } else if (value == 'WalletConnect') {
    //   this._walletsConnectService.connectToWalletConnect();
    //   if (this._walletsConnectService.myAlgoAddress && this._walletsConnectService.myAlgoName !== undefined) {
    //     this.isConnectedToWallet.emit(false);
    //     console.log('Connected to MyAlgoWallet')
    //   }
    // }

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

  activateLandAndTrade(id: number) {
    if (id === 1) {
      this.isTradeLend = false;
      this.isTradeBacking = false;
      this.isTradeTrade = true;
    } else if (id === 2) {
      this.isTradeLend = true;
      this.isTradeBacking = false;
      this.isTradeTrade = false;
    } else if (id === 3) {
      this.isTradeLend = false;
      this.isTradeBacking = true;
      this.isTradeTrade = false;
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

}
