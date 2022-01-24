import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyDeploysRoutingModule } from './my-deploys-routing.module';
import { MyDeploysComponent } from './my-deploys.component';


@NgModule({
  declarations: [
    MyDeploysComponent
  ],
  imports: [
    CommonModule,
    MyDeploysRoutingModule
  ]
})
export class MyDeploysModule { }
