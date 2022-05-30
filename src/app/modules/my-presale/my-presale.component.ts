import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SessionWallet } from 'algorand-session-wallet';
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { DeployedApp, StateKeys } from 'src/app/blockchain/deployer_application';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { deployService } from 'src/app/services/APIs/deploy/deploy-service';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { getAppLocalStateByKey } from 'src/app/services/utils.algo';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import { PresaleBlockchainInformation } from '../launchpad/launch-detail/launch-detail.component';


@Component({
  selector: 'app-my-presale',
  templateUrl: './my-presale.component.html',
  styleUrls: ['./my-presale.component.scss'],
})
export class MyPresaleComponent implements OnInit {
  // arr: string[] = ['ended', 'failed', 'failed', 'ended', 'user', 'failed', 'user'];
  arr: [ProjectPreviewModel, PresaleBlockchainInformation][] = [];

  isPopUpOpen: boolean = false;
  isRestart: boolean = false;
  isFair: boolean = false;

  isPresaleEnded: boolean = true;
  isSoldOut: boolean = false;
  wallet: SessionWallet | undefined

  projectModel: ProjectViewModel | undefined;
  presaleData: PresaleBlockchainInformation | undefined;

  constructor(
    private projectReqService: projectReqService,
    private assetReqService: AssetReqService,
    private app: DeployedApp,
    private walletService: WalletsConnectService
  ) {}

  async openPopUp(version: string, presale: ProjectPreviewModel) {
    this.projectReqService.getProjectWithpresaleById(presale.projectId).subscribe(
      async (value: ProjectViewModel) => {
        console.log(value)
        this.projectModel = value
        this.presaleData = await this.app.getPresaleInfo(presale.asset.contractId)
        this.isPopUpOpen = true;
        if (version === 'restart') {
          this.isRestart = true;
          this.isFair = false;
        } else if (version === 'fair') {
          this.isRestart = false;
          this.isFair = true;
        }
      }
    )
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  async removeMaxBuy(assetId: number, contractId: number) {
    this.wallet = this.walletService.sessionWallet!
    let response = await this.app.removeMaxBuy(this.wallet, contractId);
    if(response) {
      console.log("removed max buy")
    } else {
      console.log("error")
    }
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
      this.arr = []
      this.projectReqService.getCreatedPresales(wallet, 1).subscribe((res) => {
        res.forEach(async presaleModel => {
          let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.contractId)
          this.arr.push([presaleModel, blockchainInfo])
        });
        console.log(res);
      });
    }
  }

  pow(decimal: number): number {
    return Math.pow(10, decimal)
  }

  formatDate(date: Date): string {
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

  async claim(contractId: number) {
    let wallet = this.walletService.sessionWallet
    let response = await this.app.claimPresale(wallet!, contractId)
    console.log("successful claimed")
  }

}
