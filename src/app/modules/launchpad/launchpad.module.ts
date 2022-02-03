import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LaunchpadRoutingModule } from './launchpad-routing.module';
import { LaunchpadComponent } from './launchpad.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { LaunchDetailComponent } from './launch-detail/launch-detail.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    LaunchpadComponent,
    LaunchDetailComponent
  ],
  imports: [
    CommonModule,
    LaunchpadRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ],
  exports: [
    LaunchpadComponent
  ]
})
export class LaunchpadModule { }
