import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LockerComponent } from './locker.component';
import {LockerRoutingModule} from "./locker-routing.module";
import {SharedModule} from "../../shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";


@NgModule({
  declarations: [
    LockerComponent
  ],
  imports: [
    CommonModule,
    LockerRoutingModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class LockerModule { }
