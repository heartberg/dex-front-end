import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SendRoutingModule } from './send-routing.module';
import { SendComponent } from './send.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    SendComponent
  ],
  imports: [
    CommonModule,
    SendRoutingModule,
    SharedModule
  ]
})
export class SendModule { }
