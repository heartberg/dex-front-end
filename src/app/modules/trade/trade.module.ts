import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradeRoutingModule } from './trade-routing.module';
import { TradeComponent } from './trade.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    TradeComponent
  ],
  imports: [
    CommonModule,
    TradeRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class TradeModule { }
