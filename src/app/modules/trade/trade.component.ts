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
import {SessionWallet, Wallet} from 'algorand-session-wallet';
import { env } from 'process';
import { TokenEntryViewModel } from 'src/app/models/tokenEntryViewModel';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';
import { min } from 'rxjs/operators';


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

  blockchainInfo: BlockchainInformation | undefined;
  deployedAppSettings: DeployedAppSettings | undefined;

  buysAndSells: TokenEntryViewModel[] | undefined;
  // your transactions
  chechboxHandler: number = 1;
  transactionChecker: boolean = false;
  // your transactions

  // rotate checker
  trackReverser: number = 1;
  // rotate checker

  topInput: number = 0;
  bottomInput: number = 0;

  constructor(
    private assetReqService: AssetReqService,
    private walletService: WalletsConnectService,
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

    let wallet = localStorage.getItem('wallet')!;
    if(!wallet){
      wallet = "default"
    }
    this.assetReqService.getAssetPairs(true, '', wallet).subscribe((res) => {
      this.removeVerse(res);
      this.assetArr.push(...res);
      this.assetArrSecond.push(...res);
    });
    this.selectAsset(this.assetArr[0].assetId);
  }

  makeReverse() {
    this.trackReverser++;
    if (this.trackReverser % 2 === 0) {
      // top input is on bottom
    } else {
      // normal statement
    }
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
        this.removeVerse(res);
        this.assetArr.push(await this.verseApp.getViewModel())
        this.assetArr.push(ALGO_VIEWMODEL)
        this.blockchainInfo = await this.verseApp.getBlockchainInformation()
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

  async handleCheckboxUpdateSecond(event: boolean) {
    this.checkedSecond = event;
    const wallet = localStorage.getItem('wallet')!;
    if (event === true) {
      this.assetReqService.getAssetPairs(true, '', wallet).subscribe(async (res) => {
        this.assetArrSecond = [];
        this.removeVerse(res);
        this.assetArrSecond.push(await this.verseApp.getViewModel())
        this.assetArrSecond.push(ALGO_VIEWMODEL)
        this.blockchainInfo = await this.verseApp.getBlockchainInformation()
        this.assetArrSecond.push(...res);
        // TODO uncomment for prod
        // console.log(res, 'data');
        // this.assetArrSecond.push(this.dummyAlgo);
        // this.removeVerse(res);
      });
    } else if (event === false) {
      this.assetArrSecond = [];
      this.assetArrSecond.push(await this.verseApp.getViewModel())
      this.assetArrSecond.push(ALGO_VIEWMODEL)
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      const wallet = localStorage.getItem('wallet')!;
      this.assetReqService.getAssetPairs(false, '', wallet).subscribe((res) => {
        // this.removeVerse(res)
        // TODO uncomment for prod
        this.removeVerse(res)
        // this.assetArrSecond.push(this.dummyAlgo);
        this.assetArrSecond.push(...res);
        this.selectAsset(this.assetArr[0].assetId)
      });
    }
  }

  dropdownSelected(value: string, index: number) {
    if (index === 1) {
      if (value === 'Algo') {
        this.selectAsset(0)
        // console.log("Show Verse on bottom")
      } else {
        // console.log("Show Algo on bottom")
      }
    } else if (index === 2) {
      if (value === 'Algo') {
        // console.log("Show Verse on top")
      } else {
        // console.log("Show Algo on top")
        this.calcPriceImpact(true)
      }
    }

  }

  async selectAsset(assetId: number) {
    console.log(assetId)
    const wallet = localStorage.getItem('wallet')!;
    if(assetId == 0){
      if(wallet){
        let client: Algodv2 = getAlgodClient();
        let accInfo = await client.accountInformation(wallet).do();
        console.log(accInfo);
        this.availAmount = accInfo['amount'] / 1_000_000;
        this.isOptedIn = true;
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
      this.getAllBuysAndSells()
      this.getPrice()
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
    if ($event !== 'Algo' && index === 1) {
      this.changeBottom = true;
      this.changeTop = false;
      // sell
    }
    // second check
    if ($event !== 'Algo' && index === 2) {
      this.changeTop = true;
      this.changeBottom = false;
      // buy
    }
    if ($event === 'Algo' && index === 1) {
      this.changeTop = true;
      this.changeBottom = false;
      // console.log('pirveli unda sheicvalos')
    } else if ($event === 'Algo' && index === 2) {
      this.changeBottom = true;
      this.changeTop = false;
      // console.log('meore unda sheicvalos', this.changeBottom, this.changeTop)
    }
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
    if(wallet){
      let accountInfo = await client.accountInformation(wallet).do()
      let asset = accountInfo['assets'].find((el: any) => {
        return el['asset-id'] == assetId
      })
      if(asset != null){
        let assetInfo = await client.getAssetByID(assetId).do()
        this.availAmount = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
        this.isOptedIn = true
      } else {
        this.availAmount = 0
        this.isOptedIn = false
      }
    } else {
      this.availAmount = 0
      this.isOptedIn = true
    }


  }

  optInAsset() {
    const wallet = this.walletService.sessionWallet;
    if(wallet){
      if(this.selectedOption?.name == 'Verse'){
        this.verseApp.optInAsset(wallet)
      } else {
        this.deployedApp.optInAsset(wallet, this.selectedOption!.assetId)
      }
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
    // + 200 to give an extra 2% for slippage
    this.slippage = accumulatedFees + 200
  }

  calcDesiredOutput(amountToBuy:number, liqA: number, liqB: number) {
    return amountToBuy * liqA / liqB
  }

  setMinOutput(desiredOutput: number, slippage: number){
    let output = desiredOutput - (desiredOutput * slippage / 10000)
    this.minOutput = output
  }

  calcPriceImpact(buy: boolean){
    let tokenLiq = this.blockchainInfo!.tokenLiquidity;
    let algoLiq = this.blockchainInfo!.algoLiquidity;
    let amount = this.topForms.get("topInput")!.value;
    console.log(amount)

    if(buy){
      let price = algoLiq / tokenLiq;
      let buyAmount = price * amount;
      let newAlgoLiq = algoLiq + amount;
      let newTokenLiq = tokenLiq - buyAmount;
      let newPrice = newAlgoLiq / newTokenLiq;
      this.priceImapct = newPrice / price * 100
      console.log(this.priceImapct)
    } else {
      let price = tokenLiq / algoLiq;
      let sellAmount = price * amount;
      let newAlgoLiq = algoLiq - sellAmount;
      let newTokenLiq = tokenLiq + amount;
      let newPrice = newAlgoLiq / newTokenLiq;
      this.priceImapct = (1 - newPrice / price) * 100
      console.log(this.priceImapct)
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
    console.log(this.deployedAppSettings)
    await this.deployedApp.buy(wallet, scaledAmount, this.slippage, wantedReturn, this.deployedAppSettings!)
  }

  async sell(wallet: SessionWallet, amount: number){
    let scaledAmount = 0
    let wantedReturn = 0
    if(this.selectedOption!.name == 'Verse') {
      this.blockchainInfo = await this.verseApp.getBlockchainInformation()
      scaledAmount = Math.floor(amount * ps.platform.verse_decimals)
      wantedReturn = this.calcDesiredOutput(scaledAmount, this.blockchainInfo.algoLiquidity, this.blockchainInfo.tokenLiquidity)
      await this.verseApp.sell(wallet, scaledAmount, this.slippage, wantedReturn)
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

  removeVerse(arr: AssetViewModel[]){
    arr.forEach( (item, index) => {
      if(item.assetId === ps.platform.verse_asset_id) arr.splice(index,1);
    });
 }
  // swap && optIn
  async swap() {
    console.log(this.changeTop, this.changeBottom);
    const wallet = this.walletService.sessionWallet;
    if(wallet){
      if (this.changeTop) {
        await this.buy(wallet, this.topInput)
        let tokenEntryViewModel: TokenEntryViewModel = {
          tokenAmount: this.bottomInput,
          algoAmount: this.topInput,
          assetId: this.selectedOption!.assetId,
          buy: true,
          price: this.spotPrice,
          userWallet: wallet.getDefaultAccount(),
          date: 0
        }
        this.assetReqService.postBuy(tokenEntryViewModel);
        console.log('buy')
      } else {
        // sell
        await this.sell(wallet, this.topInput)
        console.log('sell')
        let tokenEntryViewModel: TokenEntryViewModel = {
          tokenAmount: this.topInput,
          algoAmount: this.bottomInput,
          assetId: this.selectedOption!.assetId,
          buy: false,
          price: this.spotPrice,
          userWallet: wallet.getDefaultAccount(),
          date: 0
        }
        this.assetReqService.postSell(tokenEntryViewModel);
      }
    }
  }

  getPrice() {
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
            console.log(res)
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
    } else if(seconds > 0) {
      return "Some seconds ago"
    } else {
      return "Some time ago"
    }
  }
}
