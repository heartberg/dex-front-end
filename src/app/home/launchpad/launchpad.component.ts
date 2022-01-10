import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-launchpad',
  templateUrl: './launchpad.component.html',
  styleUrls: ['./launchpad.component.scss']
})
export class LaunchpadComponent implements OnInit {

  array = [1,32,53,64,58]

  constructor() { }

  ngOnInit(): void {
  }

}
