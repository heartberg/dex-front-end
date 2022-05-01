import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
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
  isSoldOut: boolean = false;

  constructor(
    private projectReqService: projectReqService,
    private assetReqService: AssetReqService
  ) {}

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

  removeMaxBuy(assetId: number) {
    this.assetReqService.removeMaxBuy(assetId).subscribe((res) => {
      console.log(res);
    });
  }

  makeRequest(form: FormGroup) {
    if (Object.keys(form.controls).length === 2) {
      console.log('fairLaunch', form);
    }

    if (Object.keys(form.controls).length === 8) {
      console.log('restartPresale', form);
    }
  }

  ngOnInit(): void {
    const wallet = localStorage.getItem('wallet');
    this.projectReqService.getCreatedPresales(wallet, 1).subscribe((res) => {
      console.log(res);
      this.arr = res;
    });
  }
}
