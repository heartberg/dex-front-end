import {NgModule} from "@angular/core";
import {HeaderComponent} from "./header/component/header.component";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {DropDownSelectorComponent} from "./drop-down-selector/drop-down-selector.component";
import {PopUpComponent} from "./pop-up/component/pop-up.component";
import { CardComponent } from './card/card.component';

@NgModule({
  declarations: [
    HeaderComponent,
    DropDownSelectorComponent,
    PopUpComponent,
    CardComponent
  ],
  imports: [
    RouterModule,
    CommonModule,

  ],
  exports: [
    HeaderComponent,
    DropDownSelectorComponent,
    PopUpComponent,
    CardComponent
  ]

})
export class SharedModule {}
