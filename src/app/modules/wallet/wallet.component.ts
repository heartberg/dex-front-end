import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getIndexer } from 'src/app/blockchain/algorand';
import { TrackComponent } from '../track/track.component';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  public isActiveFirst: boolean = false;
  public isActiveSecond: boolean = false;
  public totalAlgoValue = 0;

  constructor(
    private route: ActivatedRoute,
  ) { }

  async ngOnInit(): Promise<void> {
    this.totalAlgoValue = JSON.parse(localStorage.getItem('algo')!);

    const wallet = localStorage.getItem("wallet");
    if(wallet){
      console.log(wallet)
      let indexer = getIndexer()
      console.log(await indexer.makeHealthCheck().do())
      console.log(await indexer.lookupAssetBalances(ps.platform.verse_asset_id).do())
      console.log("indexer checked!")
    }
    if (this.route.snapshot.routeConfig?.path === 'entries') {
      this.activeSecond();
    } else if (this.route.snapshot.routeConfig?.path === 'wallet') {
      this.activeFirst();
    } else {
      this.isActiveFirst = true;
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

  returnAlgo(): any{
    if(this.totalAlgoValue) {return  this.totalAlgoValue.toFixed(2)}
  }
}
