import { Component, Input, OnInit } from '@angular/core';
import { time } from 'console';
import { ClaimState } from 'src/app/blockchain/deployer_application';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { PresaleBlockchainInformation } from 'src/app/modules/launchpad/launch-detail/launch-detail.component';
import { TimeTupel } from 'src/app/modules/launchpad/launchpad.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {

  @Input() data!: [ProjectPreviewModel, PresaleBlockchainInformation, ClaimState?, number?];

  constructor() { }

  ngOnInit(): void {
  }

  formatDate(timestamp: number): string {
    let date = new Date(timestamp * 1000)
    let minutes = date.getMinutes().toString()
    if(date.getMinutes() < 10) {
      minutes = "0" + minutes
    }
    let hours = date.getHours().toString()
    if(date.getHours() < 10){
      hours = "0" + hours
    }
    return date.toDateString() + " - " + hours + ":" + minutes
  }

}
