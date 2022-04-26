import { Component, OnInit } from '@angular/core';
import { Algodv2 } from 'algosdk';
import AccountInformation from 'algosdk/dist/types/src/client/v2/algod/accountInformation';
import AlgodClient from 'algosdk/dist/types/src/client/v2/algod/algod';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { deployService } from 'src/app/services/APIs/deploy/deploy-service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

export type BlockchainTrackInfo = {
  price: number,
  holding: number,
  marketCap: number,
  totalBacking: number,
  totalSupply: number,
  burned: number,
  holders: number,
  tokenLiq: number,
  algoLiq: number
}

export type TrackData = {
  assetView: AssetViewModel,
  open: boolean,
  blockchainTrackInfo: BlockchainTrackInfo
}

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})

export class TrackComponent implements OnInit {
  dropDownOpen = false;
  accInfo: Record<string, any> | undefined;

  constructor(
    private assetReqService: AssetReqService,
    private walletService: WalletsConnectService,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp
  ) { }
  arr: TrackData[] = [];

  async ngOnInit(): Promise<void> {
    this.arr = []
    const wallet = localStorage.getItem('wallet');
    let client: Algodv2 = getAlgodClient()
    this.accInfo = await client.accountInformation(wallet!).do()
    console.log(this.accInfo)

    let verseView: AssetViewModel = await this.verseApp.getViewModel()
    let verseTrackInfo = await this.verseApp.getTrackInfo(wallet!)
    let verseData: TrackData = {
      assetView: verseView,
      open: false,
      blockchainTrackInfo: verseTrackInfo
    }
    console.log(verseData)
    this.arr.push(verseData)

    this.assetReqService.getAssetPairs(true, '', wallet!).subscribe(
      (res: AssetViewModel[]) => {
        console.log(res);
        res.forEach(async element => {
          let asset = this.accInfo!['assets'].find((el: any) => {
            return el['asset-id'] == element.assetId
          })
          if(asset) {
            let info: BlockchainTrackInfo = await this.deployedApp.getTrackInfo(wallet!, element.contractId)
            if(!element.url){
              element.url = "-"
            }
            let trackData: TrackData = {
              assetView: element,
              open: false,
              blockchainTrackInfo: info
            }
            console.log(trackData)
            this.arr.push(trackData)
          }
        });
      }
    )
  }

  dropDownToggle(i: number) {
    this.arr[i].open = !this.arr[i].open;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

  pow(decimal: number){
    return Math.pow(10, decimal)
  }
}
