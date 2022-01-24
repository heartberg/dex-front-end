import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeployComponent } from './deploy.component';

const routes: Routes = [{ path: '', component: DeployComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeployRoutingModule { }
