import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LockerComponent } from './locker/locker.component';
import {LockerRoutingModule} from "./locker-routing.module";
import {SharedModule} from "../../shared/shared.module";



@NgModule({
  declarations: [
    LockerComponent
  ],
  imports: [
    CommonModule,
    LockerRoutingModule,
    SharedModule
  ]
})
export class LockerModule { }
