import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployRoutingModule } from './deploy-routing.module';
import { DeployComponent } from './deploy.component';
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../../shared/shared.module";


@NgModule({
  declarations: [
    DeployComponent
  ],
    imports: [
        CommonModule,
        DeployRoutingModule,
        ReactiveFormsModule,
        SharedModule
    ]
})
export class DeployModule { }
