import {Component, DoCheck, Input, OnInit} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SessionWallet } from 'algorand-session-wallet';
import { Algodv2 } from 'algosdk';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { getAppLocalStateByKey } from 'src/app/services/utils.algo';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import {ClaimState, DeployedApp, StateKeys} from "../../blockchain/deployer_application";
import { PresaleBlockchainInformation } from './launch-detail/launch-detail.component';

export type TimeTupel = {
  startTime: Date,
  endTime: Date
}

@Component({
  selector: 'app-launchpad',
  templateUrl: './launchpad.component.html',
  styleUrls: ['./launchpad.component.scss'],
})

export class LaunchpadComponent implements OnInit, DoCheck {
  array: [ProjectPreviewModel, PresaleBlockchainInformation, ClaimState?, number?][] = [];
  isPresaleEnded: boolean = false;
  wallet = localStorage.getItem('wallet');
  sessionWallet: SessionWallet | undefined;
  searchInput = this.fb.control([]);

  //
  finalStepApi: boolean = false;
  isFaild: boolean = false;
  isPending: boolean = false;
  closePopup: boolean = false;
  //

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
    private app: DeployedApp,
    private walletService: WalletsConnectService
  ) {}

  ngDoCheck() {
    if(localStorage.getItem('sendWaitSuccess') === 'pending') {
      this.closePopup = true;
      this.isPending = true;
      this.isFaild = false;
      this.finalStepApi = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'fail') {
      this.closePopup = true;
      this.isFaild = true;
      this.finalStepApi = false;
      this.isPending = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'success') {
      this.closePopup = true;
      this.finalStepApi = true;
      this.isFaild = false;
      this.isPending = false;
    }
  }

  ngOnInit(): void {
    console.log(this.isWallet);
    if (this.isWallet) {
      this.sessionWallet = this.walletService.sessionWallet
      let client: Algodv2 = getAlgodClient()
      console.log('wallet');
      this.projectReqService
        .getParticipatedPresales(this.wallet, 1)
        .subscribe((res) => {
          res.forEach(async (presaleModel: ProjectPreviewModel) => {
            let contractId = 0
            if(presaleModel.asset.smartProperties) {
              contractId = presaleModel.asset.smartProperties.contractId
            } else {
              contractId = presaleModel.presale.contractId!
            }
            let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(contractId)
              let claimState: ClaimState = await this.app.isClaimablePresale(this.wallet!, contractId)
              let contribution = await getAppLocalStateByKey(client, contractId, this.wallet!, StateKeys.presale_contribution_key) / Math.pow(10, 6)
              this.array.push([presaleModel, blockchainInfo, claimState, contribution])
          });
          console.log(res)
        });
    } else if (!this.isWallet) {
      console.log('not wallet');
      this.projectReqService
        .getAllPresales(OrderingEnum.ending, 1)
        .subscribe((res) => {
          res.forEach(async (presaleModel: ProjectPreviewModel) => {
            if(presaleModel.asset.smartProperties) {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.smartProperties!.contractId)
              this.array.push([presaleModel, blockchainInfo])
            } else {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
              this.array.push([presaleModel, blockchainInfo])
            }
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
        res.forEach(async (presaleModel: ProjectPreviewModel) => {
          if(presaleModel.asset.smartProperties) {
            let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.smartProperties!.contractId)
            this.array.push([presaleModel, blockchainInfo])
          } else {
            let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
            this.array.push([presaleModel, blockchainInfo])
          }
        });
      });
    // All
    }


  formatDate(timestamp: number): string {
    let date = new Date(timestamp * 1000)
    let minutes = date.getMinutes().toString()
    if(date.getMinutes() < 10) {
      minutes = "0" + minutes
    }
    let hours = date.getHours().toString()
    if(date.getHours() < 10){
      hours = "0" + hours
    }
    return date.toDateString() + " - " + hours + ":" + minutes
  }

  isFailed(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleEnd < currentTimeStamp && blockchainInfo.totalRaised < blockchainInfo.softCap) {
      return true;
    } else {
      return false;
    }
  }

  isSuccessFull(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleEnd < currentTimeStamp && blockchainInfo.totalRaised > blockchainInfo.softCap) {
      return true;
    } else {
      return false;
    }
  }

  isOngoing(blockchainInfo: PresaleBlockchainInformation): boolean {
    let currentTimeStamp = Math.floor(Date.now() / 1000);
    if(blockchainInfo.saleEnd > currentTimeStamp) {
      return true;
    } else {
      return false;
    }
  }

  async claimAlgo(item: [ProjectPreviewModel, PresaleBlockchainInformation, ClaimState?, number?]) {
    this.sessionWallet = this.walletService.sessionWallet
    let response = await this.app.claimPresale(this.sessionWallet!, item[1].contractId)
    if(response) {
      console.log("CLAIMED ALGO")
      item[2]!.canClaim = false
    }
  }

  async claimToken(item: [ProjectPreviewModel, PresaleBlockchainInformation, ClaimState?, number?]) {
    this.sessionWallet = this.walletService.sessionWallet
    let response = await this.app.claimPresale(this.sessionWallet!, item[1].contractId)
    if(response) {
      console.log("CLAIMED TOKEN")
      item[2]!.canClaim = false
    }
  }

  search($event: any) {
    if (this.searchInput.value) {
      this.projectReqService
        .getAllPresales(OrderingEnum.ending, 1, this.searchInput.value)
        .subscribe((res) => {
          this.array = []
          res.forEach(async (presaleModel: ProjectPreviewModel) => {
            if(presaleModel.asset.smartProperties) {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.smartProperties!.contractId)
              this.array.push([presaleModel, blockchainInfo])
            } else {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
              this.array.push([presaleModel, blockchainInfo])
            }
          });
        });
    } else {
      this.projectReqService
        .getAllPresales(OrderingEnum.ending, 1, '')
        .subscribe((res) => {
          this.array = []
          res.forEach(async (presaleModel: ProjectPreviewModel) => {
            if(presaleModel.asset.smartProperties) {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.asset.smartProperties!.contractId)
              this.array.push([presaleModel, blockchainInfo])
            } else {
              let blockchainInfo: PresaleBlockchainInformation = await this.app.getPresaleInfo(presaleModel.presale.contractId!)
              this.array.push([presaleModel, blockchainInfo])
            }
          });
        });
    }
    let arr = [...this.array];
    this.array = [];
    this.array = [...new Set(arr)];
  }

  closePopUp($event: boolean) {
    this.closePopup = $event;
  }
}
