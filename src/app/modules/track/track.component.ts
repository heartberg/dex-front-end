import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})
export class TrackComponent implements OnInit {
  dropDownOpen = false;

  arr = [
    {
      number: 1,
      open: false
    },
    {
      number: 23,
      open: false
    },
    {
      number: 5,
      open: false
    },
    {
      number: 56,
      open: false
    },
    {
      number: 6,
      open: false
    }
  ];
  constructor() { }

  ngOnInit(): void { }

  dropDownToggle(i: number) {
    this.arr[i].open = !this.arr[i].open;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

}
