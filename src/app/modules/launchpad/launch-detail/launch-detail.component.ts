import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
// import { ActivatedRoute } from '@angular/router';
// import { ProjectViewModel } from 'src/app/models/projectView.model';
// import { projectReqService } from 'src/app/services/APIs/project-req.service';

@Component({
  selector: 'app-launch-detail',
  templateUrl: './launch-detail.component.html',
  styleUrls: ['./launch-detail.component.scss']
})
export class LaunchDetailComponent implements OnInit {
  closePopup: boolean = false;
  currentProjectId: string = this.route.snapshot.paramMap.get('id')!;
  projectData!: ProjectViewModel;

  constructor(
    private route: ActivatedRoute,
    private projectsReqService: projectReqService
  ) { }

  ngOnInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'));
    this.projectsReqService.getProjectById(this.currentProjectId).subscribe(
      (res) => {
        this.projectData = res;
        console.log(this.projectData)
      }
    )
  }

  closePopUp(event: boolean) {
    this.closePopup = event;
  }

  openPopUp() {
    this.closePopup = true;
  }
}
