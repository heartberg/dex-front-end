import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradeRoutingModule } from './trade-routing.module';
import { TradeComponent } from './trade.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    TradeComponent
  ],
  imports: [
    CommonModule,
    TradeRoutingModule,
    SharedModule
  ]
})
export class TradeModule { }
