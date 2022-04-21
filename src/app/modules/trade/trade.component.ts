import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Algodv2 } from 'algosdk';
import { pseudoRandomBytes } from 'crypto';
import {environment} from "../../../environments/environment";
import { getAlgodClient, getGlobalState } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { ALGO_VIEWMODEL, BlockchainInformation, DeployedAppSettings, platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';


@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
})
export class TradeComponent implements OnInit {
  availAmount: number = 0;
  rotate: boolean = false;
  autoSlippage: boolean = true;
  slippage: number = 0;
  minOutput:number = 0

  firstDropValues: string[] = [];
  secondDropValues: string[] = ['Algo', 'Token a', 'Token b', 'Token c'];

  algoArr: string[] = ['Algo'];
  tokenArr: string[] = ['Token a', 'Token b', 'Token c'];

  // my
  dropValues: string[] = ['Verse', 'Algo']
  assetNames: string[] = ['Verse', 'Algo']

  assetArr: AssetViewModel[] = [];

  selectedOptionAname: string = '';
  selectedOptionBname: string = '';
  selectedOption: AssetViewModel | undefined;

  isOptedIn: boolean = true;

  isPopUpOpen: boolean = false;

  @ViewChild('checkBox', { static: false })
  // @ts-ignore
  private checkBox: ElementRef;

  btnFirst: boolean = false;
  btnSecond: boolean = false;
  btnThird: boolean = false;
  btnFourth: boolean = false;
  isClickedOnBtn: boolean = false;

  checked: boolean = false;

  blockchainInfo: BlockchainInformation | undefined;
  deployedAppSettings: DeployedAppSettings | undefined;

  constructor(
    private assetReqService: AssetReqService,
    private fb: FormBuilder,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp
  ) {}

  // FORMS

  botInput = this.fb.control([0]);
  // slippageInput = this.fb.control([]);

  slippageForm = this.fb.group({
    slippageInput: [
      {
        disabled: this.autoSlippage,
      },
    ],
    slippageCheckBox: [this.autoSlippage],
  });

  topForms = this.fb.group({
    zeroInput: [0],
    topInput: [],
  });

  // FORMS

  ngOnInit(): void {
    if (this.slippageForm.get('slippageCheckBox')?.value) {
      this.slippageForm.get('slippageInput')?.disable();
    }

    const wallet = localStorage.getItem('wallet')!;
    this.assetReqService.getAssetPairs(false, '', wallet).subscribe(async (res) => {
      this.assetArr.push(await this.verseApp.getViewModel())
      this.assetArr.push(ALGO_VIEWMODEL)
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      this.assetArr.push(...res);
      this.firstDropValues = this.dropValues;
      res.forEach((el) => {
        this.firstDropValues.push(el.name);
        this.assetNames.push(el.name);
      });
      this.secondDropValues = this.firstDropValues;
      this.selectedOptionAname = this.firstDropValues[0];
      this.selectedOptionBname = this.firstDropValues[1];
      this.selectAsset(this.firstDropValues[0]);
    });

  }

  makeReverse() {
    this.rotate = !this.rotate;
  }

  onUserInput(input: HTMLInputElement) {
    this.btnFirst = false;
    this.btnSecond = false;
    this.btnThird = false;
    this.btnFourth = false;
  }

