import { Component, OnInit } from '@angular/core';
import { Algodv2 } from 'algosdk';
import AccountInformation from 'algosdk/dist/types/src/client/v2/algod/accountInformation';
import AlgodClient from 'algosdk/dist/types/src/client/v2/algod/algod';
import { reduce } from 'rxjs/operators';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation, platform_settings as ps} from 'src/app/blockchain/platform-conf';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { TokenEntryViewModel } from 'src/app/models/tokenEntryViewModel';
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
  algoLiq: number,
  tradingStart: number
}

export type PriceData = {
  avgBuyEntry: number,
  avgSellEntry: number,
  buyChange: string,
  sellChange: string,
  tradingStart: Date,
}

export type TrackData = {
  assetView: AssetViewModel,
  open: boolean,
  blockchainTrackInfo: BlockchainTrackInfo,
  price: PriceData
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
    let priceData: PriceData = {
      avgBuyEntry: 0,
      avgSellEntry: 0,
      sellChange: "-",
      buyChange: "-",
      tradingStart: new Date()
    };

    this.assetReqService.getAverageEntries(wallet!, verseView.assetId).subscribe(
      (res: TokenEntryViewModel[]) => {
        console.log(res);
        priceData = this.mapEntries(res, verseTrackInfo);
      }
    )
    let verseData: TrackData = {
      assetView: verseView,
      open: false,
      blockchainTrackInfo: verseTrackInfo,
      price: priceData
    }
    console.log(verseData)
    this.arr.push(verseData)

    this.assetReqService.getAssetPairs(true, '', wallet!).subscribe(
      (res: AssetViewModel[]) => {
        this.removeVerse(res)
        console.log(res);
        res.forEach(async element => {
            let info: BlockchainTrackInfo = await this.deployedApp.getTrackInfo(wallet!, element.contractId)
            if(!element.url){
              element.url = "-"
            }
            let priceData: PriceData = {
              avgBuyEntry: 0,
              avgSellEntry: 0,
              sellChange: "-",
              buyChange: "-",
              tradingStart: new Date()
            };

            this.assetReqService.getAverageEntries(wallet!, element.assetId).subscribe(
              (res: TokenEntryViewModel[]) => {
                priceData = this.mapEntries(res, info);
                let trackData: TrackData = {
                  assetView: element,
                  open: false,
                  blockchainTrackInfo: info,
                  price: priceData
                }
                console.log(trackData)
                this.arr.push(trackData)
              }
            )
        });
      }
    )
  }
  mapEntries(res: TokenEntryViewModel[], info: BlockchainTrackInfo): PriceData {
    let priceData: PriceData = {
      avgBuyEntry: 0,
      avgSellEntry: 0,
      sellChange: "-",
      buyChange: "-",
      tradingStart: new Date()
    };

    res.forEach(entry => {
      if(entry.buy == true) {
        priceData.avgBuyEntry = entry.price;
        if (entry.price < info.price){
          console.log(entry.price)
          console.log(info.price)
          priceData.buyChange = "+" + (info.price / entry.price  * 100).toFixed(2);
        } else {
          console.log(entry.price)
          console.log(info.price)
          priceData.buyChange = (((info.price / entry.price) - 1) * 100).toFixed(2);
        }
      } else {
        priceData.avgSellEntry = entry.price
        if (entry.price < info.price){
          priceData.sellChange = "-" + (entry.price * info.price / 100).toFixed(2);
        } else {
          priceData.sellChange = "+" + (entry.price / info.price * 100).toFixed(2);
        }
      }
    });
    return priceData!;
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

  removeVerse(arr: AssetViewModel[]){
    arr.forEach( (item, index) => {
      if(item.assetId === ps.platform.verse_asset_id) arr.splice(index,1);
    });
  }
}
