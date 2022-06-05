import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LockSettings, LockerApp } from 'src/app/blockchain/locker_application'
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({
  selector: 'app-locker',
  templateUrl: './locker.component.html',
  styleUrls: ['./locker.component.scss']
})
export class LockerComponent implements OnInit {

  @ViewChild('Vested', {static: false})
  // @ts-ignore
  private Vested: ElementRef;

  vestedChecked: boolean = false;
  walletLockedAlready: boolean = false;
  lockSettings: LockSettings | undefined;
  tokensPerInterval: number = 0;

  // @ts-ignore
  lockerFormGroup: FormGroup;

  constructor(
    private locker: LockerApp,
    private walletService: WalletsConnectService,
    private fb: FormBuilder,
  ) { }

  async ngOnInit(): Promise<void> {

    this.lockerFormGroup = this.fb.group({
      amount: null,
      lockTime: null,
      releaseInterval: null,
      releasePerInterval: null,
      vestedCheck: false
    })

    let wallet = this.walletService.sessionWallet
    if(wallet) {
      this.lockSettings = await this.locker.getLockData(wallet.getDefaultAccount())
      console.log(this.lockSettings)
      if(this.lockSettings.amount > 0) {
        this.walletLockedAlready = true;
      }
      console.log(wallet.getDefaultAccount())
    }
  }

  activateVestedSection() {
    if (this.Vested.nativeElement.checked) {
      this.vestedChecked = true;
    } else {
      this.vestedChecked = false;
    }
  }

  lockTokens() {
    console.log("lock tokens")
    // this.getLockSettings()
    console.log(this.lockerFormGroup!.value)
    // console.log(this.lockSettings)
  }

  getLockSettings() {
    console.log("get lock settings")
  }

}
