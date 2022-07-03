import { tokenize } from '@angular/compiler/src/ml_parser/lexer';
import {Component, DoCheck, OnInit, ViewChild} from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
import { time } from 'console';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { getAlgodClient } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { StakingUtils } from 'src/app/blockchain/staking';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { StakingModel } from 'src/app/models/stakingModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

export type StakingInfo = {
  totalAddedWeek: number,
  totalStaked: number,
  weeklyRewards: number
}

export type StakingUserInfo = {
  usersStake: number,
  userAddedWeek: number,
  usersHolding: number,
  rewards: number,
  nextClaimableDate: number,
  poolEnd: number,
  optedIn: boolean,
  totalPoolSize: number,
  contractId: number,
  assetId: number,
  isSmartPool: boolean
}


@Component({
  selector: 'app-stacking',
  templateUrl: './staking.component.html',
  styleUrls: ['./staking.component.scss']
})

export class StakingComponent implements OnInit, DoCheck {
  closePopup: boolean | undefined;
  isStake: boolean = true;
  sessionWallet: SessionWallet | undefined;

  pools: [StakingModel, StakingUserInfo, any][] = []
  isDistributionSelected = false
  isStakingSelected = true
  isFinishedChecked = false
  stakingInput: StakingUserInfo | undefined


  userInfo: StakingUserInfo = {
    usersStake: 0,
    userAddedWeek: 0,
    usersHolding: 0,
    rewards: 0,
    nextClaimableDate: -1,
    optedIn: false,
    totalPoolSize: 0,
    contractId: 0,
    assetId: ps.platform.verse_asset_id,
    poolEnd: 0,
    isSmartPool: false
  };

  stakingInfo: StakingInfo = {
    totalAddedWeek: 0,
    totalStaked: 0,
    weeklyRewards: 0
  }

  //
  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;
  closePopupSecond: boolean = false;
  //

  @ViewChild('checkboxFinished', {static: false})
  // @ts-ignore
  private checkFinished: ElementRef;

  nextClaimableDate = "-"
  constructor(
    private verse: VerseApp,
    private walletService: WalletsConnectService,
    private projectReqService: projectReqService,
    private stakingUtils: StakingUtils,
    private deployerApp: DeployedApp
  ) { }

