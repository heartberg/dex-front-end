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
import { DeployLb } from '../deploy/deploy-api-logic-file/deploy.lb';
import { AsaPresaleSettings, AsaSettings } from '../deploy/deploy.component';
import { PresaleBlockchainInformation } from '../launchpad/launch-detail/launch-detail.component';
import { DeployState } from '../my-deploys/my-deploys.component';


@Component({
  selector: 'app-my-presale',
  templateUrl: './my-presale.component.html',
  styleUrls: ['./my-presale.component.scss'],
})
export class MyPresaleComponent implements OnInit, DoCheck {
  arr: [ProjectPreviewModel, PresaleBlockchainInformation, DeployState][] = [];

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
  isAddBacking: boolean = false;
  //

  constructor(
    private projectReqService: projectReqService,
    private assetReqService: AssetReqService,
    private app: DeployedApp,
    private walletService: WalletsConnectService,
    private deployLib: DeployLb
  ) {}

  async openPopUp(version: string, presale: ProjectPreviewModel) {
    if(version === 'dist') {
      this.isRestart = false;
      this.isFair = false;
      this.isPool = true;
      this.isAddBacking = false;
      this.projectPreviewModel = presale
    } else if(version === 'backing') {
      this.isRestart = false;
      this.isFair = false;
      this.isPool = false;
      this.isAddBacking = true
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
            this.isAddBacking = false;
          } else if (version === 'fair') {
            this.isRestart = false;
            this.isFair = true;
            this.isPool = false;
            this.isAddBacking = false;
          }
        }
      )
    }
    this.isPopUpOpen = true;
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
    this.closePopup = event;
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
    if (this.closePopup) {
      this.isPopUpOpen = false;
    }
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
            let deployState: DeployState = await this.getDeployState(presaleModel)
            this.arr.push([presaleModel, blockchainInfo, deployState])
          } else {
            let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
            let deployState: DeployState = await this.getDeployState(presaleModel)
            this.arr.push([presaleModel, blockchainInfo, deployState])
          }
        });
        console.log(this.arr);
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

  // async hasMaxBuy(model: ProjectPreviewModel): Promise<boolean> {
  //   let hasMaxBuy = false;
  //   if(model.asset.smartProperties) {
  //     hasMaxBuy = await this.app.hasMaxBuy(model.asset.smartProperties!.contractId)
  //   }
  //   return hasMaxBuy
  // }

  async claim(contractId: number) {
    let wallet = this.walletService.sessionWallet
    let response = await this.app.claimPresale(wallet!, contractId)
    if(response) {
      console.log("successful claimed")
    }
  }

  async isRemoveMaxBuy(model: ProjectPreviewModel): Promise<boolean> {
    let hasMaxBuy = false
    if(model.asset.smartProperties) {
      hasMaxBuy = await this.app.hasMaxBuy(model.asset.smartProperties!.contractId)
    }

    return model.setup && model.burnOptIn && model.minted && hasMaxBuy
  }

  isOptInBurn(model: ProjectPreviewModel): boolean {
    return model.minted && !model.burnOptIn && !model.setup
  }

  isSetup(model: ProjectPreviewModel): boolean {
    return model.minted && model.burnOptIn && !model.setup
  }

  isMint(model: ProjectPreviewModel): boolean {
    return !model.minted && !model.burnOptIn && !model.setup
  }

  async getDeployState(project: ProjectPreviewModel): Promise<DeployState> {
    let optInState = false
    let removeState = false
    let mintState = false
    if(project.asset.smartProperties) {
      optInState = this.isOptInBurn(project)
      removeState = await this.isRemoveMaxBuy(project)
      mintState = this.isMint(project)
    }
    let setupState = this.isSetup(project)
    let finished = !(mintState || optInState || removeState || setupState)
    return {
      mintState: mintState,
      optInBurnState: optInState,
      removeMaxBuyState: removeState,
      setupState: setupState,
      finished: finished
    }
  }

  async deployFromMint(model: ProjectPreviewModel) {
    this.projectReqService.getProjectWithpresaleById(model.projectId).subscribe(
      async (value: ProjectViewModel) => {
        let projectModel = value
        console.log(projectModel)
        await this.deployLib.deployFromMintPresale(projectModel)
      }
    )
  }

  asaObjectInitialize(project: ProjectViewModel) {
    let sessionWallet = this.walletService.sessionWallet!
    let standardBlockchainObject: AsaSettings = {
      creator: sessionWallet.getDefaultAccount(),
      totalSupply: project.asset.totalSupply,
      name: project.asset.name,
      unit: project.asset.unitName,
      decimals: project.asset.decimals,
      url: project.asset.url!,
      poolStart: undefined,
      poolInterval: undefined,
      poolRewards: undefined,
      rewardsPerInterval: undefined,
      poolDuration: undefined,
      isDistribution: false,
      presaleSettings: {
        contractId: 0,
        presaleTokenAmount: project.presale!.tokenAmount,
        presaleStart: project.presale!.startingTime,
        presaleEnd: project.presale!.endingTime,
        softcap: project.presale!.softCap,
        hardcap: project.presale!.hardCap,
        walletcap: project.presale!.walletCap,
      }
    }
    localStorage.setItem("standardBlockchainObj", JSON.stringify(standardBlockchainObject))
  }

  async deployFromSetup(model: ProjectPreviewModel) {
    this.projectReqService.getProjectWithpresaleById(model.projectId).subscribe(
      async (value: ProjectViewModel) => {
        let projectModel = value
        console.log(projectModel)
        if(projectModel.asset.smartProperties) {
          await this.deployLib.deployFromSetupPresale(projectModel)
        } else {
          await this.deployLib.deployFromSetupAsaPresale(projectModel)
        }
        
      }
    )
  }

  async deployFromOptIn(model: ProjectPreviewModel) {
    this.projectReqService.getProjectWithpresaleById(model.projectId).subscribe(
      async (value: ProjectViewModel) => {
        let projectModel = value
        console.log(projectModel)
        await this.deployLib.deployFromOptInPresale(projectModel)
      }
    )
  }

}
