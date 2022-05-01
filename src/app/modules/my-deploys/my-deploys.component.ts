import { Component, OnInit } from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

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
    private projectService: projectReqService
  ) { }

  ngOnInit(): void {
    this.wallet = this.walletService.sessionWallet;
    const addr = this.wallet?.getDefaultAccount()
    this.projectService.getCreatedProjects(addr, 1).subscribe(
      (res: ProjectPreviewModel[]) => {
        res.forEach(element => {
          this.arr.push(element)
        });
        console.log(res);
      });
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

  isRemoveMaxBuy(model: ProjectPreviewModel): boolean {
    return model.setup && model.burnOptIn && model.minted
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

  removeMaxBuy(contractId: number) {
    //TODO: DO IT IN BACKEND
    this.app.removeMaxBuy(this.wallet!, contractId)
  }

  // TODO SABA:
  // Do the different HTML versions depending on the state of the back end object
  // Do the different calls starting at the levels coming from backend

}
