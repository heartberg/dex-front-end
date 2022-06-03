import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LockerComponent} from "./locker/locker.component";

const routes: Routes = [
  { path: '', component: LockerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LockerRoutingModule { }
