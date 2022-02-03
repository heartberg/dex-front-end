import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TokensRoutingModule } from './tokens-routing.module';
import { TokensComponent } from './tokens.component';
import { TokenDetailComponent } from './token-detail/token-detail.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    TokensComponent,
    TokenDetailComponent
  ],
  imports: [
    CommonModule,
    TokensRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class TokensModule { }
