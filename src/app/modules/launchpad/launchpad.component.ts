import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { getAppLocalStateByKey } from 'src/app/services/utils.algo';
import {StateKeys} from "../../blockchain/deployer_application";

export type TimeTupel = {
  startTime: Date,
  endTime: Date
}

@Component({
  selector: 'app-launchpad',
  templateUrl: './launchpad.component.html',
  styleUrls: ['./launchpad.component.scss'],
})

export class LaunchpadComponent implements OnInit {
  array: [ProjectPreviewModel, TimeTupel][] = [];

  wallet = localStorage.getItem('wallet');

  searchInput = this.fb.control([]);

  dropDownValues = [
    'Ending Soon',
    'Finished',
    'Subscription: High to low',
    'Subscription: Low to high',
  ];

  @Input() isWallet: boolean = false;

  constructor(
    private projectReqService: projectReqService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    console.log(this.isWallet);
    if (this.isWallet) {
      console.log('wallet');
      this.projectReqService
        .getParticipatedPresales(this.wallet, 1)
        .subscribe((res) => {
          res.forEach((el: ProjectPreviewModel) => {
            let tupel: TimeTupel = {
              startTime: new Date(el.presale.startingTime * 1000),
              endTime: new Date(el.presale.endingTime * 1000)
            }
            this.array.push([el, tupel]);
          });
        });
    } else if (!this.isWallet) {
      console.log('not wallet');
      this.projectReqService
        .getAllPresales(OrderingEnum.ending, 1)
        .subscribe((res) => {
          console.log(res);
          res.forEach((el: ProjectPreviewModel) => {
            let tupel: TimeTupel = {
              startTime: new Date(el.presale.startingTime * 1000),
              endTime: new Date(el.presale.endingTime * 1000)
            }
            this.array.push([el, tupel]);
          });
        });
      // All
    }
  }

  async getParticipatedAmount(model: ProjectPreviewModel): Promise<number> {
    let client: Algodv2 = getAlgodClient()
    let amount = await getAppLocalStateByKey(client, model.asset.contractId, this.wallet!, StateKeys.presale_contribution_key)
    return amount
  }
  
}
