import { Component, OnInit } from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import {of} from "rxjs";
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { DeployLb } from '../deploy/deploy-api-logic-file/deploy.lb';

@Component({
  selector: 'app-my-deploys',
  templateUrl: './my-deploys.component.html',
  styleUrls: ['./my-deploys.component.scss']
})

export class MyDeploysComponent implements OnInit {
  arr: ProjectPreviewModel[] = [];
  wallet: SessionWallet | undefined;

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
          res.forEach(element => {
            this.arr.push(element)
          });
          console.log(res);
        });
    } else {
      console.log("please connect wallet")
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
    console.log("start from mint")
  }

  startFromOptInBurn(model: ProjectPreviewModel) {
    console.log("start from optin")
  }

  startFromSetup(model: ProjectPreviewModel) {
    console.log("start from setup")
  }

  // TODO SABA:
  // Do the different HTML versions depending on the state of the back end object
  // Do the different calls starting at the levels coming from backend

}
