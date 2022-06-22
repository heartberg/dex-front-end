import {NgModule} from "@angular/core";
import {HeaderComponent} from "./header/component/header.component";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {DropDownSelectorComponent} from "./drop-down-selector/drop-down-selector.component";
import {PopUpComponent} from "./pop-up/component/pop-up.component";
import { CardComponent } from './card/card.component';
import { TextLimitPipe } from './pipes/text-limit.pipe';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {InfiniteScrollComponent} from "./infinite-scroll/infinite-scroll.component";

@NgModule({
  declarations: [
    HeaderComponent,
    DropDownSelectorComponent,
    PopUpComponent,
    CardComponent,
    TextLimitPipe,
    InfiniteScrollComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    HeaderComponent,
    DropDownSelectorComponent,
    PopUpComponent,
    CardComponent,
    InfiniteScrollComponent,
  ]

})
export class SharedModule {}