  handleCheckboxUpdate(event: any) {
    this.checked = event;
    if (event === true) {
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(true, '', wallet).subscribe(async (res) => {
        this.assetArr = []
        this.assetArr.push(await this.verseApp.getViewModel())
        this.assetArr.push(ALGO_VIEWMODEL)
        this.blockchainInfo = await this.verseApp.getBlockchainInformation()
        this.assetArr.push(...res);
        this.firstDropValues = ['Verse', 'Algo'];
        res.forEach((el) => {
          this.firstDropValues.push(el.name);
        });
        this.secondDropValues = this.algoArr;
        this.selectedOptionAname = this.firstDropValues[0];
        this.selectedOptionBname = this.firstDropValues[0];
        // this.selectAsset(this.firstDropValues[0]);
      });
    } else if (event === false) {
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetFavorites(localStorage.getItem('wallet')).subscribe(async (res) => {
        this.assetArr = []
        this.assetArr.push(await this.verseApp.getViewModel())
        this.assetArr.push(ALGO_VIEWMODEL)
        this.blockchainInfo = await this.verseApp.getBlockchainInformation()
        this.assetArr.push(...res);
        this.firstDropValues = [];
        res.forEach((el) => {
          this.firstDropValues.push(el.name);
        });
        this.secondDropValues = this.algoArr;
        this.selectedOptionAname = this.firstDropValues[0];
        this.selectedOptionBname = this.firstDropValues[0];
        // this.selectAsset(this.firstDropValues[0]);
      });
    }
  }

  dropdownSelected(value: string, index: number) {
    if (index === 1) {
      if (value === 'Algo') {
        this.secondDropValues = this.tokenArr;
      } else {
        this.secondDropValues = this.algoArr;
        this.selectedOptionAname = value;
        this.selectedOptionBname = value;
      }
    } else if (index === 2) {
      if (value === 'Algo') {
        // this.firstDropValues = this.tokenArr;
      } else if (value.includes('Token')) {
        // this.firstDropValues = this.algoArr;
        this.selectedOptionAname = value;
        this.selectedOptionBname = value;
      }
    }

  }

