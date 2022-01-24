import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  public isActiveFirst: boolean = false;
  public isActiveSecond: boolean = false;

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'entries') {
      this.activeSecond();
    } else if (this.route.snapshot.routeConfig?.path === 'wallet') {
      this.activeFirst();
    } else {
      this.isActiveFirst = true;
    }
  }

  activeFirst() {
    this.isActiveFirst = true;
    this.isActiveSecond = false;
  }

  activeSecond() {
    this.isActiveSecond = true;
    this.isActiveFirst = false;
  }
}
