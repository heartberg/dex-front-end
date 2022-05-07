import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SessionWallet } from 'algorand-session-wallet';
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { DeployedApp, StateKeys } from 'src/app/blockchain/deployer_application';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { deployService } from 'src/app/services/APIs/deploy/deploy-service';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { getAppLocalStateByKey } from 'src/app/services/utils.algo';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({
  selector: 'app-my-presale',
  templateUrl: './my-presale.component.html',
  styleUrls: ['./my-presale.component.scss'],
})
export class MyPresaleComponent implements OnInit {
  // arr: string[] = ['ended', 'failed', 'failed', 'ended', 'user', 'failed', 'user'];
  arr: ProjectPreviewModel[] = [];

  isPopUpOpen: boolean = false;
  isRestart: boolean = false;
  isFair: boolean = false;

  isPresaleEnded: boolean = true;
  isSoldOut: boolean = false;
  wallet: SessionWallet | undefined

  constructor(
    private projectReqService: projectReqService,
    private assetReqService: AssetReqService,
    private app: DeployedApp,
    private walletService: WalletsConnectService
  ) {}

  openPopUp(version: string) {
    this.isPopUpOpen = true;
    if (version === 'restart') {
      this.isRestart = true;
      this.isFair = false;
    } else if (version === 'fair') {
      this.isRestart = false;
      this.isFair = true;
    }
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  async removeMaxBuy(assetId: number, contractId: number) {
    this.wallet = this.walletService.sessionWallet!
    let response = await this.app.removeMaxBuy(this.wallet, contractId);
    this.assetReqService.removeMaxBuy(assetId).subscribe((res) => {
      console.log(res);
    });
  }

  makeRequest(form: FormGroup) {
    if (Object.keys(form.controls).length === 2) {
      console.log('fairLaunch', form);
    }

    if (Object.keys(form.controls).length === 8) {
      console.log('restartPresale', form);
    }
  }

  ngOnInit(): void {
    const wallet = localStorage.getItem('wallet');
    if(wallet){
      this.projectReqService.getCreatedPresales(wallet, 1).subscribe((res) => {
        console.log(res);
        this.arr = res;
      });
    }
  }

  pow(decimal: number): number {
    return Math.pow(10, decimal)
  }

  toDate(timestamp: number): string {
    let date = new Date(timestamp * 1000)
    return date.toDateString() + " - " + date.getHours().toString() + ":" + date.getMinutes().toString()
  }

  isFailed(model: ProjectPreviewModel): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(model.presale.endingTime < currentTimeStamp && model.presale.totalRaised < model.presale.softCap) {
      return true;
    } else {
      return false;
    }
  }

  isSuccessFull(model: ProjectPreviewModel): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(model.presale.endingTime < currentTimeStamp && model.presale.totalRaised > model.presale.softCap) {
      return true;
    } else {
      return false;
    }
  }

  isOngoing(model: ProjectPreviewModel): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(model.presale.endingTime > currentTimeStamp) {
      return true;
    } else {
      return false;
    }
  }

}
