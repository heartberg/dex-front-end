import { Component, OnInit } from '@angular/core';
import { SessionWallet } from 'algorand-session-wallet';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

export type StakingInfo = {
  usersStake: number,
  userAddedWeek: number,
  usersHolding: number,
  verseRewards: number,
  nextClaimableDate: Date | undefined
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
    nextClaimableDate: undefined
  };
  constructor(
    private verse: VerseApp,
    private walletService: WalletsConnectService
  ) { }


  async getUserInfo(){
    this.userInfo = await this.verse.getStakingInfo(this.sessionWallet!.getDefaultAccount());
    console.log(this.userInfo)
  }

  ngOnInit() {
    this.sessionWallet = this.walletService.sessionWallet;
    const wallet = localStorage.getItem("wallet");
    if(wallet){
      this.getUserInfo();
    }
  }

  closePopUp(event: boolean) {
    this.closePopup = event;
  }
  openPopUp(value: string): void {
    this.closePopup = true;
    if (value === 'stake') {
      this.isStake = true;
    } else {
      this.isStake = false;
    }
  }

  formatDate(date: Date | undefined): string {
    if (date){
      return date.toDateString() + "-" + date.getHours() + ":" + date.getMinutes()
    } else {
      return "-"
    }
  }

  async claim(): Promise<void> {
    let response = await this.verse.claim(this.sessionWallet!)
    console.log(response)
  }
}
