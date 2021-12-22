import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-deploy',
  templateUrl: './my-deploy.component.html',
  styleUrls: ['./my-deploy.component.scss']
})
export class MyDeployComponent implements OnInit {
  arr: number[] = [1,2, 3]
  constructor() { }

  ngOnInit(): void {
  }

}
