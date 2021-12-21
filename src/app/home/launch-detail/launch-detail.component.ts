import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-launch-detail',
  templateUrl: './launch-detail.component.html',
  styleUrls: ['./launch-detail.component.scss']
})
export class LaunchDetailComponent implements OnInit {
  closePopup: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  closePopUp(event: boolean) {
    this.closePopup = event;
  }

  openPopUp() {
    this.closePopup = true;
  }
}
