import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})
export class TrackComponent implements OnInit {
  arr = [1,23,5,56,6]
  constructor() { }

  ngOnInit(): void {
  }

}
