import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  rotate: boolean = false;

  firstDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];
  secondDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];

  constructor() { }

  ngOnInit(): void {
  }

  makeReverse() {
    this.rotate = !this.rotate

  }

  getValueFromDropDown($event: any, index: number) {
    // console.log($event);
    // if (index === 1 && $event) {
    //   this.secondDropValues.find( (item, i) =>  {
    //     item = $event;
    //     console.log(i);
    //     this.secondDropValues.splice(i+ 1, 1);
    //   })
    //   console.log(this.secondDropValues);
    // }
  }
}
