import { Component, OnInit } from '@angular/core';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-my-presale',
  templateUrl: './my-presale.component.html',
  styleUrls: ['./my-presale.component.scss'],
})
export class MyPresaleComponent implements OnInit {
  // arr: string[] = ['ended', 'failed', 'failed', 'ended', 'user', 'failed', 'user'];
  arr: ProjectPreviewModel[] = [];

  isPopUpOpen: boolean = false;
  isRestart: boolean = false;
  isFair: boolean = false;

  isPresaleEnded: boolean = true;

  constructor(private projectReqService: projectReqService) {}

  openPopUp(version: string) {
    this.isPopUpOpen = true;
    if (version === 'restart') {
      this.isRestart = true;
      this.isFair = false;
    } else if (version === 'fair') {
      this.isRestart = false;
      this.isFair = true;
    }
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  ngOnInit(): void {
    const wallet = localStorage.getItem('wallet');
    this.projectReqService.getCreatedPresales(wallet, 1).subscribe((res) => {
      console.log(res);
      this.arr = res;
    });
  }
}
