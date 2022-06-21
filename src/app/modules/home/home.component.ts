import { Component, OnInit } from '@angular/core';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { TimeTupel } from '../launchpad/launchpad.component';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { PresaleBlockchainInformation } from '../launchpad/launch-detail/launch-detail.component';
import { DeployedApp } from 'src/app/blockchain/deployer_application';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  arr: [ProjectPreviewModel, PresaleBlockchainInformation][] = [];
  constructor(
    private projectReqService: projectReqService,
    private app: DeployedApp
  ) { }

  ngOnInit(): void {
    this.projectReqService
        .getAllPresales(OrderingEnum.upcomming, 1)
        .subscribe((res) => {
          console.log(res);
          this.arr = []
          res.forEach(async (presaleModel: ProjectPreviewModel) => {
            if(presaleModel.asset.smartProperties) {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.smartProperties!.contractId)
              this.arr.push([presaleModel, blockchainInfo])
            } else {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
              this.arr.push([presaleModel, blockchainInfo])
            }
          });
        });
  }

}
