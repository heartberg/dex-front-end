import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StakingComponent} from "./staking.component";
import {StakingRouting} from "./staking.routing";
import {SharedModule} from "../../shared/shared.module";


@NgModule({
  declarations: [
    StakingComponent
  ],
  imports: [
    CommonModule,
    StakingRouting,
    SharedModule
  ]
})
export class StakingModule { }
