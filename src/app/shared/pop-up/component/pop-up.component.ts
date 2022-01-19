import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { of } from "rxjs";
import {WalletsConnectService} from "../../../services/wallets-connect.service";
import {AuthService} from "../../../services/authService.service";
import {User} from "../../../models/user.model";

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopUpComponent implements OnInit {
  @Output() isConnectedToWallet = new EventEmitter<boolean>();
  @Output() isClosed = new EventEmitter<boolean>();
  @Output() logInValue = new EventEmitter<string | null>();
  @Output() isLiquiditied = new EventEmitter<boolean>();

  @Input() openWallet: boolean = false;
  @Input() isDeploy: boolean = false;
  @Input() isTrade: boolean = false;
  
  
  @Input() isRestart: boolean = false;
  @Input() isFair: boolean = false;

  constructor(
    private _walletsConnectService: WalletsConnectService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
  }

  closePopUp(value: any) {
    this.isClosed.emit(false);
  }


  async setelectWalletConnect(value: string) {
    if (value === 'MyAlgoWallet') {
      await of(this._walletsConnectService.connectToMyAlgo()).toPromise();
      let wallet = localStorage.getItem('wallet');
      if (this._walletsConnectService.myAlgoAddress && this._walletsConnectService.myAlgoName !== undefined) {
        this.authService.createUser(
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
            website: ''
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
              this.logInValue.emit(wallet);
              this.isConnectedToWallet.emit(false);
            }
          )
      }
    }
  }

  triggetLiquidity() {
    this.isLiquiditied.emit(true);
  }
}
