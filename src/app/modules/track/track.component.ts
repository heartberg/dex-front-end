import { Component, OnInit } from '@angular/core';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})
export class TrackComponent implements OnInit {
  dropDownOpen = false;

  constructor(
    private assetReqService: AssetReqService,
    private walletService: WalletsConnectService
  ) { }
  arr = [
    {
      number: 1,
      open: false
    },
    {
      number: 23,
      open: false
    },
    {
      number: 5,
      open: false
    },
    {
      number: 56,
      open: false
    },
    {
      number: 6,
      open: false
    }
  ];

  ngOnInit(): void {
    const wallet = localStorage.getItem('wallet');

    this.assetReqService.getAssetFavorites(wallet).subscribe(
      (res: AssetViewModel[]) => {
        console.log(res);
      }
    )
  }

  dropDownToggle(i: number) {
    this.arr[i].open = !this.arr[i].open;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

}
