import {Component, DoCheck, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectViewModel } from 'src/app/models/projectViewModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { SmartToolData } from 'src/app/shared/pop-up/component/pop-up.component';
import { TemplateBindingParseResult } from '@angular/compiler';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import { StakingUserInfo } from '../../staking/staking.component';
import { StakingUtils } from 'src/app/blockchain/staking';

@Component({
  selector: 'app-token-detail',
  templateUrl: './token-detail.component.html',
  styleUrls: ['./token-detail.component.scss'],
})
export class TokenDetailComponent implements OnInit, DoCheck {
  isPopUpOpen: boolean = false;
  isBorrow: boolean = false;
  isBacking: boolean = false;
  isVerseBorrow: boolean = false;
  isVerseBacking: boolean = false;

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
    optedIn: true,
    name: "",
    unitName: ""
  }

  currentProjectId: string = this.route.snapshot.paramMap.get('id')!;
  projectData!: ProjectViewModel;
  blockchainData: BlockchainInformation | undefined;

  //
  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;
  closePopup: boolean = false;
  //

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp,
    private stakingUtils: StakingUtils
  ) {}

  ngDoCheck() {
    if(localStorage.getItem('sendWaitSuccess') === 'pending') {
      this.closePopup = true;
      this.isPending = true;
      this.isFailed = false;
      this.finalStepApi = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'fail') {
      this.closePopup = true;
      this.isFailed = true;
      this.finalStepApi = false;
      this.isPending = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'success') {
      this.closePopup = true;
      this.finalStepApi = true;
      this.isFailed = false;
      this.isPending = false;
    }
  }

  async ngOnInit(): Promise<void> {
    console.log("project id: " + this.route.snapshot.paramMap.get('id'));
    this.projectsReqService
      .getProjectById(this.currentProjectId)
      .subscribe(async (res) => {
        this.projectData = res;
        console.log(this.projectData)
        if(this.projectData.asset.assetId == ps.platform.verse_asset_id) {
          this.blockchainData = await this.verseApp.getBlockchainInformation();
        } else if(this.projectData.asset.smartProperties){
          this.blockchainData = await this.deployedApp.getBlockchainInformation(this.projectData.asset.smartProperties!.contractId);
        } else {
          this.blockchainData = undefined
        }
      });
      await this.getSmartToolData();
  }

  async openPopUp() {
    await this.getSmartToolData()
    console.log(this.smartToolData)
    this.isPopUpOpen = true;
    if(this.smartToolData.contractId == ps.platform.verse_asset_id) {
      this.isVerseBorrow = true;
      this.isVerseBacking = false;
      this.isBorrow = false;
      this.isBacking = false;
    } else {
      this.isBorrow = true;
      this.isBacking = false;
      this.isVerseBorrow = false;
      this.isVerseBacking = false;
    }

  }

  async getSmartToolData() {
    let address = localStorage.getItem("wallet")
    if(this.projectData.asset.smartProperties!.contractId != ps.platform.verse_app_id){
      console.log("deployer app")
      this.smartToolData = await this.deployedApp.getSmartToolData(this.projectData.asset.smartProperties!.contractId, address);
    } else {
      this.smartToolData = await this.stakingUtils.getVerseSmartToolData(address)
    }
    console.log(this.smartToolData)

  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
    this.closePopup = event;
  }

  pow(decimal: number){
    return Math.pow(10, decimal)
  }

  getPrice() {
    let diff = 0
    let price = this.blockchainData!.algoLiquidity / this.blockchainData!.tokenLiquidity
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
