import {Component, DoCheck, ElementRef, OnChanges, OnInit, ViewChild} from '@angular/core';
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
import { SessionWallet, Wallet } from 'algorand-session-wallet';
import { env } from 'process';


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

  // my
  assetArr: AssetViewModel[] = [];
  assetArrSecond: AssetViewModel[] = [];

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
  clickCounter: number = 0;
  isClickedOnBtn: boolean = false;

  checked: boolean = false;
  checkedSecond: boolean = false;

  changeBottom: boolean = false;
  changeTop: boolean = false;

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

  async ngOnInit(): Promise<void> {
    if (this.slippageForm.get('slippageCheckBox')?.value) {
      this.slippageForm.get('slippageInput')?.disable();
    }

    this.assetArr.push(await this.verseApp.getViewModel())
    this.assetArr.push(ALGO_VIEWMODEL)
    this.blockchainInfo = await this.verseApp.getBlockchainInformation()

    const wallet = localStorage.getItem('wallet')!;
    this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
      // data

      // this.assetArr = [...res];
      // // pushing verse
      //   // @ts-ignore
      // this.assetArr.unshift( {name: 'Algo'});
      // // @ts-ignore
      // this.assetArr.unshift( {name: 'Verse'});
      // // pushing algo
      // this.assetArrSecond = [...res];
      // // @ts-ignore
      // this.assetArrSecond.unshift( {name: 'Verse'});
      //   // @ts-ignore
      // this.assetArrSecond.unshift( {name: 'Algo'});

      // data
      this.removeVerse(res);
      this.assetArr.push(...res);
      // this.selectAsset(this.firstDropValues[0]);
    });

    this.selectAsset(this.assetArr[0].assetId);
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

  async handleCheckboxUpdate(event: any) {
    this.checked = event;
    const wallet = localStorage.getItem('wallet')!;
    if (event === true) {
      this.assetReqService.getAssetPairs(true, '', wallet).subscribe(async (res) => {
        this.assetArr = []
        this.assetArr.push(await this.verseApp.getViewModel())
        this.assetArr.push(ALGO_VIEWMODEL)
        this.blockchainInfo = await this.verseApp.getBlockchainInformation()
        this.removeVerse(res)
        this.assetArr.push(...res);
      });
    } else if (event === false) {
      this.assetArr = []
      this.assetArr.push(await this.verseApp.getViewModel())
      this.assetArr.push(ALGO_VIEWMODEL)
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
        this.removeVerse(res)
        this.assetArr.push(...res);
        this.selectAsset(this.assetArr[0].assetId)
      });
    }
  }

  dropdownSelected(value: string, index: number) {
    if (index === 1) {
      if (value === 'Algo') {
        this.selectAsset(0)
        console.log("Show Verse on bottom")
      } else {
        console.log("Show Algo on bottom")
      }
    } else if (index === 2) {
      if (value === 'Algo') {
        console.log("Show Verse on top")
      } else {
        console.log("Show Algo on top")
      }
    }

  }

  async selectAsset(assetId: number) {
    console.log(assetId)
    if(assetId == 0){
      const wallet = localStorage.getItem('wallet')!;
      let client: Algodv2 = getAlgodClient()
      let accInfo = await client.accountInformation(wallet).do()
      console.log(accInfo)
      this.availAmount = accInfo['amount'] / 1_000_000
      this.isOptedIn = true
    } else {
      this.selectedOption = this.assetArr.find((el) => {
        return el.assetId === assetId;
      });
      if(assetId == ps.platform.verse_asset_id){
        this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      } else {
        this.deployedAppSettings = this.mapViewModelToAppSettings(this.selectedOption!)
        this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.deployedAppSettings.contract_id!)
      }
      this.updateHoldingOfSelectedAsset(this.selectedOption!.assetId)

      console.log(this.selectedOption)
      console.log(this.blockchainInfo)
    }
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
    // if ($event !== 'Algo' && index === 1) {
    //   this.changeBottom = true;
    //   // sell
    // } else {
    //   this.changeBottom = false;
    // }
    // // second check
    // if ($event !== 'Algo' && index === 2) {
    //   this.changeTop = true;
    //   // buy
    // } else {
    //   this.changeTop = false;
    // }
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
    if($event != 'Algo') {
      let asset = this.assetArr.find((el) => {
        return el.name === $event;
      });
      this.selectAsset(asset!.assetId);
    }

    // fill deployed app settings with information
    // create deployed app object
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
    // + 100 to give an extra 1% for slippage
    this.slippage = accumulatedFees + 100
  }

  calcDesiredOutput(amountToBuy:number, liqA: number, liqB: number) {
    return amountToBuy * liqA / liqB
  }

  setMinOutput(desiredOutput: number, slippage: number){
    let output = desiredOutput - (desiredOutput * slippage / 10000)
    this.minOutput = output
  }

  async buy(wallet: SessionWallet, amount: number){
    if(this.selectedOption!.name == 'Verse') {
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
    } else {
      this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.deployedAppSettings!.contract_id!)
    }
    let scaledAmount = Math.floor(amount * 1_000_000)

    let wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.tokenLiquidity, this.blockchainInfo.algoLiquidity)
    await this.deployedApp.buy(wallet, scaledAmount, this.slippage, wantedReturn, this.deployedAppSettings!)
  }

  async sell(wallet: SessionWallet, amount: number){
    let scaledAmount = 0
    let wantedReturn = 0
    if(this.selectedOption!.name == 'Verse') {
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      scaledAmount = Math.floor(amount * ps.platform.verse_decimals)
      wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.algoLiquidity, this.blockchainInfo.tokenLiquidity)
    } else {
      this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.deployedAppSettings!.contract_id!)
      scaledAmount = Math.floor(amount * this.deployedAppSettings!.decimals)
      wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.algoLiquidity, this.blockchainInfo.tokenLiquidity)
      await this.deployedApp.sell(wallet, scaledAmount, this.slippage, wantedReturn, this.deployedAppSettings!)
    }
  }

  pow(decimals: number){
    return Math.pow(10, decimals)
  }

  getMaxBuy(){
    if( this.selectedOption!.maxBuy >= Number.MAX_SAFE_INTEGER ){
      return "-"
    } else {
      return (this.selectedOption!.maxBuy / Math.pow(10, this.selectedOption!.decimals)).toFixed(2)
    }
  }

  handleCheckboxUpdateSecond($event: boolean) {
    
  }

  removeVerse(arr: AssetViewModel[]){
    arr.forEach( (item, index) => {
      if(item.assetId === ps.platform.verse_asset_id) arr.splice(index,1);
    });
 }

}
