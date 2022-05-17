import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import AlgodClient from 'algosdk/dist/types/src/client/v2/algod/algod';
import { getAlgodClient, isOptedIntoApp } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
// import { ActivatedRoute } from '@angular/router';
// import { ProjectViewModel } from 'src/app/models/projectView.model';
// import { projectReqService } from 'src/app/services/APIs/project-req.service';

export type PresaleEntryData = {
  presalePrice: number,
  availableAmount: number,
  hardCap: number,
  walletCap: number,
  filledAmount: number,
  contractId: number,
  assetId: number,
  presaleId: string,
  isOptedIn: boolean
}

export type PresaleBlockchainInformation = {
  tokenLiq: number,
  algoLiq: number,
  price: number,
  totalSupply: number,
  presaleFundsToLiqPercentage: number,
  burned: number,
  tokensInPresale: number,
  saleStart: Date,
  saleEnd: Date,
  tradingStart: Date,
  softCap: number,
  hardCap: number,
  walletCap: number,
  totalRaised: number
}

@Component({
  selector: 'app-launch-detail',
  templateUrl: './launch-detail.component.html',
  styleUrls: ['./launch-detail.component.scss']
})
export class LaunchDetailComponent implements OnInit {
  closePopup: boolean = false;
  currentProjectId: string = this.route.snapshot.paramMap.get('id')!;
  projectData!: ProjectViewModel;
  presaleData!: PresaleBlockchainInformation;
  presaleEntryData: PresaleEntryData = {
    availableAmount: 0,
    filledAmount: 0,
    hardCap: 0,
    presalePrice: 0,
    walletCap: 0,
    assetId: 0,
    contractId: 0,
    presaleId: "",
    isOptedIn: false
  };
  minLaunchPrice: number = 0;
  maxLaunchPrice: number = 0;

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService,
    private deployedApp: DeployedApp
  ) { }

  ngOnInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService.getProjectWithpresaleById(this.currentProjectId).subscribe(
      async (res) => {
        this.projectData = res;
        this.presaleData = await this.deployedApp.getPresaleInfo(this.projectData.asset.contractId)
        this.calcLaunchPrices()
        console.log(this.projectData)
        console.log(this.presaleData)
      }
    )
  }
  calcLaunchPrices() {
    this.minLaunchPrice = (this.presaleData.algoLiq + this.presaleData.presaleFundsToLiqPercentage * this.presaleData.softCap / 100) / this.presaleData.tokenLiq
    this.maxLaunchPrice = (this.presaleData.algoLiq + this.presaleData.presaleFundsToLiqPercentage * this.presaleData.hardCap / 100) / this.presaleData.tokenLiq
  }

  closePopUp(event: boolean) {
    this.closePopup = event;
  }

  async openPopUp() {
    await this.setEntryData()
    console.log(this.presaleEntryData)
    this.closePopup = true;
  }

  async setEntryData() {
    let wallet = localStorage.getItem("wallet")
    this.presaleEntryData = await this.deployedApp.getPresaleEntryData(this.projectData.asset.contractId)
    this.presaleEntryData.presalePrice = this.presaleData.price
    this.presaleEntryData.presaleId = this.projectData.presale!.presaleId
    if(wallet){
      let client: AlgodClient = getAlgodClient()
      let accInfo = await client.accountInformation(wallet).do()
      this.presaleEntryData.availableAmount = accInfo['amount'] / Math.pow(10, 6)
      if(await isOptedIntoApp(wallet, this.projectData.asset!.contractId)){
        console.log("is opted in")
        this.presaleEntryData.isOptedIn = true
      } else {
        console.log("not opted in")
        this.presaleEntryData.isOptedIn = false
      }
    } else {
      console.log("no wallet")
      this.presaleEntryData.availableAmount = 0
      this.presaleEntryData.isOptedIn = false
    }
  }

  pow(decimal: number){
    return Math.pow(10, decimal)
  }
}
