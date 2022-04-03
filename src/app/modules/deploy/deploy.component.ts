import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
// import {DeployedApp} from "../../blockchain/deployer_application";
import {WalletsConnectService} from "../../services/wallets-connect.service";
import {DeployedApp} from "../../blockchain/deployer_application";
import { of } from 'rxjs';


@Component({
  selector: 'app-deploy',
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss']
})
export class DeployComponent implements OnInit {
  isCheckedRoadMap: boolean = false;
  isCheckedTeamInfo: boolean = false;
  extraFieldsArr: number[] = [1];
  purposeIsChecked: boolean = false;
  presaleIsChecked: boolean = false;

  walletPS = this.walletProviderService;

  constructor(
    private walletProviderService: WalletsConnectService,
    private deployerBC: DeployedApp
  ) { }

  ngOnInit(): void {
    // of(this.walletProviderService.payToSetUpIndex('ZOLXPN2IQYCDBYQMA42S2WCPJJYMQ7V3OCMEBCBQFGUEUH3ATVPFCMUYYE', 1)).subscribe(
    //   (item: any) => {
    //     console.log(item);
    //   }
    // )
    // console.log(this.walletPS.walletObj);
    this.deployerBC.settings = {
      creator: 'saba',
      // @ts-ignore
      total_supply: 9007199254740991n,
      buy_burn: 210,
      sell_burn: 123,
      transfer_burn: 123,
      to_lp: 239,
      to_backing: 20,
      max_buy: 20,
      name: 'saeee',
      unit: 'dsfm',
      decimals: 2.4,
      url: '',
      trading_start: 23405,
      initial_token_liq: 23405,
      initial_algo_liq: 23405,
      initial_algo_liq_fee: 23405,
      contract_id: 2,
      contract_address: 'sjkjd',
      asset_id: 234,
      // @ts-ignore
      presale_settings: {}
    }
  }

  @ViewChild('checkbox', { static: false})
  // @ts-ignore
  private checkbox: ElementRef;

  @ViewChild('checkboxSecond', {static: false})
  // @ts-ignore
  private checkboxSecond: ElementRef;

  @ViewChild('checkboxPurpose', {static: false})
  // @ts-ignore
  private checkboxPurpose: ElementRef;

  @ViewChild('checkPresale', {static: false})
  // @ts-ignore
  private checkPresale: ElementRef;

  imageURL: string = ''

  check() {
    if (this.checkbox.nativeElement.checked) {
      this.isCheckedRoadMap = true;
    } else {
      this.isCheckedRoadMap = false;
    }
  }

  checkSecond() {
    if (this.checkboxSecond.nativeElement.checked) {
      this.isCheckedTeamInfo = true;
    } else {
      this.isCheckedTeamInfo = false;
    }
  }

  addExtraFields(index: number) {
    if (index === 0) {
      this.extraFieldsArr.push(1);
    } else {
      this.extraFieldsArr.pop()
    }
  }

  async onSubmit() {
    let result = await this.walletProviderService.payToSetUpIndex('ZOLXPN2IQYCDBYQMA42S2WCPJJYMQ7V3OCMEBCBQFGUEUH3ATVPFCMUYYE', 1000);
    console.log(result);
    // of(this.deployerBC.deploy(this.walletPS.walletObj)).subscribe((res) => {
    //   res.then(
    //     (res) => {
    //       console.log(res);
    //     }
    //   )
    // })

    // this.deployerBC.deploy(this.walletPS.walletObj).then(
    //   (res) => {
    //     console.log(res);
    //   }
    // )

    // this.deployerBC.setupWithPresale(this.walletPS.walletObj).then(
    //   (res) => {
    //     console.log(res);
    //   }
    // )
    // this.walletProviderService.walletsjj;
  }

  activatePurposeSection() {
    if (this.checkboxPurpose.nativeElement.checked) {
      this.purposeIsChecked = true
    } else  {
      this.purposeIsChecked = false;
    }
  }

  activatePresaleSection() {
    if (this.checkPresale.nativeElement.checked) {
      this.presaleIsChecked = true;
    } else {
      this.presaleIsChecked = false;
    }
  }

  onImageUpload(event: any) {
    let imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageURL = reader.result as string;
    }
    reader.readAsDataURL(imageFile);
  }
}
