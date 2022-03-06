import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-launchpad',
  templateUrl: './launchpad.component.html',
  styleUrls: ['./launchpad.component.scss'],
})
export class LaunchpadComponent implements OnInit {
  dummyProject: ProjectPreviewModel = {
    projectId: 'string',
    projectImage: 'string',
    name: 'string',
    description:
      'string string sadasda string sdad dsad string string sadasda string sdad dsad string string sadasda string sdad dsad string string sadasda string sdad dsad string string sadasda string sdad dsad string string sadasda string sdad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad dsad string string sadasda string sdad dsad ',
    asset: {
      assetId: 4,
      smartContractId: 3,
      smartContractAddress: 'string',
      name: 'string',
      unitName: 'string',
      totalSupply: 4,
      url: 'string',
      maxBuy: 5,
      tradingStart: 1,
      risingPriceFloor: 7,
      backing: 4,
      buyBurn: 3,
      sellBurn: 3,
      sendBurn: 2,
      additionalFee: 2,
      additionalFeeWallet: 'string',
      image: 'string',
      deployerWallet: 'string',
    },
    presale: {
      presaleId: 'string',
      softCap: 4,
      hardCap: 2,
      walletCap: 2,
      totalRaised: 45,
      tokenAmount: 44,
      startingTime: 32,
      endingTime: 45,
      adminClaimed: false,
    },
  };
  array: ProjectPreviewModel[] = [this.dummyProject];

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
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    console.log(this.isWallet);
    if (this.isWallet) {
      console.log('wallet');
      this.projectReqService
        .getParticipatedPresales(this.wallet, 1)
        .subscribe((res) => {
          console.log(res);
        });
    } else if (!this.isWallet) {
      console.log('not wallet');
      this.projectReqService
        .getAllPresales(OrderingEnum.ending, 1)
        .subscribe((res) => {
          console.log(res);
          res.forEach((el: ProjectPreviewModel) => {
            this.array.push(el);
          });
        });
      // All
    }
  }
}
