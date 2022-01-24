import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TokenDetailComponent } from './token-detail/token-detail.component';
import { TokensComponent } from './tokens.component';

const routes: Routes = [
  { path: '', component: TokensComponent },
  {
    path: 'token-detail',
    component: TokenDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TokensRoutingModule { }
