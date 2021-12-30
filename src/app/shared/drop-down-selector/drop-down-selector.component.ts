import {Component, DoCheck, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";


@Component({
  selector: 'app-drop-down-selector',
  templateUrl: './drop-down-selector.component.html',
  styleUrls: ['./drop-down-selector.component.scss']
})
export class DropDownSelectorComponent implements OnInit, DoCheck, OnChanges {
  @Input() public dropDownValues: any[] = [];
  @Input() public isNotAccordion: boolean = true;
  @Input() public treeDots: boolean = false;
  // profile
  @Input() public isProfileSection: boolean = false;
  @Input() public profileSectionImg: string = ''
  @Input() public profileSectionInfo: string = ''
  // profile
  @Input() public tree: boolean = false;
  @Input() public hasTitle: string  = '';
  // marketplace artists and collections
  @Input() public dropDownForObj: any[] = [];
  @Input() public dropDownIsTrue: boolean = false;
  // marketplace artists and collections
  @Output() dropDownValue = new EventEmitter<string>();

  @Input() public widthPX: any = '';
  @Input() public extraDropDown: boolean = false;

  public isDropDownOpened = false;
  public isDropDownOpenedCounter = 1;
  public showDropDownSelected: string = '';

  //  for while
  publicTradeIsAdded: boolean = false;

  // default values for marketplace collection and artists

  // public artistsDropDownDefaultName: string = 'All Artists';
  // public collectionDropDownDefaultName: string = 'All Collections';
  //
  // public passedEitherArtist: boolean = false;
  // public passedEitherCollection: boolean = false;

  constructor(
                private route: ActivatedRoute,
                private router: Router
              ) { }


  ngOnInit(): void {

  }

  ngDoCheck() {

  }

  ngOnChanges() {
    // this.showDropDownSelected = this.dropDownValueTitleForObj;
  }

  openDropDown() {
    this.isDropDownOpenedCounter += 1;
    if (this.isDropDownOpenedCounter % 2 === 0) {
      this.isDropDownOpened = true;
    } else {
      this.isDropDownOpened = false;
    }
  }

  selectValue(value: string, i?: any) {
    this.isDropDownOpenedCounter +=1;
    this.showDropDownSelected = value
    this.isDropDownOpened = false;
    this.dropDownValue.emit(value);
  }

  emitCollectionIdAndWallet(value: string, collectionId: string, wallet: string): void {
    this.isDropDownOpenedCounter +=1;

    this.showDropDownSelected = value;
    this.isDropDownOpened = false;
    this.dropDownValue.emit(collectionId);
  }

  getElement(i: any) {
    console.log(i)
  }
}
