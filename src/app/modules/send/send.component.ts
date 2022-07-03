import {Component, DoCheck, OnInit} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SessionWallet } from 'algorand-session-wallet';
import { Algodv2, isValidAddress } from 'algosdk';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { getAlgodClient, isOptedIntoAsset } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { AssetViewModel } from 'src/app/models/assetViewModel';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
})
export class SendComponent implements OnInit, DoCheck {
  addressNotOptedIn: boolean = false;
  invalidAddress: boolean = false;
  walletUsual = localStorage.getItem('wallet')
  wallet: SessionWallet | undefined;
  tokens: AssetViewModel[] = []
  accInfo: Record<string, any> | undefined;
  selectedOption: AssetViewModel |undefined;
  availableBalance: number = 0;
  showAll: boolean = false;


  //
  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;
  closePopup: boolean = false;
  //

  constructor(
    private fb: FormBuilder,
    private assetService: AssetReqService,
    private walletService: WalletsConnectService,
    private app: DeployedApp,
    private verseApp: VerseApp
  ) {
    this.wallet = this.walletService.sessionWallet;
  }

  sendForm = this.fb.group({
    sendInput: [0,],
    addressInput: [],
  });

  sendNotValid: boolean = false;

  ngDoCheck() {
    if(localStorage.getItem('sendWaitSuccess') === 'pending') {
      this.closePopup = true;
      this.isPending = true;
      this.isFailed = false;
      this.finalStepApi = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'fail') {
      this.closePopup = true;
      this.isFailed = true;
      this.finalStepApi = false;
      this.isPending = false;
    } else if (localStorage.getItem('sendWaitSuccess') === 'success') {
      this.closePopup = true;
      this.finalStepApi = true;
      this.isFailed = false;
      this.isPending = false;
    }
    // if (this.sendForm.get('sendInput')?.value) {
    //   this.sendForm.get('sendInput')?.value.valueChanges.subscribe( (res: any) => {
    //     if (this.invalidAddress === true || this.addressNotOptedIn === true || this.sendForm.get('sendInput')?.value > this.availableBalance) {
    //       this.sendNotValid = true;
    //     } else  {
    //       this.sendNotValid = false;
    //     }
    //   })
    // }

  }

  onSubmit() {
    console.log(this.sendForm.value);
    let amount = Math.floor(this.sendForm.get("sendInput")!.value * Math.pow(10, this.selectedOption!.decimals))
    if(this.selectedOption!.assetId == ps.platform.verse_asset_id){
      this.verseApp.transfer(this.wallet!, amount, this.sendForm.get("addressInput")?.value)
    } else {
      this.app.transfer(this.wallet!, amount,
        this.sendForm.get("addressInput")!.value,
        this.selectedOption!.assetId, this.selectedOption!.smartProperties!.contractId
      );
    }

    this.sendForm.reset();
  }

  async getAccInfo() {
    let client: Algodv2 = getAlgodClient()
    const wallet = localStorage.getItem("wallet");
    return await client.accountInformation(wallet!).do();
  }

  handleCheckboxUpdateSecond(event: boolean) {
    this.tokens = []
    if (event === true) {
      this.showAll = true;
      this.assetService.getAssetPairs(this.showAll, '', this.walletUsual!).subscribe(async (res) => {
        this.removeVerse(res);
        this.tokens.push(await this.verseApp.getViewModel())
        this.tokens.push(...res);
        this.selectAsset(this.tokens[0]);
      });
    } else if (event === false) {
      this.showAll = false;
      this.assetService.getAssetPairs(this.showAll, '', this.walletUsual!).subscribe(async (res) => {
        // TODO uncomment for prod
        this.removeVerse(res);
        this.tokens.push(await this.verseApp.getViewModel())
        this.tokens.push(...res);
        this.selectAsset(this.tokens[0]);
      });
    }
  }

  getValueFromDropDown(event: string, number: number) {
    console.log(event)
    let selectedAsset = this.tokens.find((el) => {
      return el.name == event
    })
    console.log(selectedAsset)
    if(selectedAsset){
      this.selectAsset(selectedAsset);
    }
  }

  async ngOnInit() {
    let wallet = localStorage.getItem("wallet")
    if(!wallet){
      wallet = "default";
    }
    this.tokens.push(await this.verseApp.getViewModel())
    setTimeout(() => {
      this.selectAsset(this.tokens[0]);
    }, 500)
    this.assetService.getAssetPairs(false, '', wallet!).subscribe(
      async (res) => {
        this.removeVerse(res);
        this.tokens.push(...res);
      }
    );

    console.log(this.tokens);

    this.sendForm.get("addressInput")!.valueChanges.subscribe(
      async x => {
        console.log(x)
        if(x){
          if(x.length != 58){
            this.invalidAddress = true;
          } else {
            if(isValidAddress(x)){
              if(!await isOptedIntoAsset(x, this.selectedOption!.assetId)){
                this.addressNotOptedIn = true;
              } else {
                this.addressNotOptedIn = false;
              }
              this.invalidAddress = false;
            } else {
              this.invalidAddress = true;
            }
          }
        }
      }
    );

  }

  removeVerse(arr: AssetViewModel[]){
    arr.forEach( (item, index) => {
      if(item.assetId === ps.platform.verse_asset_id) arr.splice(index,1);
    });
 }

  async selectAsset(asset: AssetViewModel) {
    this.selectedOption = asset;
    console.log("selected option:")
    console.log(this.selectedOption)
    const wallet = localStorage.getItem("wallet");
    if(wallet){
      this.accInfo = await this.getAccInfo()
      let assetInAcc = this.accInfo!['assets'].find((el: { [x: string]: number; }) => {
        return el['asset-id'] == asset.assetId
      });
      if(assetInAcc){
        this.availableBalance = assetInAcc['amount'] / Math.pow(10, asset.decimals);
      } else {
        this.availableBalance = 0;
      }
    } else {
      this.availableBalance = 0;
    }

  }
  async getSearchDropdown(event: any) {
    console.log('i ma gere')
    let wallet = localStorage.getItem("wallet")
    if(!wallet){
      wallet = "default";
    }
    if (!event.length) {
      this.tokens = []
      this.tokens.push(await this.verseApp.getViewModel())
    setTimeout(() => {
      this.selectAsset(this.tokens[0]);
    }, 500)
    this.assetService.getAssetPairs(this.showAll, '', wallet!).subscribe(
      async (res) => {
        this.removeVerse(res);
        this.tokens.push(...res);
      }
    );
    } else {
      this.assetService.getAssetPairs(this.showAll, event, wallet!).subscribe(
        async (res) => {
          this.tokens = []
          this.removeVerse(res);
          this.tokens.push(...res);
        }
      );
      console.log(this.tokens, 'aa')
    }

  }

  closePopUp(event: boolean) {
    this.closePopup = event;
  }
}
