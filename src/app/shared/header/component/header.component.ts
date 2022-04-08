import {AfterViewInit, Component, ElementRef, EventEmitter, OnChanges, OnInit, Output} from '@angular/core';
import { Router } from "@angular/router";
import {Observable, of} from "rxjs";
import {AuthService} from "../../../services/authService.service";
import {User} from "../../../models/user.model";
import {host} from "@angular-devkit/build-angular/src/test-utils";
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({

  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],

})
export class HeaderComponent implements OnInit {

  public isProfileOpened = false;
  public isPopUpOpened = false;
  public isMenuRespoOpened = false;
  public isDarkModeChanged = false;
  public walletConnectionPassed = false;
  public isProfileOpenedOnRespo = false;
  public changeRespoNavAndProfileIcons = false;
  public changeRespoNavAndProfileIconsCounter = 1;
  public SearchRespoOpened = false;
  // @ts-ignore
  // $isLoggedIn: Observable<AuthState>;
  // permanent
  public isLoggedIn: boolean = false;
  @Output() themeWasChanged = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private _walletsConnectService: WalletsConnectService,
    private _eref: ElementRef,
  ) { }

  ngOnInit(): any {
    if (this._walletsConnectService.sessionWallet && this._walletsConnectService.sessionWallet!.connected()) {
      this.isLoggedIn = true;
    }
    // if (localStorage.getItem('wallet')) {
    //   this.isLoggedIn = true;
    // }
  }

  openAvatar() {
    if (!this.isMenuRespoOpened) {
      this.isProfileOpened = !this.isProfileOpened;
    } else {
      this.isProfileOpenedOnRespo = true;
      this.changeRespoNavAndProfileIconsCounter = this.changeRespoNavAndProfileIconsCounter + 1;
      if (this.changeRespoNavAndProfileIconsCounter % 2 === 0) {
        this.changeRespoNavAndProfileIcons = true;
      } else {
        this.changeRespoNavAndProfileIcons = false;
      }
      console.log(this.changeRespoNavAndProfileIcons);
    }

  }

  connectWalletPopUp() {
    this.isPopUpOpened = !this.isPopUpOpened;
  }

  closePopUp(event: boolean) {
    this.isPopUpOpened = event;
  }

  showMenuRespo() {
    this.isMenuRespoOpened = !this.isMenuRespoOpened;
  }

  changeDarkMode() {
    this.isDarkModeChanged = !this.isDarkModeChanged
    if (this.isDarkModeChanged) {
      this.themeWasChanged.emit(true);
    } else {
      this.themeWasChanged.emit(false);
    }
  }

  walletConnectionSucceed(event: boolean): void {
    this.isPopUpOpened = false;
    this.walletConnectionPassed = true;
  }

  openSearchRespo() {
    this.SearchRespoOpened = true;
  }

  closeSearchRespo() {
    this.SearchRespoOpened = false;
  }

  connect(event: any) {
    console.log(event);
    this.isLoggedIn = true;
    this.isPopUpOpened = false;
  }

  loginIn($event: any) {
    this.authService.getUserByWallet(
      // @ts-ignore
      $event
    )
      .subscribe(
        (user: User) => {
          console.log(user);
          this.isLoggedIn = true;
          this.isPopUpOpened = false;
        }
      )
  }

  disconnect() {
    this.isLoggedIn = false;
    localStorage.removeItem('wallet');
    this._walletsConnectService.disconnect()
  }

  closeDropDown() {
    console.log('clicked outside');
  }

}