  async getUserInfo(){
    const wallet = localStorage.getItem("wallet");
    if(wallet){
      this.userInfo = await this.stakingUtils.getVerseStakingUserInfo(wallet);
      console.log(this.userInfo)
      console.log(new Date(this.userInfo.nextClaimableDate))
      console.log(new Date())
      this.nextClaimableDate = this.formatDate(this.userInfo.nextClaimableDate)
    }
  }

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
    if (this.closePopupSecond) {
      this.closePopup = false;
    }
  }

  ngOnInit() {
    this.pools = []
    this.sessionWallet = this.walletService.sessionWallet;
    let addr = this.sessionWallet?.getDefaultAccount()
    this.projectReqService.GetStakingPools(false, false).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          let tokenInfo = await this.getTokenInformation(element.assetId)
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            extraStakingInfo.poolEnd = element.endingTime
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            extraStakingInfo.poolEnd = element.endingTime
            this.pools.push([element, extraStakingInfo, tokenInfo])
            console.log(this.pools)
          }
        });
      }
    )
    this.getStakingInfo();
    this.getUserInfo();
  }

  async getStakingInfo() {
    this.stakingInfo = await this.stakingUtils.getVerseStakingInfo();
  }

  async closePopUp(event: boolean) {
    console.log(event)
    this.closePopup = event;
    this.closePopupSecond = event
    this.getUserInfo()
    this.getStakingInfo()
    if(this.isDistributionSelected) {
      await this.ShowDistribution()
    } else {
      await this.ShowStaking()
    }
  }

  async openPopUp(value: string, pool?: StakingModel): Promise<void> {
    this.sessionWallet = this.walletService.sessionWallet
    let addr: string | undefined
    if(this.sessionWallet) {
      addr = this.sessionWallet.getDefaultAccount()
    }
    let userInfo: StakingUserInfo | undefined;

    if(pool) {
      if(pool.project?.asset.smartProperties){
        userInfo = await this.stakingUtils.getUserSmartStakingInfo(pool.contractId, pool.assetId, pool.isDistribution, addr)
        userInfo.poolEnd = pool.endingTime
      } else {
        userInfo = await this.stakingUtils.getUserStandardStakingInfo(pool.contractId, pool.assetId, pool.isDistribution, addr)
        userInfo.poolEnd = pool.endingTime
      }
    } else {
      await this.getUserInfo()
    }

    if (value === 'stake') {
      this.isStake = true;
      this.stakingInput = this.userInfo
    } else if (value === 'withdraw'){
      this.isStake = false;
      this.stakingInput = this.userInfo
    } else if(value === 'stake_distribution') {
      this.isStake = true;
      this.stakingInput = userInfo
    } else {
      this.isStake = false;
      this.stakingInput = userInfo
    }
    this.closePopup = true;
  }

  formatDate(date: number): string {
    if (date > 0){
      let now = Math.floor(new Date().getTime() / 1000)
      if(now > date) {
        return "claimable"
      } else {
        let nextClaimableTime = date - now
        let hours = Math.floor(nextClaimableTime / 60 / 60)
        let minutes = Math.floor(nextClaimableTime / 60 % 60)
        if(hours > 0){
            return hours + "h " + minutes + "min"
        } else {
          return minutes + " min"
        }
      }
    } else if(date == 0){
      return "activate stake"
    }
    return "-"
  }

  async claim(): Promise<void> {
    let wallet = this.walletService.sessionWallet
    if(wallet){
      let response = await this.verse.claim(this.sessionWallet!)
      if(response) {
        console.log("claimed")
      }
      this.getStakingInfo()
      this.getUserInfo()
    } else {
      console.log("please connect wallet")
    }
  }

  async ShowStaking() {
    this.isStakingSelected = true
    this.isDistributionSelected = false
    let addr = this.sessionWallet?.getDefaultAccount()
    this.pools = []
    this.projectReqService.GetStakingPools(this.isFinishedChecked, this.isDistributionSelected).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          let tokenInfo = await this.getTokenInformation(element.assetId)
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            extraStakingInfo.poolEnd = element.endingTime
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            extraStakingInfo.poolEnd = element.endingTime
            this.pools.push([element, extraStakingInfo, tokenInfo])
          }
          console.log(this.pools)
        });
      }
    )
    console.log(this.pools)
  }

  async ShowDistribution(){
    this.isStakingSelected = false
    this.isDistributionSelected = true
    this.sessionWallet = this.walletService.sessionWallet
    let addr = this.sessionWallet?.getDefaultAccount()
    this.pools = []
    this.projectReqService.GetStakingPools(this.isFinishedChecked, this.isDistributionSelected).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          let tokenInfo = await this.getTokenInformation(element.assetId)
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, true, addr)
            extraStakingInfo.poolEnd = element.endingTime
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, true, addr)
            extraStakingInfo.poolEnd = element.endingTime
            this.pools.push([element, extraStakingInfo, tokenInfo])
          }
          console.log(this.pools)
        });
      }
    )
    console.log(this.pools)
  }

  ShowFinished() {
    this.sessionWallet = this.walletService.sessionWallet
    let addr = this.sessionWallet?.getDefaultAccount()

    if(this.checkFinished.nativeElement.checked) {
      this.isFinishedChecked = true;
    } else {
      this.isFinishedChecked = false;
    }

    this.pools = []
    this.projectReqService.GetStakingPools(this.isFinishedChecked, this.isDistributionSelected).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          let tokenInfo = await this.getTokenInformation(element.assetId)
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, this.isDistributionSelected, addr)
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, this.isDistributionSelected, addr)
            this.pools.push([element, extraStakingInfo, tokenInfo])
          }
        });
      }
    )
  }

  async GetPoolInformation(stakingPool: StakingModel) {
    let wallet = this.walletService.sessionWallet

    let addr = wallet?.getDefaultAccount()
    let userStakingInfo: StakingUserInfo = await this.stakingUtils.getUserSmartStakingInfo(stakingPool.contractId, stakingPool.assetId, stakingPool.isDistribution, addr)
    console.log(userStakingInfo)
    return userStakingInfo
  }

  async getTokenInformation(assetId: number) {
    let client = getAlgodClient()
    let tokenInfo = await client.getAssetByID(assetId).do()
    return tokenInfo
  }

  getDuration(pool: StakingModel): string {
    let start = pool.startingTime
    let end = pool.endingTime
    let now = Math.floor(new Date().getTime() / 1000)
    let duration = end - start
    if(start < now) {
      duration = end - now
    }

    let hours = Math.floor(duration / 60 / 60)
    if(duration <= 0) {
      return "ended"
    }
    if(hours > 0){
      if(Math.floor(hours / 24) > 0){
        let suffix = " day"
        let days = Math.floor(hours / 24)
        if(days > 1) suffix += "s"
        return days + suffix
      } else {
        if(hours < 10) {
          return "0" + hours + " h"
        } else {
          return hours + " h"
        }
      }
    }
    return "ending today"
  }

  async claimStaking(stakingPool: StakingModel) {
    let wallet = this.walletService.sessionWallet
    if(wallet) {
      let response = await this.deployerApp.claimStaking(wallet, stakingPool.contractId, stakingPool.assetId, stakingPool.project?.asset.smartProperties?.contractId)
      if(response) {
        console.log("claimed staking pool")
        this.ShowStaking()
      }
    }
  }

  async claimDistribution(distPool: StakingModel) {
    let wallet = this.walletService.sessionWallet
    if(wallet) {
      let response = await this.deployerApp.claimDistributionPool(wallet, distPool.contractId, distPool.project?.asset.smartProperties?.contractId)
      if(response) {
        console.log("claimed dis pool")
        this.ShowDistribution()
      }
    }
  }

  async optInStaking(stakingPool: StakingModel) {
    let wallet = this.walletService.sessionWallet
    if(wallet) {
      let response = await this.deployerApp.optInStakingPool(wallet, stakingPool.contractId)
      if(response) {
        console.log("opted in to staking pool")
        let pool = this.pools.find(p => {
          return p[0].contractId == stakingPool.contractId
        })
        pool![1].optedIn = true;
      }
    }
  }

  poolStarted(start: number) {
    let now = Math.floor(new Date().getTime() / 1000)
    if(now > start) {
      return true
    } else {
      return false
    }
  }

  poolClaimable(claimTime: number) {
    let now = Math.floor(new Date().getTime() / 1000)
    if(claimTime < now) {
      return true
    } else {
      return false
    }
  }

  getStart(start: number) {
    let now = Math.floor(new Date().getTime() / 1000)
    let duration = start - now
    let hours = Math.floor(duration / 60 / 60)
    if(hours > 0){
      if(Math.floor(hours / 24) > 0){
        let suffix = " day"
        let days = Math.floor(hours / 24)
        if(days > 1) suffix += "s"
        return days + suffix
      } else {
        if(hours < 10) {
          return "0" + hours + " h"
        } else {
          return hours + " h"
        }
      }
    } else {
      let minutes = Math.floor(duration / 60)
      return minutes + " min"
    }
  }

  async calculateApy(stakingPool: StakingModel) {
    // TODO
    return 0
  }

  isFinished(end: number) {
    let now = Math.floor(new Date().getTime() / 1000)
    if(now > end) {
      return true
    } else {
      return false
    }
  }

  async optOutStaking(stakingPool: StakingModel) {
    let wallet = this.walletService.sessionWallet
    if(wallet) {
      let response = await this.deployerApp.optOut(wallet, stakingPool.contractId)
      if(response) {
        console.log("opted in to staking pool")
        let pool = this.pools.find(p => {
          return p[0].contractId == stakingPool.contractId
        })
        pool![1].optedIn = true;
      }
    }
  }

}
