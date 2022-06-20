import {
  Component,
  DoCheck,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {Observable, of} from 'rxjs';
import { AssetViewModel } from 'src/app/models/assetViewModel';
import {take} from "rxjs/operators";
import {AssetReqService} from "../../services/APIs/assets-req.service";
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { CompileResponse } from 'algosdk/dist/types/src/client/v2/algod/models/types';

@Component({
  selector: 'app-drop-down-selector',
  templateUrl: './drop-down-selector.component.html',
  styleUrls: ['./drop-down-selector.component.scss'],
})
export class DropDownSelectorComponent implements OnInit, DoCheck, OnChanges {
  @Input() public dropDownValues: AssetViewModel[] | any = [];
  @Input() public dropDownValuesSecond: AssetViewModel[] | any = [];

  @Input() public firstOnTrade: boolean = true;
  @Input() public secondOnTrade: boolean = false;

  @Input() public isNotAccordion: boolean = true;
  @Input() public treeDots: boolean = false;
  // profile
  @Input() public isProfileSection: boolean = false;
  @Input() public profileSectionImg: string = '';
  @Input() public profileSectionInfo: string = '';
  // profile
  @Input() public tree: boolean = false;
  @Input() public hasTitle: string = '';
  // marketplace artists and collections
  @Input() public dropDownForObj: any[] = [];
  @Input() public dropDownIsTrue: boolean = false;
  // marketplace artists and collections
  @Output() dropDownValue = new EventEmitter<string>();

  @Output() selectedAsset = new EventEmitter<number>();

  @Output() showAll: EventEmitter<boolean> = new EventEmitter();

  @Input() public widthPX: any = '';
  @Input() public extraDropDown: boolean = false;
  @Input() public notCloseOnClick: boolean = false;

  // for trade show all/show favs
  @Input() public checkBoxCheckTrade: boolean = false;
  @Input() incomeData: AssetViewModel[] = [];

  // trade
  @Input() botChanged: boolean = true;
  @Input() topChanged: boolean = false;
  valueDefault: string = 'Algo'
  //trade

  @Output() searchedData: EventEmitter<any> = new EventEmitter();
  // switcher
  @Input() public isSwitcher: boolean = false;
  @Output() switcherEmit: EventEmitter<any> = new EventEmitter<any>()
  // switcher

  public favAssetsArr: AssetViewModel[] = [];
  public allAssetsArr: AssetViewModel[] = [];
  isPlus: boolean = false;
  // for trade show all/show favs

  public isDropDownOpened = false;
  public isDropDownOpenedCounter = 1;
  public showDropDownSelected: string = '';

  @Input() tradeSelectedTop: string = '';
  @Input() tradeSelectedBottom: string = '';
  //  for while
  publicTradeIsAdded: boolean = false;

  @Input() saveStoreTop: string = '';
  @Input() saveStoreBottom: string = '';
  // isMinus: boolean = true;
  // isPlus: boolean = false;
  isTrade: boolean = false;

  @Output() wholeObj: EventEmitter<any> = new EventEmitter();
  // FORM
  dropDownForm = this.fb.group({
    search: [],
    showAll: [],
  });
  // FORM

  // default values for marketplace collection and artists

  // public artistsDropDownDefaultName: string = 'All Artists';
  // public collectionDropDownDefaultName: string = 'All Collections';
  //
  // public passedEitherArtist: boolean = false;
  // public passedEitherCollection: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private req: AssetReqService
  ) {}

  ngOnInit(): void {
    console.log(this.incomeData)
   setTimeout(() => {
     this.incomeData.find( (item: AssetViewModel) => item.assetId === ps.platform.verse_asset_id ? this.tradeSelectedBottom = item.name : null)
     console.log(this.tradeSelectedBottom);
   }, 500)

    // @ts-ignore
    if (this.route.snapshot._routerState.url === '/trade') {
      this.isTrade = true;
    } else {
      this.isTrade = false;
    }
  }

  ngDoCheck() {

  }

  ngOnChanges() {
    console.log(this.topChanged, this.tradeSelectedTop)

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

  selectValue(value: string, i?: any, id?: string, item?: any) {
    if (this.isSwitcher) {
      this.switcherEmit.emit({value, i})
      this.showDropDownSelected = value
    }
    this.wholeObj.emit(item);
    if (this.notCloseOnClick) {
      // this.isDropDownOpenedCounter +=1;
      this.openDropDown();
      this.showDropDownSelected = value
      this.dropDownValue.emit(value);
      this.publicTradeIsAdded = !this.publicTradeIsAdded;
    } else {
      // this.isDropDownOpenedCounter +=1;
      this.openDropDown();
      this.showDropDownSelected = value;
      // this.tradeSelectedTop = this.showDropDownSelected;
      // this.tradeSelectedBottom = this.showDropDownSelected;
      this.dropDownValue.emit(value);
      this.isDropDownOpened = false;
    }

    // Store ID

    if (value.includes('Sub')) {
      this.showDropDownSelected = value.substring(value.indexOf(' '), 25);
    }
  }

  handleCheckBox() {
    this.showAll.emit(this.dropDownForm.get('showAll')?.value);
  }

  addToFavourites(button: AssetViewModel) {
    let wallet = localStorage.getItem('wallet')
    console.log(button.assetId);
    console.log("ADD FAV")
    this.req.addFavoriteAsset(button.assetId, wallet!).subscribe((item) => {
      button.isFavorite = true
      console.log(item)
    } )
  }

  removeFromFavourites(button: AssetViewModel) {
    let wallet = localStorage.getItem('wallet')
    console.log(button.assetId);
    console.log(wallet)
    console.log("REMOVE FAV")
    this.req.removeFavoriteAsset(button.assetId, wallet!).subscribe((item) => {
      button.isFavorite = false
      console.log(item)
    } )
  }

  emitCollectionIdAndWallet(
    value: string,
    collectionId: string,
    wallet: string
  ): void {
    this.isDropDownOpenedCounter += 1;

    this.showDropDownSelected = value;
    this.isDropDownOpened = false;
    this.dropDownValue.emit(collectionId);
  }

  getElement(i: any) {
    console.log(i);
  }

  getMinusOrPlusLogic(button: any, index: number) {
    // console.log(button, index);
  }

  getSearchValue($event: Event) {
    // @ts-ignore
    this.searchedData.emit(this.dropDownForm.get('search').value)
  }

  //switcher
  returnAddress(acc: string) {
    if (localStorage.getItem('wallet')) {
      acc = localStorage.getItem('wallet')!;
    }
    let start: string = '';
    let last: string = ''
    start = acc.substring(0,3);
    last = acc.substring(acc.length, acc.length - 3);
    let final = start + '...' + last;
    return final
  }

  //switcher
}
