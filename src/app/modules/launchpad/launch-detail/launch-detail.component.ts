import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
// import { ActivatedRoute } from '@angular/router';
// import { ProjectViewModel } from 'src/app/models/projectView.model';
// import { projectReqService } from 'src/app/services/APIs/project-req.service';

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
  minLaunchPrice: number = 0;
  maxLaunchPrice: number = 0;

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService,
    private deployedApp: DeployedApp
  ) { }

  ngOnInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService.getProjectById(this.currentProjectId).subscribe(
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

  openPopUp() {
    this.closePopup = true;
  }

  pow(decimal: number){
    return Math.pow(10, decimal)
  }
}
