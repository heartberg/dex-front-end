import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {StackingComponent} from "./stacking.component";

const routes: Routes = [{ path: '', component: StackingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StackingRouting { }
