import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from "./shared/shared.module";
import { HttpClientModule } from "@angular/common/http";
import {WalletsConnectService} from "./services/wallets-connect.service";
import {StakingModule} from "./modules/staking/staking.module";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    StakingModule,
  ],
  providers: [WalletsConnectService],
  bootstrap: [AppComponent]
})
export class AppModule { }
