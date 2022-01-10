import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit {


  arr = [1,23,5,56,6]

  public isActiveFirst: boolean = false;
  public isActiveSecond: boolean = false;
  constructor() { }

  ngOnInit(): void {
    this.isActiveFirst = true;
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
