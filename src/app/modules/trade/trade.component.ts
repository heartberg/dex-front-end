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
import { AssetViewModel } from 'src/app/models/assetViewModel';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import {SessionWallet, Wallet} from 'algorand-session-wallet';
import { env } from 'process';
import { TokenEntryViewModel } from 'src/app/models/tokenEntryViewModel';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import { min } from 'rxjs/operators';
import { ThisReceiver } from '@angular/compiler';
import { SmartToolData } from 'src/app/shared/pop-up/component/pop-up.component';
import { isOptinAsset } from 'src/app/services/utils.algo';
import { StakingUtils } from 'src/app/blockchain/staking';


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
  minOutput: number = 0;
  priceImapct: number = 0;
  spotPrice: number = 0;

  // my
  assetArr: AssetViewModel[] = [];
  assetArrSecond: AssetViewModel[] = [];

  selectedOption: AssetViewModel | undefined;

  isOptedIn: boolean = true;
  isShowAll: boolean = true;
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

  isBuy: boolean = true;

  blockchainInfo: BlockchainInformation | undefined;
  deployedAppSettings: DeployedAppSettings | undefined;

  buysAndSells: TokenEntryViewModel[] | undefined;
  // your transactions
  chechboxHandler: number = 1;
  transactionChecker: boolean = false;
  // your transactions

  topInput: number = 0;
  bottomInput: number = 0;

  // trade popup situations
  isTradeLend: boolean = false;
  isTradeBacking: boolean = false;
  isTradeLendVerse: boolean = false;
  isTradeBackingVerse: boolean = false;
  // trade popup situations

  calcWithFees = false;
  // @ts-ignore
  enteredValueTop: number | string = 'default';
  enteredValue: number | string = 'default';

  smartToolData: SmartToolData = {
    assetDecimals: 0,
    availableTokenAmount: 0,
    availableAlgoAmount: 0,
    contractId: 0,
    userBorrowed: 0,
    userSupplied: 0,
    totalBacking: 0,
    totalBorrowed: 0,
    totalSupply: 0,
    optedIn: true,
    name: "",
    unitName: ""
  };

  constructor(
    private assetReqService: AssetReqService,
    private walletService: WalletsConnectService,
    private fb: FormBuilder,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp,
    private stakingUtils: StakingUtils
  ) {}

  // FORMS

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
    topInputValue: [0, Validators.pattern('[0-9]+[.,]?[0-9]*')],
  });

  bottomForms = this.fb.group({
    bottomInputValue: [0, Validators.pattern('[0-9]+[.,]?[0-9]*')],
  });

  // FORMS

  async ngOnInit(): Promise<void> {
    if (this.slippageForm.get('slippageCheckBox')?.value) {
      this.slippageForm.get('slippageInput')?.disable();
    }

    // this.assetArr.push(await this.verseApp.getViewModel())
    this.assetArr.push(ALGO_VIEWMODEL)
    // this.assetArrSecond.push(await this.verseApp.getViewModel())
    this.assetArrSecond.push(ALGO_VIEWMODEL)
    // this.blockchainInfo = await this.verseApp.getBlockchainInformation()

    let wallet = localStorage.getItem('wallet')!;
    if(!wallet){
      wallet = "default"
    }
    this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
      // this.removeVerse(res);
      // res = this.removeFailedPresales(res);
      this.assetArr.push(...res);
      this.assetArrSecond.push(...res);
    });

    this.selectedOption = this.assetArr[0]
    await this.selectAsset(this.assetArr[1].assetId);

    // this.assetArrSecond.push(await this.verseApp.getViewModel())

    // this.slippageForm.get("slippageInput")!.valueChanges.subscribe(
    //   (input: any) => {
    //     if(input != null){
    //       this.slippage = input * 100;
    //     } else {
    //       this.getAutoSlippage();
    //     }
    //     this.setMinOutput();
    //   }
    // );
  }

  catchValueTop($event: any) {
    let input = this.topForms.value.topInputValue;
    console.log(input);
    if(!this.rotate){
      // @ts-ignore
      this.topInput = +this.topForms.value.topInputValue;
      // let output = this.calcOtherFieldOutput(true);
      // this.bottomForms.get("bottomInputValue")!.setValue(output);
    } else {
      // @ts-ignore
      this.bottomInput = +this.topForms.value.topInputValue;
      // let output = this.calcOtherFieldOutput(false);
      // this.bottomForms.get("bottomInputValue")!.setValue(output)
    }
    this.calcPriceImpact()
    this.setMinOutput()
  }

  catchValueBottom($event: Event) {
    if(!this.rotate){
      // @ts-ignore
      this.bottomInput = +this.bottomForms.value.bottomInputValue;
      // let output = this.calcOtherFieldOutput(false);
      // this.topForms.get("topInputValue")!.setValue(output);
    } else {
      // @ts-ignore
      this.topInput = +this.bottomForms.value.bottomInputValue;
      // let output = this.calcOtherFieldOutput(true);
      // this.topForms.get("topInputValue")!.setValue(output);
    }
    // this.calcPriceImpact()
    // this.setMinOutput()
  }

  // removeFailedPresales(res: AssetViewModel[]) {
  //   let output: AssetViewModel[] = []
  //   res.forEach(async model => {
  //     if(!await this.deployedApp.isFailedPresale(model.contractId)){
  //       output.push(model)
  //     }
  //   });
  //   return output
  // }

  makeReverse() {
    this.rotate = !this.rotate;
    this.isBuy = !this.isBuy;
    // this.updateHoldingOfSelectedAsset();
    if(this.autoSlippage){
      // this.getAutoSlippage();
    }
    this.topForms.get("topInputValue")?.setValue(this.topForms.get("topInputValue")?.value);
    this.bottomForms.get("bottomInputValue")?.setValue(this.bottomForms.get("bottomInputValue")?.value);
    this.calcPriceImpact()
    this.setMinOutput()
  }

  onUserInput() {
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
        // this.removeVerse(res);
        // res = this.removeFailedPresales(res);
        // this.assetArr.push(await this.verseApp.getViewModel())
        this.assetArr.push(ALGO_VIEWMODEL)
        this.assetArr.push(...res);
      });
    } else if (event === false) {
      this.assetArr = []
      this.assetArr.push(await this.verseApp.getViewModel())
      this.assetArr.push(ALGO_VIEWMODEL)
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
        // this.removeVerse(res)
        // res = this.removeFailedPresales(res);
        this.assetArr.push(...res);
      });
    }
  }

  async handleCheckboxUpdateSecond(event: boolean) {
    this.checkedSecond = event;
    const wallet = localStorage.getItem('wallet')!;
    if (event === true) {
      this.assetReqService.getAssetPairs(true, '', wallet).subscribe(async (res) => {
        this.assetArrSecond = [];
        // this.removeVerse(res);
        // res = this.removeFailedPresales(res);
        // this.assetArrSecond.push(await this.verseApp.getViewModel())
        this.assetArrSecond.push(ALGO_VIEWMODEL)
        // this.blockchainInfo = await this.verseApp.getBlockchainInformation()
        this.assetArrSecond.push(...res);
        // TODO uncomment for prod
        console.log(res, 'data');
        // this.assetArrSecond.push(this.dummyAlgo);
        // this.removeVerse(res);
      });
    } else if (event === false) {
      this.assetArrSecond = [];
      // this.assetArrSecond.push(await this.verseApp.getViewModel())
      this.assetArrSecond.push(ALGO_VIEWMODEL)
      // this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
        this.removeVerse(res)
        // res = this.removeFailedPresales(res);
        this.assetArrSecond.push(...res);
        // this.assetArrSecond.push(this.dummyAlgo);
        this.selectAsset(this.assetArr[0].assetId)
      });
    }
  }

  async selectAsset(assetId: number) {
    //console.log(assetId)
    const wallet = localStorage.getItem('wallet')!;
    if(assetId == 0){
      if(wallet){
        let client: Algodv2 = getAlgodClient();
        let accInfo = await client.accountInformation(wallet).do();
        //console.log(accInfo);
        if(this.isBuy){
          this.availAmount = accInfo['amount'] / 1_000_000;
        }
      } else {
        this.availAmount = 0;
        this.isOptedIn = true;
      }
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
    }
    this.getAllBuysAndSells()
    this.getPrice()
    this.updateHoldingOfSelectedAsset()
    if(this.autoSlippage){
      this.getAutoSlippage()
    }
    console.log("spotprice: " + this.spotPrice)
    this.calcPriceImpact()
    this.setMinOutput()
    console.log("spotprice: " + this.spotPrice)
    console.log(this.selectedOption)
    console.log(this.blockchainInfo)
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
    this.getAutoSlippage();
    if (!slippageBox?.value) {
      slippageInput?.setValue(this.slippage / 100);
      slippageInput?.enable();
      this.autoSlippage = false;
    } else if (slippageBox.value) {
      slippageInput?.disable();
      slippageInput?.setValue(null);
      this.autoSlippage = true;
    }
    this.setMinOutput()
  }

  async openPopUp() {
    await this.getSmartToolData()
    this.isPopUpOpen = true;
  }

  closePopUp(event: boolean) {
    this.isPopUpOpen = event;
    this.updateBlockchainInfo()
    this.updateHoldingOfSelectedAsset()
    this.getSmartToolData()
  }

  async getValueFromDropDown($event: any, index: number) {
    if ($event === 'Verse' && index === 1) {
      this.isTradeLendVerse = true;
      this.isTradeBackingVerse = false;
    } else if ($event !== 'Verse' && index === 1) {
      this.isTradeLend = true;
      this.isTradeBacking = false;
    }
    else
    if ($event !== 'Algo' && index === 1) {
      this.changeBottom = true;
      this.changeTop = false;
      if(!this.rotate){
        this.isBuy = false;
      } else {
        this.isBuy = true;
      }
    }
    // second check
    if ($event !== 'Algo' && index === 2) {
      this.changeTop = true;
      this.changeBottom = false;
      if(!this.rotate){
        this.isBuy = true;
      } else {
        this.isBuy= false;
      }
    }
    if ($event === 'Algo' && index === 1) {
      this.changeTop = true;
      this.changeBottom = false;
      if(!this.rotate){
        this.isBuy = true;
      } else {
        this.isBuy = false;
      }
    } else if ($event === 'Algo' && index === 2) {
      this.changeBottom = true;
      this.changeTop = false;
      if(!this.rotate){
        this.isBuy = false;
      } else {
        this.isBuy = true;
      }
    }
    if($event != 'Algo') {
      let asset = this.assetArr.find((el) => {
        return el.name === $event;
      });
      console.log("event: " + $event)
      this.selectAsset(asset!.assetId);
    } else {
      this.selectAsset(0);
    }
    console.log("getValueFromDropDown: " + $event + " index: " + index + " isBuy: " + this.isBuy)
  }

  getPercentOfButton(index: number) {
    this.isClickedOnBtn = true;
    if (index === 1) {
      this.btnFirst = true;
      this.btnSecond = false;
      this.btnThird = false;
      this.btnFourth = false;
      if(!this.rotate){
        this.topForms.get("topInputValue")!.setValue(this.availAmount / 4);
      } else {
        this.bottomForms.get("bottomInputValue")!.setValue(this.availAmount / 4);
      }
    } else if (index === 2) {
      this.btnSecond = true;
      this.btnFirst = false;
      this.btnThird = false;
      this.btnFourth = false;
      if(!this.rotate){
        this.topForms.get("topInputValue")!.setValue(this.availAmount / 2);
      } else {
        this.bottomForms.get("bottomInputValue")!.setValue(this.availAmount / 2);
      }
    } else if (index === 3) {
      this.btnThird = true;
      this.btnFirst = false;
      this.btnSecond = false;
      this.btnFourth = false;
      if(!this.rotate){
        this.topForms.get("topInputValue")!.setValue(this.availAmount / 4 * 3);
      } else {
        this.bottomForms.get("bottomInputValue")!.setValue(this.availAmount / 4 * 3);
      }
    } else if (index === 4) {
      this.btnFourth = true;
      this.btnFirst = false;
      this.btnSecond = false;
      this.btnThird = false;
      if(!this.rotate){
        this.topForms.get("topInputValue")!.setValue(this.availAmount);
      } else {
        this.bottomForms.get("bottomInputValue")!.setValue(this.availAmount);
      }
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

  async updateHoldingOfSelectedAsset() {
    let assetId = this.selectedOption!.assetId
    const wallet = localStorage.getItem('wallet')!;
    if(wallet){
      let client: Algodv2 = getAlgodClient()
      let accountInfo = await client.accountInformation(wallet).do()
      let asset = accountInfo['assets'].find((el: any) => {
        return el['asset-id'] == assetId
      })
      if(!this.isBuy){
        if(asset != null){
          this.availAmount = asset['amount'] / Math.pow(10, this.selectedOption!.decimals)
          this.isOptedIn = true
        } else {
          this.availAmount = 0
          this.isOptedIn = false
        }
      } else {
        this.availAmount = accountInfo['amount'] / 1_000_000;
        if(asset != null){
          this.isOptedIn = true;
        } else {
          this.isOptedIn = false;
        }
      }
    } else {
      this.availAmount = 0
      this.isOptedIn = true
    }
  }

  async optInAsset() {
    const wallet = this.walletService.sessionWallet;
    if(wallet){
      if(this.selectedOption?.name == 'Verse'){
        let response = await this.verseApp.optInAsset(wallet)
        if(response) {
          this.isOptedIn = true
        }
      } else {
        let response = await this.deployedApp.optInAsset(wallet, this.selectedOption!.assetId)
        if(response){
          this.isOptedIn = true
        }
      }
    }
  }

  getAutoSlippage() {
    let accumulatedFees = this.selectedOption!.backing + +environment.Y_FEE! * 10000
    //console.log(accumulatedFees)
    if(this.isBuy){
      accumulatedFees += this.selectedOption!.buyBurn
    } else{
      accumulatedFees += this.selectedOption!.sellBurn + this.selectedOption!.risingPriceFloor
    }

    if (this.selectedOption!.assetId != ps.platform.verse_asset_id){
      accumulatedFees += +environment.VERSE_FEE!
    }
    // + 200 to give an extra 2% for slippage
    this.slippage = accumulatedFees + 200
  }

  calcOtherFieldOutput(inputTop: boolean) {
    // console.log("top: " + inputTop + " isbuy: " + this.isBuy + " spot: " + this.spotPrice);
    let output = 0;

    if(this.isBuy){
      if(inputTop){
        output = 1 / this.spotPrice * this.topInput;
      } else {
        output = this.spotPrice * this.bottomInput;
      }
    } else {
      if(inputTop){
        output = this.spotPrice * this.topInput;
      } else {
        output = 1 / this.spotPrice * this.bottomInput;
      }
    }
    // console.log(output)
    return output
  }

  calcDesiredOutput(amountToBuy:number, liqA: number, liqB: number) {
    let price = liqA / liqB
    return Math.floor(amountToBuy * price)
  }

  setMinOutput(){
    let desiredOutput = 0
    if (this.isBuy){
      desiredOutput = 1 / this.spotPrice * this.topInput
    } else {
      desiredOutput = this.spotPrice * this.topInput
    }
    let output = desiredOutput - (desiredOutput * this.slippage / 10000)
    this.minOutput = output
  }

  async getPrice() {
    let diff = 0
    let price = this.blockchainInfo!.algoLiquidity / this.blockchainInfo!.tokenLiquidity
    if(this.selectedOption!.decimals > 6) {
      diff = this.selectedOption!.decimals - 6
      price = price * Math.pow(10, diff)

    } else if(this.selectedOption!.decimals < 6) {
      diff = 6 - this.selectedOption!.decimals
      price = price / Math.pow(10, diff)
    }
    this.spotPrice = price
  }

  calcPriceImpact(){
    let tokenLiq = this.blockchainInfo!.tokenLiquidity;
    let algoLiq = this.blockchainInfo!.algoLiquidity;
    let amount = this.topInput;
    let diff = 0;

    if(this.isBuy){
      let price = this.spotPrice;
      let buyAmount = Math.floor(1 / price * amount * Math.pow(10, this.selectedOption!.decimals));
      let newAlgoLiq = algoLiq + amount * Math.pow(10, 6);
      let newTokenLiq = tokenLiq - buyAmount;
      // console.log("new algo: " + newAlgoLiq + " new token: " + newTokenLiq)
      let newPrice = newAlgoLiq / newTokenLiq;
      if(this.selectedOption!.decimals > 6) {
        diff = this.selectedOption!.decimals - 6
        newPrice = newPrice * Math.pow(10, diff)
      } else if(this.selectedOption!.decimals < 6) {
        diff = 6 - this.selectedOption!.decimals
        newPrice = newPrice / Math.pow(10, diff)
      }
      if(amount * Math.pow(10, 6) > algoLiq) {
        this.priceImapct = Number.POSITIVE_INFINITY
      } else {
        this.priceImapct = (newPrice / price) * 100 - 100
      }
    } else {
      let price = this.spotPrice;
      let algoReturnAmount = Math.floor(price * amount * Math.pow(10, 6));
      let newAlgoLiq = algoLiq - algoReturnAmount;
      let newTokenLiq = tokenLiq + amount * this.selectedOption!.decimals;
      let newPrice = newAlgoLiq / newTokenLiq;

      if(this.selectedOption!.decimals > 6) {
        diff = this.selectedOption!.decimals - 6
        newPrice = newPrice * Math.pow(10, diff)
      } else if(this.selectedOption!.decimals < 6) {
        diff = 6 - this.selectedOption!.decimals
        newPrice = newPrice / Math.pow(10, diff)
      }
      if(newAlgoLiq < 0) {
        this.priceImapct = Number.NEGATIVE_INFINITY
      } else {
        this.priceImapct = (1 - newPrice / price) * 100
      }
    }
  }

  async buy(wallet: SessionWallet, amount: number){
    if(this.selectedOption!.assetId == ps.platform.verse_asset_id) {
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
    } else {
      this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.deployedAppSettings!.contract_id!)
    }

    let scaledAmount = Math.floor(amount * 1_000_000)
    let wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.tokenLiquidity, this.blockchainInfo.algoLiquidity)
    if(this.selectedOption!.assetId == ps.platform.verse_asset_id) {
      let response = await this.verseApp.buy(wallet, scaledAmount, this.slippage, wantedReturn)
      return response
    } else {
      let response = await this.deployedApp.buy(wallet, scaledAmount, this.slippage, wantedReturn, this.deployedAppSettings!)
      return response
    }
  }

  async sell(wallet: SessionWallet, amount: number){
    let scaledAmount = 0
    let wantedReturn = 0
    if(this.selectedOption!.assetId == ps.platform.verse_asset_id) {
      // maybe delete this to make it use current prices / shown prices? (more transparent and user friendly)
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      scaledAmount = Math.floor(amount * Math.pow(10, ps.platform.verse_decimals))
      wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.algoLiquidity, this.blockchainInfo.tokenLiquidity)
      let response = await this.verseApp.sell(wallet, scaledAmount, this.slippage, wantedReturn)
      return response;
    } else {
      // same same here
      this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.deployedAppSettings!.contract_id!)
      scaledAmount = Math.floor(amount * Math.pow(10, this.deployedAppSettings!.decimals))
      wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.algoLiquidity, this.blockchainInfo.tokenLiquidity)
      let response = await this.deployedApp.sell(wallet, scaledAmount, this.slippage, wantedReturn, this.deployedAppSettings!)
      return response;
    }
  }

  pow(decimals: number){
    return Math.pow(10, decimals)
  }

  getMaxBuy(){
    if( this.blockchainInfo!.maxBuy >= Number.MAX_SAFE_INTEGER){
      return "-"
    } else {
      return (this.blockchainInfo!.maxBuy / Math.pow(10, 6)).toFixed(2)
    }
  }

  removeVerse(arr: AssetViewModel[]){
    arr.forEach( (item, index) => {
      if(item.assetId === ps.platform.verse_asset_id) arr.splice(index,1);
    });
  }
  // swap && optIn
  async swap() {
    const wallet = this.walletService.sessionWallet;
    console.log(this.isBuy)
    if(wallet){
      if (this.isBuy) {
        let response = await this.buy(wallet, this.topInput)
        if(response){
          //if(response['confirmed' ??? ]){}
          let tokenEntryViewModel: TokenEntryViewModel = {
            tokenAmount: this.bottomInput * Math.pow(10, this.selectedOption!.decimals),
            algoAmount: this.topInput * Math.pow(10, 6),
            assetId: this.selectedOption!.assetId,
            buy: true,
            price: this.spotPrice,
            userWallet: wallet.getDefaultAccount(),
            date: 0
          }
          this.assetReqService.postBuy(tokenEntryViewModel).subscribe(
            (value: any) => {
              this.getAllBuysAndSells()
            }
          );
        }
      } else {
        // sell
        let response = await this.sell(wallet, this.topInput)
        if(response){
          let tokenEntryViewModel: TokenEntryViewModel = {
            tokenAmount: this.topInput * Math.pow(10, this.selectedOption!.decimals),
            algoAmount: this.bottomInput * Math.pow(10, 6),
            assetId: this.selectedOption!.assetId,
            buy: false,
            price: this.spotPrice,
            userWallet: wallet.getDefaultAccount(),
            date: 0
          }
          this.assetReqService.postSell(tokenEntryViewModel).subscribe(
            (value: any) => {
              this.getAllBuysAndSells()
            }
          );
        }
      }
      await this.updateBlockchainInfo()
      this.updateHoldingOfSelectedAsset()
      this.getPrice()
      this.emptyInputs()
      this.calcPriceImpact()
      this.getSmartToolData()
    }
  }

  emptyInputs(){
    this.topForms.get("topInputValue")?.setValue(0)
    this.bottomForms.get("bottomInputValue")?.setValue(0);
    this.topInput = 0;
    this.bottomInput = 0;
  }

  getAllBuysAndSells(){
    this.buysAndSells = []
    if(!this.transactionChecker) {
      this.assetReqService.getAllEntries(this.selectedOption!.assetId).subscribe(
        (res) => {
          console.log(res)
          this.buysAndSells = res
        }
      )
    } else {
      const wallet = localStorage.getItem('wallet')!
      if(wallet){
        this.assetReqService.getAllEntriesForWallet(wallet, this.selectedOption!.assetId).subscribe(
          (res) => {
            //console.log(res)
            this.buysAndSells = res
          }
        )
      }
    }
  }

  handleCheckBox() {
    this.chechboxHandler ++;
    if (this.chechboxHandler % 2 === 0) {
      this.transactionChecker = true;

    } else {
      this.transactionChecker = false;
    }
    this.getAllBuysAndSells()
  }

  toDate(date: number): string{
    let now = Math.floor(new Date().getTime() / 1000)

    // get total seconds between the times
    var delta = Math.abs(now - date);

    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    // what's left is seconds
    var seconds = delta % 60;

    if(days > 0) {
      if(days == 1){
        return days.toString() + " day ago";
      } else {
        return days.toString() + " days ago";
      }
    } else if(hours > 0) {
      if(hours == 1) {
        return hours.toString() + " hour ago";
      } else {
        return hours.toString() + "hours ago";
      }
    } else if(minutes > 0) {
      if(minutes == 1){
        return "a minute ago"
      } else {
        return minutes.toString() + " minutes ago"
      }
    } else {
      return "Some seconds ago"
    }
  }

  async updateBlockchainInfo() {
    if(this.selectedOption!.assetId == ps.platform.verse_asset_id){
      this.blockchainInfo = await this.verseApp.getBlockchainInformation();
    } else {
      this.blockchainInfo = await this.deployedApp.getBlockchainInformation(this.selectedOption!.contractId);
    }
  }

  async getSmartToolData() {
    let address = localStorage.getItem("wallet")
    if(this.selectedOption!.contractId != ps.platform.verse_app_id){
      console.log("deployer app")
      this.smartToolData = await this.deployedApp.getSmartToolData(this.selectedOption!.contractId, address);
    } else {
      this.smartToolData = await this.stakingUtils.getVerseSmartToolData(address)
    }
    console.log(this.smartToolData)
  }

  searchTop(event: any) {
    // let wallet = localStorage.getItem('wallet');
    // this.assetReqService.getAssetPairs(true, event, wallet!).subscribe((res) => {
    //   this.removeVerse(res); // ask
    //   res = this.removeFailedPresales(res); // ask
    //   this.assetArr.push(...res);
    // });
  }

  searchBottom(event: any) {
    // let wallet = localStorage.getItem('wallet');
    // this.assetReqService.getAssetPairs(true, event, wallet!).subscribe((res) => {
    //   this.removeVerse(res); // ask
    //   res = this.removeFailedPresales(res); // ask
    //   this.assetArrSecond.push(...res);
    // });
  }
}
