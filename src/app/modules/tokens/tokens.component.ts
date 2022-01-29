import { Component, OnInit } from '@angular/core';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit {


  arr: ProjectPreviewModel[] = [];

  public isActiveFirst: boolean = false;
  public isActiveSecond: boolean = false;

  constructor(
    private projectsReqService: projectReqService
  ) { }

  ngOnInit(): void {
    this.projectsReqService.getAllProjects('a-z', 1).subscribe(
      (res) => {
        this.arr = res;
        console.log(res);
      }
    )
    this.isActiveFirst = true;
  }

  activeFirst() {
    this.isActiveFirst = true;
    this.isActiveSecond = false;
  }

  activeSecond() {
    this.isActiveSecond = true;
    this.isActiveFirst = false;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

}
