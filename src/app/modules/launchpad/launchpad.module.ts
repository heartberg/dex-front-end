import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LaunchpadRoutingModule } from './launchpad-routing.module';
import { LaunchpadComponent } from './launchpad.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { LaunchDetailComponent } from './launch-detail/launch-detail.component';


@NgModule({
  declarations: [
    LaunchpadComponent,
    LaunchDetailComponent
  ],
  imports: [
    CommonModule,
    LaunchpadRoutingModule,
    SharedModule
  ],
  exports: [
    LaunchpadComponent
  ]
})
export class LaunchpadModule { }