  async selectAsset(assetName: string) {
    this.selectedOption = this.assetArr.find((el) => {
      return el.name === assetName;
    });
    if(assetName == 'Verse'){
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
    } else if (assetName == 'Algo'){
      
    } else {
      this.deployedAppSettings = this.mapViewModelToAppSettings(this.selectedOption!)
      this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.deployedAppSettings)
    }
    this.updateHoldingOfSelectedAsset(this.selectedOption!.assetId)
  }  

  addFavorite(assetName: string){
    let asset = this.assetArr.find((el) => {
      return el.name === assetName;
    });
    if (asset) {
      this.assetReqService.addFavoriteAsset(asset.assetId, localStorage.getItem('wallet')!)
        .subscribe(
        (response: any) => {
          console.log(response, 'response on add in favorites')
        }
      )
    }
  }

  removeFavorite(assetName: string){
    let asset = this.assetArr.find((el) => {
      return el.name === assetName;
    });
    if (asset) {
      this.assetReqService.removeFavoriteAsset(asset.assetId, localStorage.getItem('wallet')!)
        .subscribe(
        (response: any) => {
          console.log(response, 'response on add in favorites')
        }
      )
    }
  }

  checkBoxClicked() {
    const slippageBox = this.slippageForm.get('slippageCheckBox');
    const slippageInput = this.slippageForm.get('slippageInput');
    if (!slippageBox?.value) {
      slippageInput?.enable();
    } else if (slippageBox.value) {
      slippageInput?.disable();
      slippageInput?.setValue(null);
    }
  }

  openPopUp() {
    this.isPopUpOpen = true;
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
  }

  async getValueFromDropDown($event: any, index: number) {
    console.log("value from dropdown")
    console.log($event);
    // console.log($event);
    // if (index === 1 && $event) {
    //   this.secondDropValues.find( (item, i) =>  {
    //     item = $event;
    //     console.log(i);
    //     this.secondDropValues.splice(i+ 1, 1);
    //   })
    //   console.log(this.secondDropValues);
    // }

    this.selectAsset($event);

    // fill deployed app settings with information
    // create deployed app object

    if (index === 1) {
      // if ($event === 'Algo') {
      // this.secondDropValues = this.tokenArr;
      // } else if ($event.includes('Token')) {
      // this.secondDropValues = this.algoArr;
      this.selectedOptionAname = $event;
      this.selectedOptionBname = $event;
      // }
    } else if (index === 2) {
      // if ($event === 'Algo') {
      // this.firstDropValues = this.tokenArr;
      // } else if ($event.includes('Token')) {
      // this.firstDropValues = this.algoArr;
      this.selectedOptionAname = $event;
      this.selectedOptionBname = $event;
      // }
    }
    this.selectedOptionAname = $event;
  }

  getPercentOfButton(index: number, inputRef: HTMLInputElement) {
    this.isClickedOnBtn = true;
    if (index === 1) {
      this.btnFirst = true;
      this.btnSecond = false;
      this.btnThird = false;
      this.btnFourth = false;
      inputRef.value = (this.availAmount / 4).toString();
    } else if (index === 2) {
      this.btnSecond = true;
      this.btnFirst = false;
      this.btnThird = false;
      this.btnFourth = false;
      inputRef.value = (this.availAmount / 2).toString();
    } else if (index === 3) {
      this.btnThird = true;
      this.btnFirst = false;
      this.btnSecond = false;
      this.btnFourth = false;
      inputRef.value = (this.availAmount / 4 * 3).toString();
    } else if (index === 4) {
      this.btnFourth = true;
      this.btnFirst = false;
      this.btnSecond = false;
      this.btnThird = false;
      inputRef.value = this.availAmount.toString();
    }
  }

  getMinusPlusValue($event: number) {
   console.log($event);
  }

  mapViewModelToAppSettings(model: AssetViewModel) : DeployedAppSettings{
    return {
      asset_id: model.assetId,
      contract_id: model.contractId,
      contract_address: model.contractAddress,
      buy_burn: model.buyBurn,
      creator: model.deployerWallet,
      decimals: model.decimals,
      extra_fee_time: 300,
      max_buy: model.maxBuy,
      name: model.name,
      unit: model.unitName,
      sell_burn: model.sellBurn,
      trading_start: model.tradingStart,
      to_backing: model.backing,
      to_lp: model.risingPriceFloor,
      transfer_burn: model.sendBurn,
      url: "",
      initial_algo_liq: 0,
      initial_algo_liq_with_fee: 0,
      initial_token_liq: 0,
      total_supply: 0,
      presale_settings: {
        hardcap: 0,
        presale_end: 0,
        presale_start: 0,
        presale_token_amount: 0,
        softcap: 0,
        to_lp: 0,
        walletcap: 0
      }
    }
  }

  async updateHoldingOfSelectedAsset(assetId: number) {
    let client: Algodv2 = getAlgodClient()
    const wallet = localStorage.getItem('wallet')!;
    let accountInfo = await client.accountInformation(wallet).do()
    let asset = accountInfo['assets'].find((el: any) => {
      return el['asset-id'] == assetId
    })
    if(asset != null){
      let assetInfo = await client.getAssetByID(assetId).do()
      this.availAmount = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
      this.isOptedIn = true
    } else {
      this.availAmount  = 0
      this.isOptedIn = false
    }

  }

  optInAsset() {
    // TODO: need real wallet object here for signing
    const wallet = localStorage.getItem('wallet')!;
    if(this.selectedOption?.name == 'Verse'){
      //this.verseApp.optInAsset(wallet)
    } else {
      //this.deployedApp.optInAsset(wallet, this.deployedAppSettings)
    }
  }

  getAutoSlippage(asset: AssetViewModel, buy: boolean) {
    let accumulatedFees = asset.backing + +environment.Y_FEE! * 10000
    if(buy){
      accumulatedFees += asset.buyBurn
    } else{
      accumulatedFees += asset.sellBurn + asset.risingPriceFloor
    }

    if (asset.name != 'Verse'){
      accumulatedFees += +environment.VERSE_FEE!
    }
    this.slippage = accumulatedFees
  }

  calcDesiredOutput(amountToBuy:number, liqA: number, liqB: number) {
    return amountToBuy * liqA / liqB
  }

  setMinOutput(desiredOutput: number, slippage: number){
    let output = desiredOutput - (desiredOutput * slippage / 10000)
    this.minOutput = output
  }

}
