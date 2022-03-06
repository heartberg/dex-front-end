import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyPresaleComponent } from './my-presale.component';

const routes: Routes = [{ path: '', component: MyPresaleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyPresaleRoutingModule { }
