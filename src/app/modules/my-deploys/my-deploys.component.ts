import { Component, OnInit } from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { AssetViewModel } from 'src/app/models/assetViewModel';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import {of} from "rxjs";
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { DeployLb } from '../deploy/deploy-api-logic-file/deploy.lb';
import { ProjectViewModel } from 'src/app/models/projectViewModel';
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';

export type DeployState = {
  mintState: boolean,
  optInBurnState: boolean,
  setupState: boolean,
  removeMaxBuyState: boolean,
  finished: boolean
}


@Component({
  selector: 'app-my-deploys',
  templateUrl: './my-deploys.component.html',
  styleUrls: ['./my-deploys.component.scss']
})

export class MyDeploysComponent implements OnInit {
  arr: [ProjectPreviewModel, DeployState][] = [];
  wallet: SessionWallet | undefined;
  isPopUpOpen: boolean = false;
  projectForDistribution: ProjectPreviewModel | undefined;
  constructor(
    private walletService: WalletsConnectService,
    private app: DeployedApp,
    private projectService: projectReqService,
    private deployLib: DeployLb
  ) { }

  ngOnInit(): void {
    this.wallet = this.walletService.sessionWallet;
    const addr = this.wallet?.getDefaultAccount()
    if(addr) {
      this.projectService.getCreatedProjects(addr, 1).subscribe(
        (res: ProjectPreviewModel[]) => {
          res.forEach(async element => {
            let state: DeployState = await this.getDeployState(element)
            console.log(state)
            console.log(element)
            this.arr.push([element, state])
          });
          console.log(res);
        });
    } else {
      console.log("please connect wallet")
    }

  }
  async getDeployState(project: ProjectPreviewModel): Promise<DeployState> {
    let mintState = this.isMint(project)
    let optInState = this.isOptInBurn(project)
    let removeState = await this.isRemoveMaxBuy(project)
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

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

  async isRemoveMaxBuy(model: ProjectPreviewModel): Promise<boolean> {
    let hasMaxBuy = await this.app.hasMaxBuy(model.asset.contractId)
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

  async removeMaxBuy(contractId: number) {
    let response = await this.app.removeMaxBuy(this.wallet!, contractId)
    if(response){
      console.log("removed max buy")
    } else {
      console.log("error")
    }
  }

  startFromMint(model: ProjectPreviewModel) {
    this.projectService.getProjectById(model.projectId).subscribe(
      async (value: ProjectViewModel) => {
        let projectModel = value
        console.log(projectModel)
        await this.deployLib.deployFromMintNoPresale(projectModel)
      }
    )
  }

  startFromOptInBurn(model: ProjectPreviewModel) {
    this.projectService.getProjectById(model.projectId).subscribe(
      async (value: ProjectViewModel) => {
        let projectModel = value
        console.log(projectModel)
        await this.deployLib.deployFromOptInNoPresale(projectModel)
      }
    )
    console.log("start from setup")
  }

  startFromSetup(model: ProjectPreviewModel) {
    this.projectService.getProjectById(model.projectId).subscribe(
      async (value: ProjectViewModel) => {
        let projectModel = value
        console.log(projectModel)
        await this.deployLib.deployFromSetupNoPresale(projectModel)
      }
    )
    console.log("start from setup")
  }

  openPopUp(model: ProjectPreviewModel) {
    this.projectForDistribution = model
    this.isPopUpOpen = true
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }
}
