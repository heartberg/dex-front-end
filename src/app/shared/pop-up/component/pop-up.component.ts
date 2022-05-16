import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { of } from 'rxjs';
import { WalletsConnectService } from '../../../services/wallets-connect.service';
import { AuthService } from '../../../services/authService.service';
import { User } from '../../../models/user.model';
import { Form, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { DeployedAppSettings } from 'src/app/blockchain/platform-conf';
import { DeployedApp } from 'src/app/blockchain/deployer_application';


export type SmartToolData = {
  userSupplied: number,
  availableTokenAmount: number,
  availableAlgoAmount: number,
  userBorrowed: number,
  assetDecimals: number,
  contractId: number,
  totalBacking: number,
  totalBorrowed: number
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

  @Input()
  smartToolData: SmartToolData = {
    assetDecimals: 0,
    availableTokenAmount: 0,
    availableAlgoAmount: 0,
    contractId: 0,
    userBorrowed: 0,
    userSupplied: 0,
    totalBacking: 0,
    totalBorrowed: 0
  }

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
    softCap: [],
    hardCap: [],
    walletCap: [],
    toLiquidity: [],
  });

  myPresaleFairLaunchForm = this.fb.group({
    tradingStart: [],
    additionalAlgo: [],
    fairLaunchToken: [],
    algoLiq: [],
  });

  // FORMS

  onSubmit(formName: string) {
    if (formName === 'myPresaleRestartForm') {
      this.makeRequest.next(this.myPresaleRestartForm);
      this.myPresaleRestartForm.reset();
    }

    if (formName === 'myPresaleFairLaunchForm') {
      this.makeRequest.next(this.myPresaleFairLaunchForm);
      this.myPresaleFairLaunchForm.reset();
    }
  }

  constructor(
    private _walletsConnectService: WalletsConnectService,
    private authService: AuthService,
    private fb: FormBuilder,
    private verseApp: VerseApp,
    private deployedApp: DeployedApp
  ) {}

  ngOnInit(): void {}

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
}
