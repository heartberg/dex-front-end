import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SessionWallet } from 'algorand-session-wallet';
import { Algodv2, isValidAddress } from 'algosdk';
import { getAlgodClient, isOptedIntoAsset } from 'src/app/blockchain/algorand';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { AssetReqService } from 'src/app/services/APIs/assets-req.service';
import { WalletsConnectService } from 'src/app/services/wallets-connect.service';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
})
export class SendComponent implements OnInit {
  addressNotOptedIn: boolean = false;
  invalidAddress: boolean = false;
  wallet: SessionWallet | undefined;
  tokens: AssetViewModel[] = []
  accInfo: Record<string, any> | undefined;
  selectedOption: AssetViewModel |undefined;  
  availableBalance: number = 0;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetReqService,
    private walletService: WalletsConnectService,
    private app: DeployedApp
  ) {}

  sendForm = this.fb.group({
    sendInput: [],
    addressInput: [],
  });

  onSubmit() {
    console.log(this.sendForm.value);
    let amount = Math.floor(this.sendForm.get("sendInput")!.value * Math.pow(10, this.selectedOption!.decimals))
    this.app.transfer(this.wallet!, amount, 
      this.sendForm.get("addressInput")!.value, 
      this.selectedOption!.assetId, this.selectedOption!.contractId
    );
    this.sendForm.reset();
  }

  async getAccInfo() {
    let client: Algodv2 = getAlgodClient()
    return await client.accountInformation(this.wallet!.getDefaultAccount()).do();
  }

  async ngOnInit() {
    this.wallet = this.walletService.sessionWallet!;
    if(this.wallet) {
      this.accInfo = await this.getAccInfo()
      this.assetService.getAssetPairs(true, '', this.wallet.getDefaultAccount()).subscribe(
        (res) => {
          res.forEach(element => {
            let asset = this.accInfo!['assets'].find((el: { [x: string]: number; }) => {
              return el['asset-id'] == element.assetId
            });
            if(asset) {
              this.tokens.push(element);
              this.selectAsset(this.tokens[0]);
            }
          });
        }
      )
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
  }

  selectAsset(asset: AssetViewModel) {
    console.log("select Asset")
    this.selectedOption = asset;
    console.log(asset);
    let assetInAcc = this.accInfo!['assets'].find((el: { [x: string]: number; }) => {
      return el['asset-id'] == asset.assetId
    });
    console.log(assetInAcc)
    if(assetInAcc){
      this.availableBalance = assetInAcc['amount'] / Math.pow(10, asset.decimals);
    }
  }
}
