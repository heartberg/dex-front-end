import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Algodv2 } from 'algosdk';
import { time } from 'console';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { LockSettings, LockerApp } from 'src/app/blockchain/locker_application'
import { AssetViewModel } from 'src/app/models/assetViewModel';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
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

  assetsOwned: any | undefined;

  // @ts-ignore
  lockerFormGroup: FormGroup;
  dropDownValues: string[] | undefined;

  constructor(
    private locker: LockerApp,
    private walletService: WalletsConnectService,
    private fb: FormBuilder,
    private assetService: AssetReqService
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
      } else {
        await this.getAssetsOfAccount()
        console.log(wallet.getDefaultAccount())
      }
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

  async getAssetsOfAccount() {
    let wallet = this.walletService.sessionWallet!.getDefaultAccount()
    let client: Algodv2 = getAlgodClient()
    let accountInfo = await client.accountInformation(wallet).do()
    this.assetsOwned = []
    this.dropDownValues = []

    this.assetService.getAssetPairs(true, '', wallet).subscribe(
      async (res: AssetViewModel[]) => {
        let assetsInWallet = accountInfo['assets']
        this.assetsOwned = assetsInWallet
        assetsInWallet.forEach(async (element: { [key: string]: number; }) => {
          let asset = res.find( x => {
            return x.assetId == element['asset-id']
          })
          console.log(asset)
          let assetInfo = await client.getAssetByID(element['asset-id']).do()
          if(!asset) {
            this.dropDownValues!.push(assetInfo['params']['name'] + " ASA ID: " + element['asset-id'])
          } else {
            console.log(asset)
            this.dropDownValues!.push(assetInfo['params']['name'] + " ASA ID: " + element['asset-id'] + " Contract ID: " + asset.smartProperties!.contractId)
          }
        });
      }
    )
  }

  formatDate(timestamp: number){
    let date = new Date(timestamp * 1000)
    let minutes = date.getMinutes().toString()
    if(date.getMinutes() < 10) {
      minutes = "0" + minutes
    }
    let hours = date.getHours().toString()
    if(date.getHours() < 10){
      hours = "0" + hours
    }
    return date.toDateString() + " - " + hours + ":" + minutes
  }

  formatPeriod(timestamp: number) {
    let now = Math.floor(new Date().getTime() / 1000)
    let duration = timestamp - now
    let hours = duration / 60 / 60
    if(hours >= 1){
      if(Math.floor(hours / 24) > 0){
        let suffix = " day"
        let days = Math.floor(hours / 24)
        if(days > 1) suffix += "s"
        return days + suffix
      } else {
        if(hours < 10) {
          return "0" + hours + " h"
        } else {
          return hours + " h"
        }
      }
    } else {
      let minutes = duration / 60
      if(minutes < 10) {
        return "0" + minutes + " min"
      } else {
        return minutes + " min"
      }
    }
  }

}


