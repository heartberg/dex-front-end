import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';
import { TrackModule } from '../track/track.module';
import { LaunchpadModule } from '../launchpad/launchpad.module';


@NgModule({
  declarations: [
    WalletComponent
  ],
  imports: [
    CommonModule,
    WalletRoutingModule,
    LaunchpadModule,
    TrackModule
  ]
})
export class WalletModule { }
