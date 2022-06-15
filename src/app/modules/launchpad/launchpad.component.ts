import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
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
  isPresaleEnded: boolean = false;
  wallet = localStorage.getItem('wallet');
  searchInput = this.fb.control([]);

  @Input() entries: boolean = false;

  dropDownValues = [
    'Ending Soon',
    'Starting Soon',
    'Finished',
    'Subscription: High to Low',
    'Subscription: Low to High',
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
    let amount = await getAppLocalStateByKey(client, model.asset.smartProperties!.contractId, this.wallet!, StateKeys.presale_contribution_key)
    return amount
  }

  getValueFromDropDown(event: string){
    console.log(event)
    let ordering = OrderingEnum.ending
    if(event == "Finished") {
      ordering = OrderingEnum.finished
    } else if(event == "Subscription: High to Low") {
      ordering = OrderingEnum.sub_high
    } else if (event == "Subscription: Low to High") {
      ordering = OrderingEnum.sub_low
    } else if(event == "Starting Soon") {
      ordering = OrderingEnum.starting
    }
    this.projectReqService
      .getAllPresales(ordering, 1)
      .subscribe((res) => {
        this.array = []
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

  claimAlgo() {

  }

  claimToken() {

  }
}
