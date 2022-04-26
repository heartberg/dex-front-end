import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-token-detail',
  templateUrl: './token-detail.component.html',
  styleUrls: ['./token-detail.component.scss'],
})
export class TokenDetailComponent implements OnInit {
  isPopUpOpen: boolean = false;
  isBorrow: boolean = false;
  isBacking: boolean = false;

  currentProjectId: string = this.route.snapshot.paramMap.get('id')!;
  projectData!: ProjectViewModel;
  blockchainData!: BlockchainInformation;

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService,
    private deployedApp: DeployedApp
  ) {}

  ngOnInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService
      .getProjectById(this.currentProjectId)
      .subscribe(async (res) => {
        this.projectData = res;
        console.log(this.projectData)
        this.blockchainData = await this.deployedApp.getBlockchainInformation(this.projectData.asset.contractId);
      });
  }

  openPopUp(version: string) {
    this.isPopUpOpen = true;
    if (version === 'isBorrow') {
      this.isBorrow = true;
      this.isBacking = false;
    } else if (version === 'isBacking') {
      this.isBorrow = false;
      this.isBacking = true;
    }
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  pow(decimal: number){
    return Math.pow(10, decimal)
  }
}
