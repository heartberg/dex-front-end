import { tokenize } from '@angular/compiler/src/ml_parser/lexer';
import { Component, OnInit, ViewChild } from '@angular/core';
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

export class StakingComponent implements OnInit {
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
    isSmartPool: false
  };

  stakingInfo: StakingInfo = {
    totalAddedWeek: 0,
    totalStaked: 0,
    weeklyRewards: 0
  }

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
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
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

  closePopUp(event: boolean) {
    this.closePopup = event;
    this.getUserInfo()
    this.getStakingInfo()
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
      } else {
        userInfo = await this.stakingUtils.getUserStandardStakingInfo(pool.contractId, pool.assetId, pool.isDistribution, addr)
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
      let now = Math.floor(new Date().getTime() * 1000)
      if(now > date) {
        return "claimable"
      } else {
        let nextClaimableTime = new Date(date - now)
        if(nextClaimableTime.getHours() > 0){
            return nextClaimableTime.getHours() + "h " + nextClaimableTime.getMinutes() + "min"
        } else {
          return nextClaimableTime.getMinutes() + "min"
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
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
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
    let addr = this.sessionWallet?.getDefaultAccount()
    this.pools = []
    this.projectReqService.GetStakingPools(this.isFinishedChecked, this.isDistributionSelected).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          let tokenInfo = await this.getTokenInformation(element.assetId)
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo, tokenInfo])
          }
          console.log(this.pools)
        });
      }
    )
    console.log(this.pools)
  }

  ShowFinished() {
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
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo, tokenInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
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

  getDuration(timestamp: number): string {
    let now = Math.floor(new Date().getTime() / 1000)
    let duration = timestamp - now
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
        console.log("opted in to staking pool")
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

  async calculateApy(stakingPool: StakingModel) {
    // TODO
    return 0
  }

}
