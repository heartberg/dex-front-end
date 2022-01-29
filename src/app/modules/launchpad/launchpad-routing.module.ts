import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LaunchDetailComponent } from './launch-detail/launch-detail.component';
import { LaunchpadComponent } from './launchpad.component';

const routes: Routes = [
  { path: '', component: LaunchpadComponent },
  {
    path: 'launch-detail',
    component: LaunchDetailComponent
  }
  // {
  //   path: 'launch-detail/:id',
  //   component: LaunchDetailComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LaunchpadRoutingModule { }
