import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  { path: 'deploy', loadChildren: () => import('./modules/deploy/deploy.module').then(m => m.DeployModule) },
  { path: 'home', loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule) },
  { path: 'launchpad', loadChildren: () => import('./modules/launchpad/launchpad.module').then(m => m.LaunchpadModule) },
  { path: 'wallet', loadChildren: () => import('./modules/wallet/wallet.module').then(m => m.WalletModule) },
  { path: 'track', loadChildren: () => import('./modules/track/track.module').then(m => m.TrackModule) },
  { path: 'my-deploys', loadChildren: () => import('./modules/my-deploys/my-deploys.module').then(m => m.MyDeploysModule) },
  { path: 'send', loadChildren: () => import('./modules/send/send.module').then(m => m.SendModule) },
  { path: 'trade', loadChildren: () => import('./modules/trade/trade.module').then(m => m.TradeModule) },
  { path: 'my-presale', loadChildren: () => import('./modules/my-presale/my-presale.module').then(m => m.MyPresaleModule) },
  { path: 'tokens', loadChildren: () => import('./modules/tokens/tokens.module').then(m => m.TokensModule) },
  { path: 'stacking', loadChildren: () => import('./modules/staking/staking.module').then(m => m.StakingModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
