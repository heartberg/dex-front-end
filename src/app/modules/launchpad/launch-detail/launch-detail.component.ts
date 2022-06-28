import {Component, DoCheck, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Algodv2, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';
import AlgodClient from 'algosdk/dist/types/src/client/v2/algod/algod';
import { time, timeStamp } from 'console';
import { getAlgodClient, isOptedIntoApp } from 'src/app/blockchain/algorand';
import { ClaimState, DeployedApp, StateKeys } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectViewModel } from 'src/app/models/projectViewModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { getAppLocalStateByKey } from 'src/app/services/utils.algo';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
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
  isOptedIn: boolean,
  userContribution: number
}

export type PresaleBlockchainInformation = {
  tokenLiq: number,
  algoLiq: number,
  initialPrice: number,
  presalePrice: number,
  totalSupply: number,
  presaleFundsToLiqPercentage: number,
  burned: number,
  tokensInPresale: number,
  saleStart: number,
  saleEnd: number,
  tradingStart: number,
  softCap: number,
  hardCap: number,
  walletCap: number,
  totalRaised: number,
  contractId: number,
  assetId: number,
  vestingRelease?: number,
  vestingIntervalLength?: number,
  vestingIntervalNumbers?: number
}

@Component({
  selector: 'app-launch-detail',
  templateUrl: './launch-detail.component.html',
  styleUrls: ['./launch-detail.component.scss']
})
export class LaunchDetailComponent implements OnInit, DoCheck {
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
    isOptedIn: false,
    userContribution: 0
  };

  minLaunchPrice: number = 0;
  maxLaunchPrice: number = 0;

  finished: boolean = false;
  isClaimable: boolean = false;
  alreadyClaimed: boolean = false;
  claimState: ClaimState = {
    isFinished: false,
    canClaim: false,
    canParticipate: true,
    hasStarted: false,
    optedIn: true
  };
  userAllocation: number = 0;

  //
  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;
  closePopupSecond: boolean = false;
  //


  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService,
    private deployedApp: DeployedApp,
    private walletService: WalletsConnectService
  ) { }

  ngDoCheck() {
    if(localStorage.getItem('sendWaitSuccess') === 'pending') {
      this.closePopupSecond = true;
      this.isPending = true;
      this.isFailed = false;
      this.finalStepApi = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'fail') {
      this.closePopupSecond = true;
      this.isFailed = true;
      this.finalStepApi = false;
      this.isPending = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'success') {
      this.closePopupSecond = true;
      this.finalStepApi = true;
      this.isFailed = false;
      this.isPending = false;
    }

  }

  ngOnInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService.getProjectWithpresaleById(this.currentProjectId).subscribe(
      async (res) => {
        this.projectData = res;
        if(this.projectData.presale?.contractId){
          this.presaleData = await this.deployedApp.getPresaleInfo(this.projectData.presale.contractId)
        } else {
          this.presaleData = await this.deployedApp.getPresaleInfo(this.projectData.asset.smartProperties!.contractId)
          this.calcLaunchPrices()
        }
        this.checkClaimable()
        await this.getUserAllocation()
        console.log(this.projectData)
        console.log(this.presaleData)
      }
    )
  }
  async getUserAllocation() {
    let client: Algodv2 = getAlgodClient()
    let wallet = localStorage.getItem("wallet")
    if(wallet){
      if(this.projectData.presale?.contractId){
        this.userAllocation = await getAppLocalStateByKey(client, this.projectData.presale.contractId, wallet, StateKeys.presale_contribution_key) | 0
      } else {
        this.userAllocation = await getAppLocalStateByKey(client, this.projectData.asset.smartProperties!.contractId, wallet, StateKeys.presale_contribution_key) | 0
      }
    }
    console.log(this.userAllocation)
  }

  async checkClaimable() {
    let wallet = localStorage.getItem("wallet")
    if(wallet){
      let contractId = 0
      if(this.projectData.asset.smartProperties) {
        contractId = this.projectData.asset.smartProperties.contractId
      } else {
        contractId = this.projectData.presale?.contractId!
      }
      this.claimState = await this.deployedApp.isClaimablePresale(wallet, contractId)
      console.log(this.claimState)
    }
  }

  calcLaunchPrices() {
    this.minLaunchPrice = (this.presaleData.algoLiq + this.presaleData.presaleFundsToLiqPercentage * this.presaleData.softCap / 100) / this.presaleData.tokenLiq
    this.maxLaunchPrice = (this.presaleData.algoLiq + this.presaleData.presaleFundsToLiqPercentage * this.presaleData.hardCap / 100) / this.presaleData.tokenLiq
  }

  async closePopUp(event: boolean) {
    if(this.projectData.asset.smartProperties){
      this.presaleData = await this.deployedApp.getPresaleInfo(this.projectData.asset.smartProperties!.contractId)
    } else {
      this.presaleData = await this.deployedApp.getPresaleInfo(this.projectData.presale?.contractId!)
    }

    this.closePopup = event;
  }

  async openPopUp() {
    await this.setEntryData()
    console.log(this.presaleEntryData)
    this.closePopup = true;
  }

  async setEntryData() {
    let wallet = localStorage.getItem("wallet")
    let contractId = 0
    if(this.projectData.asset.smartProperties) {
      contractId = this.projectData.asset.smartProperties.contractId
    } else {
      contractId = this.projectData.presale?.contractId!
    }
    this.presaleEntryData = await this.deployedApp.getPresaleEntryData(contractId)
    this.presaleEntryData.presalePrice = this.presaleData.presalePrice
    this.presaleEntryData.presaleId = this.projectData.presale!.presaleId

    if(wallet){
      let client: AlgodClient = getAlgodClient()
      let accInfo = await client.accountInformation(wallet).do()
      this.presaleEntryData.availableAmount = accInfo['amount'] / Math.pow(10, 6)
      this.presaleEntryData.userContribution = await getAppLocalStateByKey(client, contractId, wallet, StateKeys.presale_contribution_key)
      if(await isOptedIntoApp(wallet, contractId)){
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

  async claim() {
    let wallet = this.walletService.sessionWallet
    if(wallet){
      let contractId = 0
      if(this.projectData.asset.smartProperties) {
        contractId = this.projectData.asset.smartProperties.contractId
      } else {
        contractId = this.projectData.presale?.contractId!
      }
      let response = await this.deployedApp.claimPresale(wallet, contractId)
      if(response) {
        console.log("claimed data")
        this.checkClaimable()
      }
    }
  }

  formatDate(timestamp: number): string {
    let date = new Date(timestamp * 1000)
    //console.log(date)
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

  formatTime(timestamp: number) {
    let days = Math.floor(timestamp / 60 / 60 / 24)
    if(days > 0) {
      return days + " Days"
    } else {
      let hours = Math.floor(timestamp / 60 / 60)
      if(hours > 0) {
        return hours + " Hours"
      } else {
        let minutes = Math.floor(timestamp / 60)
        if(minutes > 0) {
          return minutes + " Minutes"
        } else {
          return timestamp + " Seconds"
        }
      }
    }
  }

  nextVesting() {
    let vestingRelease = this.presaleData.vestingRelease!
    let vestingIntervalLength = this.presaleData.vestingIntervalLength!
    let vestingIntervalNumbers = this.presaleData.vestingIntervalNumbers!

    let now = Math.floor(new Date().getTime() / 1000)
    let nextRelease = vestingRelease
    let date

    for(let i = 0; i < vestingIntervalNumbers; i++) {
      nextRelease = nextRelease + i * vestingIntervalLength
      if(now < nextRelease) {
        date = nextRelease
        break
      }
    }
    if(date) {
      return this.formatDate(date)
    } else {
      return "Vesting Finished"
    }

  }

}
