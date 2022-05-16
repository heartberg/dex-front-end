import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf'; 
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { SmartToolData } from 'src/app/shared/pop-up/component/pop-up.component';
import { TemplateBindingParseResult } from '@angular/compiler';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({
  selector: 'app-token-detail',
  templateUrl: './token-detail.component.html',
  styleUrls: ['./token-detail.component.scss'],
})
export class TokenDetailComponent implements OnInit {
  isPopUpOpen: boolean = false;
  isBorrow: boolean = false;
  isBacking: boolean = false;

  smartToolData: SmartToolData = {
    assetDecimals: 0,
    availableTokenAmount: 0,
    availableAlgoAmount: 0,
    contractId: 0,
    userBorrowed: 0,
    userSupplied: 0,
    totalBacking: 0,
    totalBorrowed: 0,
    totalSupply: 0,
  }

  currentProjectId: string = this.route.snapshot.paramMap.get('id')!;
  projectData!: ProjectViewModel;
  blockchainData!: BlockchainInformation;

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp,
    private walletConnect: WalletsConnectService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService
      .getProjectById(this.currentProjectId)
      .subscribe(async (res) => {
        this.projectData = res;
        console.log(this.projectData)
        if(this.projectData.asset.assetId == ps.platform.verse_asset_id) {
          this.blockchainData = await this.verseApp.getBlockchainInformation();
        } else {
          this.blockchainData = await this.deployedApp.getBlockchainInformation(this.projectData.asset.contractId);
        }
      });
      await this.getSmartToolData();
  }

  async openPopUp(version: string) {
    console.log(this.smartToolData)
    this.isPopUpOpen = true;
    if (version === 'isBorrow') {
      this.isBorrow = true;
      this.isBacking = false;
    } else if (version === 'isBacking') {
      this.isBorrow = false;
      this.isBacking = true;
    }
  }

  async getSmartToolData() {
    let wallet = this.walletConnect.sessionWallet;
    if(wallet){
      console.log("wallet")
      let address = localStorage.getItem("wallet")
      if(this.projectData.asset.contractId != ps.platform.verse_app_id){
        console.log("deployer app")
        this.smartToolData = await this.deployedApp.getSmartToolData(address!, this.projectData.asset.contractId, this.projectData.asset.decimals);
      } else {
        this.smartToolData = await this.verseApp.getSmartToolData(address!)
      }
      console.log(this.smartToolData)
    }
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  pow(decimal: number){
    return Math.pow(10, decimal)
  }

  getPrice() {
    let diff = 0
    let price = this.blockchainData.algoLiquidity / this.blockchainData.tokenLiquidity
    if(this.projectData.asset.decimals > 6) {
      diff = this.projectData.asset.decimals - 6
      price = price * Math.pow(10, diff)

    } else if(this.projectData.asset.decimals < 6) {
      diff = 6 - this.projectData.asset.decimals
      price = price / Math.pow(10, diff)
    }
    return price
  }
}
