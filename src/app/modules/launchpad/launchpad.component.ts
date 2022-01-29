import { Component, Input, OnInit } from '@angular/core';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-launchpad',
  templateUrl: './launchpad.component.html',
  styleUrls: ['./launchpad.component.scss']
})
export class LaunchpadComponent implements OnInit {

  array: ProjectPreviewModel[] = [];
  wallet = localStorage.getItem('wallet');

  @Input() isWallet: boolean = false;

  constructor(
    private projectReqService: projectReqService
  ) { }

  ngOnInit(): void {
    console.log(this.isWallet)
    if (this.isWallet) {
      console.log('wallet');
      this.projectReqService.getParticipatedPresales(this.wallet, 1).subscribe(
        (res) => {
          console.log(res);
        }
      )
    } else if (!this.isWallet) {
      console.log('not wallet');
      this.projectReqService.getAllPresales(OrderingEnum.ending, 1).subscribe(
        (res) => {
          res.forEach(
            (el: ProjectPreviewModel) => {
              this.array.push(el);
            }
          )
        }
      )
      // All
    }
  }

}
