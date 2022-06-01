import { Component, OnInit, ViewChild } from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
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
  totalPoolSize: number
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

  pools: [StakingModel, StakingUserInfo][] = []
  isDistributionSelected = true
  isStakingSelected = false
  isFinishedChecked = false

  userInfo: StakingUserInfo = {
    usersStake: 0,
    userAddedWeek: 0,
    usersHolding: 0,
    rewards: 0,
    nextClaimableDate: -1,
    optedIn: false,
    totalPoolSize: 0
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
    private stakingUtils: StakingUtils
  ) { }

  async getUserInfo(){
    const wallet = localStorage.getItem("wallet");
    if(wallet){
      this.userInfo = await this.stakingUtils.getVerseStakingUserInfo(this.sessionWallet!.getDefaultAccount());
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
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
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

  async openPopUp(value: string): Promise<void> {
    this.sessionWallet = this.walletService.sessionWallet
    if(this.sessionWallet){
      await this.getUserInfo()
    }
    this.closePopup = true;
      if (value === 'stake') {
        this.isStake = true;
      } else {
        this.isStake = false;
      }
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

  ShowStaking() {
    this.isStakingSelected = true
    this.isDistributionSelected = false
    let addr = this.sessionWallet?.getDefaultAccount()
    this.pools = []
    this.projectReqService.GetStakingPools(this.isFinishedChecked, this.isDistributionSelected).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
          }
        });
      }
    )
    
  }

  ShowDistribution(){
    this.isStakingSelected = false
    this.isDistributionSelected = true
    let addr = this.sessionWallet?.getDefaultAccount()
    this.pools = []
    this.projectReqService.GetStakingPools(this.isFinishedChecked, this.isDistributionSelected).subscribe(
      (res: any) => {
        res.forEach(async (element: StakingModel) => {
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
          }
        });
      }
    )
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
          if(element.project) {
            let extraStakingInfo = await this.stakingUtils.getUserSmartStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
          } else {
            let extraStakingInfo = await this.stakingUtils.getUserStandardStakingInfo(element.contractId, element.assetId, false, addr)
            this.pools.push([element, extraStakingInfo])
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

}
