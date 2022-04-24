import { Component, OnInit } from '@angular/core';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { TimeTupel } from '../launchpad/launchpad.component';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  arr: [ProjectPreviewModel, TimeTupel][] = [];
  constructor(
    private projectReqService: projectReqService,
  ) { }

  ngOnInit(): void {
    this.arr= [];
    this.projectReqService
        .getAllPresales(OrderingEnum.ending, 1)
        .subscribe((res) => {
          console.log(res);
          res.forEach((el: ProjectPreviewModel) => {
            let tupel: TimeTupel = {
              startTime: new Date(el.presale.startingTime * 1000),
              endTime: new Date(el.presale.endingTime * 1000)
            }
            this.arr.push([el, tupel]);
          });
        });
  }

}
