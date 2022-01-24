import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TokensRoutingModule } from './tokens-routing.module';
import { TokensComponent } from './tokens.component';
import { TokenDetailComponent } from './token-detail/token-detail.component';


@NgModule({
  declarations: [
    TokensComponent,
    TokenDetailComponent
  ],
  imports: [
    CommonModule,
    TokensRoutingModule,
  ]
})
export class TokensModule { }
