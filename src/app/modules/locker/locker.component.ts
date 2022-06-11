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
  assetContractId: number | undefined;
  assetsOwned: any | undefined;

  // @ts-ignore
  lockerFormGroup: FormGroup;
  dropDownValues: string[] | undefined;
  selectedStakingAsset: any;
  selectedStakingAssetInfo: any;
  selectedAmount: number = 0;
  selectedUnit: string = "";
  optedIn: boolean = false;

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
      if(this.lockSettings.amount == -1){
        this.optedIn = false;
      } else {
        this.optedIn = true;
      }
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
    this.getLockSettings()
    console.log(this.lockSettings)
    let wallet = this.walletService.sessionWallet
    if(this.assetContractId) {
      this.locker.setupSmartLock(wallet!, this.lockSettings!)
    } else {
      this.locker.setupStandardLock(wallet!, this.lockSettings!)
    }
    
  }

  getLockSettings() {
    let amount = +this.lockerFormGroup.get("amount")?.value * Math.pow(10, this.selectedStakingAssetInfo['params']['decimals'])
    let lockTime = new Date(this.lockerFormGroup.get("lockTime")?.value).getTime() / 1000
    let periodTime = undefined
    let tokensPerPeriod = undefined
    if(this.vestedChecked) {
      periodTime = this.lockerFormGroup.get("releaseInterval")?.value * 86400
      tokensPerPeriod = +this.lockerFormGroup.get("releasePerInterval")?.value * Math.pow(10, this.selectedStakingAssetInfo['params']['decimals'])
    }
    this.lockSettings = {
      amount: amount,
      lockTime: lockTime,
      assetId: this.selectedStakingAsset['asset-id'],
      assetContractId: this.assetContractId,
      periodTime: periodTime,
      tokensPerPeriod: tokensPerPeriod
    }
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
            if(this.dropDownValues!.length == 1){
              await this.getSelectedAsset(this.dropDownValues![0])
            }
          }
        }
        );
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

  async getSelectedAsset(event: string) {
    let splits = event.split(" ")
    console.log(splits)
    let length = splits.length
    let assetId = 0
    if (splits[length-3] == "Contract"){
      this.assetContractId = parseInt(splits[length-1])
      assetId = parseInt(splits[length-4])
    } else {
      assetId = parseInt(splits[length-1])
      this.assetContractId = undefined
    }
    let asset = this.assetsOwned.find((element: { [x: string]: any; }) => {
      return element['asset-id'] == assetId
    });
    if(asset){
      this.selectedStakingAsset = asset
      let client: Algodv2 = getAlgodClient()
      this.selectedStakingAssetInfo = await client.getAssetByID(assetId).do()
      this.selectedAmount = this.selectedStakingAsset['amount'] / Math.pow(10, this.selectedStakingAssetInfo['params']['decimals'])

      this.selectedUnit = this.selectedStakingAssetInfo['params']['unit-name']
    }
  }

  async optIn(){
    let wallet = this.walletService.sessionWallet
    if(wallet) {
      let response = await this.locker.optIn(wallet)
      if(response) {
        this.optedIn = true
      } else {
        this.optedIn = false;
      }
    }
  }

}


