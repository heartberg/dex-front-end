import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyDeploysComponent } from './my-deploys.component';

const routes: Routes = [{ path: '', component: MyDeploysComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyDeploysRoutingModule { }
