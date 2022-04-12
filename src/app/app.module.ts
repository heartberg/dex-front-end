import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from "./shared/shared.module";
import { HttpClientModule } from "@angular/common/http";
import {WalletsConnectService} from "./services/wallets-connect.service";
import {stackingModule} from "./modules/stacking/stacking.module";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    stackingModule,
  ],
  providers: [WalletsConnectService],
  bootstrap: [AppComponent]
})
export class AppModule { }
