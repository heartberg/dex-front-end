import {Component, DoCheck, OnInit} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SessionWallet } from 'algorand-session-wallet';
import { Algodv2 } from 'algosdk';
import { time } from 'console';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { DeployedApp, StateKeys } from 'src/app/blockchain/deployer_application';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { ProjectViewModel } from 'src/app/models/projectViewModel';
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
export class MyPresaleComponent implements OnInit, DoCheck {
  arr: [ProjectPreviewModel, PresaleBlockchainInformation][] = [];

  isPopUpOpen: boolean = false;
  isRestart: boolean = false;
  isFair: boolean = false;

  isPresaleEnded: boolean = true;
  isSoldOut: boolean = false;
  wallet: SessionWallet | undefined

  projectPreviewModel: ProjectPreviewModel | undefined;
  projectModel: ProjectViewModel | undefined;
  presaleData: PresaleBlockchainInformation | undefined;
  isPool: boolean = false;

  //
  finalStepApi: boolean = false;
  Faild: boolean = false;
  isPending: boolean = false;
  closePopup: boolean = false;
  //

  constructor(
    private projectReqService: projectReqService,
    private assetReqService: AssetReqService,
    private app: DeployedApp,
    private walletService: WalletsConnectService
  ) {}

  async openPopUp(version: string, presale: ProjectPreviewModel) {
    if(version === 'dist') {
      this.isRestart = false;
      this.isFair = false;
      this.isPool = true;
      this.projectPreviewModel = presale
    } else {
      this.projectReqService.getProjectWithpresaleById(presale.projectId).subscribe(
        async (value: ProjectViewModel) => {
          console.log(value)
          this.projectModel = value
          this.presaleData = await this.app.getPresaleInfo(presale.asset.smartProperties!.contractId)
          if (version === 'restart') {
            this.isRestart = true;
            this.isFair = false;
            this.isPool = false;
          } else if (version === 'fair') {
            this.isRestart = false;
            this.isFair = true;
            this.isPool = false;
          }
        }
      )
    }
    this.isPopUpOpen = true;
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

  ngDoCheck() {
    if(localStorage.getItem('sendWaitSuccess') === 'pending') {
      this.closePopup = true;
      this.isPending = true;
      this.Faild = false;
      this.finalStepApi = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'fail') {
      this.closePopup = true;
      this.Faild = true;
      this.finalStepApi = false;
      this.isPending = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'success') {
      this.closePopup = true;
      this.finalStepApi = true;
      this.Faild = false;
      this.isPending = false;
    }

  }

  ngOnInit(): void {
    const wallet = localStorage.getItem('wallet');
    if(wallet){
      this.arr = []
      this.projectReqService.getCreatedPresales(wallet, 1).subscribe((res) => {
        res.forEach(async presaleModel => {
          if(presaleModel.asset.smartProperties) {
            let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.smartProperties!.contractId)
            this.arr.push([presaleModel, blockchainInfo])
          } else {
            let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
            this.arr.push([presaleModel, blockchainInfo])
          }

        });
        console.log(res);
      });
    }
  }

  pow(decimal: number): number {
    return Math.pow(10, decimal)
  }

  formatDate(timestamp: number): string {
    let date = new Date(timestamp * 1000)
    //console.log(date)
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

  isFailed(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleEnd < currentTimeStamp && blockchainInfo.totalRaised < blockchainInfo.softCap) {
      return true;
    } else {
      return false;
    }
  }

  isSuccessFull(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleEnd < currentTimeStamp && blockchainInfo.totalRaised > blockchainInfo.softCap) {
      return true;
    } else {
      return false;
    }
  }

  hasEnded(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleEnd < currentTimeStamp) {
      return true;
    } else {
      return false;
    }
  }

  hasStarted(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleStart < currentTimeStamp) {
      return true;
    } else {
      return false;
    }
  }

  async claim(contractId: number) {
    let wallet = this.walletService.sessionWallet
    let response = await this.app.claimPresale(wallet!, contractId)
    if(response) {
      console.log("successful claimed")
    }
  }

}
