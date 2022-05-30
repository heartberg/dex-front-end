import { Component, Input, OnInit } from '@angular/core';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { TimeTupel } from 'src/app/modules/launchpad/launchpad.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {

  @Input() data!: [ProjectPreviewModel, TimeTupel];

  constructor() { }

  ngOnInit(): void {
  }

  formatDate(date: Date): string {
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
