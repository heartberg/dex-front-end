import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeployRoutingModule } from './deploy-routing.module';
import { DeployComponent } from './deploy.component';


@NgModule({
  declarations: [
    DeployComponent
  ],
  imports: [
    CommonModule,
    DeployRoutingModule
  ]
})
export class DeployModule { }
