import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-token-detail',
  templateUrl: './token-detail.component.html',
  styleUrls: ['./token-detail.component.scss'],
})
export class TokenDetailComponent implements OnInit {
  isPopUpOpen: boolean = false;
  isBorrow: boolean = false;
  isBacking: boolean = false;

  currentProjectId: string = this.route.snapshot.paramMap.get('id')!;
  projectData!: ProjectViewModel;

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService
  ) {}

  ngOnInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService
      .getProjectById(this.currentProjectId)
      .subscribe((res) => {
        this.projectData = res;
        console.log(this.projectData)
      });
  }

  openPopUp(version: string) {
    this.isPopUpOpen = true;
    if (version === 'isBorrow') {
      this.isBorrow = true;
      this.isBacking = false;
    } else if (version === 'isBacking') {
      this.isBorrow = false;
      this.isBacking = true;
    }
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }
}
