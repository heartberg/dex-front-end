import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./home/home/home.component";
import {TradeComponent} from "./home/trade/trade.component";
import {SendComponent} from "./home/send/send.component";
import {LaunchpadComponent} from "./home/launchpad/launchpad.component";
import {LaunchDetailComponent} from "./home/launch-detail/launch-detail.component";
import {DeployComponent} from "./home/deploy/deploy.component";
import {TrackComponent} from "./home/track/track.component";
import {MyDeployComponent} from "./home/my-deploy/my-deploy.component";
import {MyPresaleComponent} from "./home/my-presale/my-presale.component";
import {WalletComponent} from "./home/wallet/wallet.component";
import { TokensComponent } from './home/tokens/tokens.component';
import { TokenDetailComponent } from './home/token-detail/token-detail.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'trade',
    component: TradeComponent,
  },
  {
    path: 'send',
    component: SendComponent
  },
  {
    path: 'launchpad',
    component: LaunchpadComponent
  },
  {
    path: 'launch-detail',
    component: LaunchDetailComponent
  },
  {
    path: 'deploy',
    component: DeployComponent
  },
  {
    path: 'track',
    component: TrackComponent
  },
  {
    path: 'my-deploy',
    component: MyDeployComponent
  },
  {
    path: 'my-presale',
    component: MyPresaleComponent
  },
  {
    path: 'wallet',
    component: WalletComponent
  },
  {
    path: 'tokens',
    component: TokensComponent
  },
  {
    path: 'token-detail',
    component: TokenDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
