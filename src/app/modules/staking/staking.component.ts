import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-stacking',
  templateUrl: './staking.component.html',
  styleUrls: ['./staking.component.scss']
})
export class StakingComponent implements OnInit {
  closePopup: boolean | undefined;
  isStake: boolean = true;
  constructor() { }

  ngOnInit(): void {
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
}
