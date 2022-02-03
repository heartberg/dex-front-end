import {NgModule} from "@angular/core";
import {HeaderComponent} from "./header/component/header.component";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {DropDownSelectorComponent} from "./drop-down-selector/drop-down-selector.component";
import {PopUpComponent} from "./pop-up/component/pop-up.component";
import { CardComponent } from './card/card.component';
import { TextLimitPipe } from './pipes/text-limit.pipe';
import { ReactiveFormsModule } from "@angular/forms";

@NgModule({
  declarations: [
    HeaderComponent,
    DropDownSelectorComponent,
    PopUpComponent,
    CardComponent,
    TextLimitPipe,
  ],
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    HeaderComponent,
    DropDownSelectorComponent,
    PopUpComponent,
    CardComponent
  ]

})
export class SharedModule {}
