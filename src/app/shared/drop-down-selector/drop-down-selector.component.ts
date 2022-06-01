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
  @Input() buttonTradeChanged: boolean = false;
  @Input() buttonTradeChangedTop: boolean = false;

  @Input() buttonTradeChangedValue: string = 'Algo';
  @Input() buttonTradeChangedTopValue: string = 'Algo';
  //trade
  public favAssetsArr: AssetViewModel[] = [];
  public allAssetsArr: AssetViewModel[] = [];
  isPlus: boolean = false;
  // for trade show all/show favs

  public isDropDownOpened = false;
  public isDropDownOpenedCounter = 1;
  public showDropDownSelected: string = '';

  tradeSelectedTop: string = '';
  tradeSelectedBottom: string = '';
  //  for while
  publicTradeIsAdded: boolean = false;

  saveStore: string = '';
  // isMinus: boolean = true;
  // isPlus: boolean = false;

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
     this.incomeData.find( (item: AssetViewModel) => item.assetId === 6813 ? this.tradeSelectedBottom = item.name : null)
     console.log(this.tradeSelectedBottom);
   }, 500)

  }

  ngDoCheck() {

  }

  ngOnChanges() {
    if (this.secondOnTrade) {
      return
    } else {
      if (this.secondOnTrade) {
        this.firstOnTrade = false;
      }
    }
    if (this.checkBoxCheckTrade) {
      this.allAssetsArr = this.incomeData;
      this.isPlus = true;
    } else {
      this.favAssetsArr = this.incomeData;
      this.isPlus = false;
    }

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

  selectValue(value: string, i?: any, id?: string) {
    if (this.notCloseOnClick) {
      // this.isDropDownOpenedCounter +=1;
      this.openDropDown();
      console.log(value, 'ssssss', id)
      if (value !== 'Algo') {
        this.saveStore = value;
      }
      this.showDropDownSelected = value
      // logic for trade
        if (id === '1'  && this.tradeSelectedTop !== 'Algo') {
          this.tradeSelectedTop = this.saveStore;
      } else
        if (id === '2' && this.tradeSelectedBottom !== 'Algo') {
          this.tradeSelectedBottom = this.saveStore;
        } else if (id === '1' && this.buttonTradeChangedTop) {
          // @ts-ignore
        } else if (id === '2' && value === 'Algo') {
          // @ts-ignore
        }
      console.log(this.tradeSelectedTop, 'ifis garet ')
      // logic for trade



      this.dropDownValue.emit(value);
      this.publicTradeIsAdded = !this.publicTradeIsAdded;
    } else {
      // this.isDropDownOpenedCounter +=1;
      this.openDropDown();
      this.showDropDownSelected = value;
      this.tradeSelectedTop = value;
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

  addToFavourites(button: AssetViewModel, i: number) {
    let wallet = localStorage.getItem('wallet')
    console.log(button.assetId);
    this.req.addFavoriteAsset(button.assetId, wallet!).subscribe((item) => console.log(item) )
  }

  removeFromFavourites(button: AssetViewModel) {
    let wallet = localStorage.getItem('wallet')
    console.log(button.assetId);
    this.req.removeFavoriteAsset(button.assetId, wallet!).subscribe((item) => console.log(item) )
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
}
