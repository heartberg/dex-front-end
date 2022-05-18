import { InvokeFunctionExpr } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
import { nextTick } from 'process';
import { iif } from 'rxjs';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

export type StakingInfo = {
  usersStake: number,
  userAddedWeek: number,
  usersHolding: number,
  verseRewards: number,
  nextClaimableDate: number
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
  userInfo: StakingInfo = {
    usersStake: 0,
    userAddedWeek: 0,
    usersHolding: 0,
    verseRewards: 0,
    nextClaimableDate: -1
  };
  nextClaimableDate = "-"
  constructor(
    private verse: VerseApp,
    private walletService: WalletsConnectService
  ) { }


  async getUserInfo(){
    const wallet = localStorage.getItem("wallet");
    if(wallet){
      this.userInfo = await this.verse.getStakingInfo(this.sessionWallet!.getDefaultAccount());
      console.log(this.userInfo)
      this.nextClaimableDate = this.formatDate(this.userInfo.nextClaimableDate)
    }
  }

  ngOnInit() {
    this.sessionWallet = this.walletService.sessionWallet;
    this.getUserInfo();
    
  }

  closePopUp(event: boolean) {
    this.closePopup = event;
    this.getUserInfo()
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
    console.log(date);
    console.log(new Date(date * 1000));
    console.log(new Date())
    console.log(Math.floor(new Date().getTime() * 1000))

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
    } else {
      console.log("please connect wallet")
    }
  }
}
