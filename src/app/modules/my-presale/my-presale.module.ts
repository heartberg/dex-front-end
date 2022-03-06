import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyPresaleRoutingModule } from './my-presale-routing.module';
import { MyPresaleComponent } from './my-presale.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    MyPresaleComponent
  ],
  imports: [
    CommonModule,
    MyPresaleRoutingModule,
    SharedModule
  ]
})
export class MyPresaleModule { }
