import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {SharedModule} from "./shared/shared.module";
import { HomeComponent } from './home/home/home.component';
import { TradeComponent } from './home/trade/trade.component';
import { SendComponent } from './home/send/send.component';
import { LaunchpadComponent } from './home/launchpad/launchpad.component';
import { LaunchDetailComponent } from './home/launch-detail/launch-detail.component';
import { DeployComponent } from './home/deploy/deploy.component';
import {HttpClientModule} from "@angular/common/http";
import { TrackComponent } from './home/track/track.component';
import { MyDeployComponent } from './home/my-deploy/my-deploy.component';
import { MyPresaleComponent } from './home/my-presale/my-presale.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TradeComponent,
    SendComponent,
    LaunchpadComponent,
    LaunchDetailComponent,
    DeployComponent,
    TrackComponent,
    MyDeployComponent,
    MyPresaleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
