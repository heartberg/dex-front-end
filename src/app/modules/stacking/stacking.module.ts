import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StackingComponent} from "./stacking.component";
import {StackingRouting} from "./stacking.routing";
import {SharedModule} from "../../shared/shared.module";


@NgModule({
  declarations: [
    StackingComponent
  ],
  imports: [
    CommonModule,
    StackingRouting,
    SharedModule
  ]
})
export class stackingModule { }
