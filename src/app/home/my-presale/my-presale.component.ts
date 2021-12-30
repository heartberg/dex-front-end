import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-presale',
  templateUrl: './my-presale.component.html',
  styleUrls: ['./my-presale.component.scss']
})
export class MyPresaleComponent implements OnInit {
  arr: number[] = [1,2, 3];

  constructor() { }

  ngOnInit(): void {
  }

}
