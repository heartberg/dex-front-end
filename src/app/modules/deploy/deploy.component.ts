import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DeployerContractService } from 'src/app/services/blockchain/deployer-contract.service';
import { Presale, ProjectViewModel, ProjectViewModelForMinit } from 'src/app/shared/class/shared.class';
import { switchMap } from 'rxjs/operators'
import {DeployedAppSettings} from "../../blockchain/platform-conf";
import {WalletsConnectService} from "../../services/wallets-connect.service";
import {environment} from "../../../environments/environment";

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
  fee = environment.Y_FEE;

  constructor(private fb: FormBuilder, private _http:DeployerContractService, private walletProviderService: WalletsConnectService) {}

  ngOnInit(): void {}
  @ViewChild('checkbox', { static: false })
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

  imageURL: string = '';

  deployFormGroup = this.fb.group({
    tokenInfoGroup: this.fb.group({
      tokenName: new FormControl('', Validators.required),
      unitName: new FormControl('', [Validators.required, Validators.minLength(8), Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]),
      totalSupply: new FormControl('', Validators.required),
      decimals: new FormControl('', Validators.required),
      url: new FormControl('', Validators.required),
      maxBuy: new FormControl('', Validators.required),
    }),
    feesGroup: this.fb.group({
      risingPriceFloor: new FormControl('', Validators.required),
      backing: new FormControl('', Validators.required),
      buyBurn: new FormControl('', Validators.required),
      sellBurn: new FormControl('', Validators.required),
      sendBurn: new FormControl('', Validators.required),
    }),
    additionalFeeOptionGroup: this.fb.group({
      addFeeCheck: this.fb.control(false),
      purpose: '',
      address: '',
      fee: '',
    }),
    presaleOptionsGroupDescription: this.fb.control(''),
    createPresaleOptionGroup: this.fb.group({
      presaleLiquidity: this.fb.group({
        tokensInPresale: '',
        tokensInLiquidity: '',
        algoToLiquidity: '',
        presaleFundsToLiquidity: '',
      }),
    }),
    liquidity: this.fb.group({
      tokensToLiq: '',
      algoToLiq: '',
    }),
    tradingStart: this.fb.control(null),
    addRoadMapOptionGroup: this.fb.group({
      roadmapDescription: '',
      roadmapImage: '',
    }),
    teamInfoOptionGroup: this.fb.array([]),
    presaleCheck: this.fb.control(false),
    roadmapCheck: this.fb.control(false),
    teamInfoCheck: this.fb.control(false),
  });

  blockchainObect: any;

  get teamInfo(){
    return this.deployFormGroup.controls['teamInfoOptionGroup'] as FormArray
  }

  submit() {
    console.log(this.blockchainObect);
    const formValue = this.deployFormGroup.value;

    const creatorWallet:any = localStorage.getItem("wallet");

    const projectDataMint = new ProjectViewModelForMinit(
      "GQ34GQ5G6HW6W57J795",
      777777,
      "5e740938-e719-4a0e-9bbb-f78dc63f94a4",
      11111,
      "UWUWUWUWUWUWUWUUWUW",
      formValue.tokenInfoGroup.tokenName,
      formValue.tokenInfoGroup.unitName,
      formValue.tokenInfoGroup.totalSupply,
      formValue.tokenInfoGroup.url,
      formValue.tokenInfoGroup.maxBuy,
      new Date(formValue.tradingStart).getTime()/1000,
      formValue.feesGroup.risingPriceFloor,
      formValue.feesGroup.backing,                                      //ობიექტი Mint
      formValue.feesGroup.buyBurn,
      formValue.feesGroup.sellBurn,
      formValue.feesGroup.sendBurn,
      null,
      null,
      "drip-coin.jpg",
      creatorWallet
    )

    const projectData = new ProjectViewModel(
      formValue.presaleOptionsGroupDescription,
      "GQ34GQ5G6HW6W57J7",
      72373583,
      "Best Project",
      "base64encodedimage",                                          //<= მთავარი ობიექტი
      creatorWallet,
      formValue.addRoadMapOptionGroup.roadmapDescription,
      formValue.addRoadMapOptionGroup.roadmapImage,
      "twitter.com",
      "telegram.com",
      "instagram.com",
      "website.com",
      formValue.teamInfoOptionGroup,
    )

    if(this.presaleIsChecked){

      const presaleData = new Presale(
        formValue.createPresaleOptionGroup.presaleSettings.softCap,
        formValue.createPresaleOptionGroup.presaleSettings.hardCap,
        1000000,
        formValue.createPresaleOptionGroup.presaleSettings.walletCap,                                               //მთავარ ობიექტში დამატება presale ობიექტის როდესაც creat presale chek box არის true
        new Date(formValue.createPresaleOptionGroup.presaleSettings.presaleStart).getTime() / 1000,
        new Date(formValue.createPresaleOptionGroup.presaleSettings.presaleEnd).getTime() / 1000,
      )

      projectData.presale = presaleData;

      // this._http.postProjectViewModel(projectData).subscribe(v => {
      //   console.log(v)
      // })
      console.log(projectData);

    } else{
      const {presale, ...projectDataWithoutPresaleData} = projectData;
      console.log(projectDataWithoutPresaleData);
      console.log(projectDataMint)
    }


  }

  check() {
    if (this.checkbox.nativeElement.checked) {
      this.isCheckedRoadMap = true;
    } else {
      this.isCheckedRoadMap = false;
    }
  }

  checkSecond() {
    if (this.checkboxSecond.nativeElement.checked) {
      const itemForm = this.fb.group({
        image: '',
        name: '',
        role: '',
        social: '',
      });
      this.teamInfo.push(itemForm);
      this.isCheckedTeamInfo = true;
    } else {
      this.isCheckedTeamInfo = false;
    }
  }

  addExtraFields(index: number) {
    if (index === 0) {
      const itemForm = this.fb.group({
        image: '',
        name: '',
        role: '',
        social: '',
      });
      this.teamInfo.push(itemForm);
    } else {
      this.teamInfo.removeAt(index);
    }
  }

  // for form intitialize
  // deployFormGroup = this.fb.group({
  //   tokenInfoGroup: this.fb.group({
  //     tokenName: '',
  //     unitName: '',
  //     totalSupply: '',
  //     decimals: '',
  //     URL: '',
  //     maxBuy: '',
  //   }),
  //   feesGroup: this.fb.group({
  //     risingPriceFloor: '',
  //     backing: '',
  //     buyBurn: '',
  //     sellBurn: '',
  //     sendBurn: '',
  //   }),
  //   additionalFeeOptionGroup: this.fb.group({
  //     addFeeCheck: this.fb.control(false),
  //     purpose: '',
  //     address: '',
  //     fee: '',
  //   }),
  //   presaleOptionsGroupDescription: this.fb.control(''),
  //   createPresaleOptionGroup: this.fb.group({
  //     presaleSettings: this.fb.group({
  //       presaleStart: '',
  //       presaleEnd: '',
  //       softCap: '',
  //       hardCap: '',
  //       walletCap: '',
  //     }),
  //     presaleLiquidity: this.fb.group({
  //       tokensInPresale: '',
  //       tokensInLiquidity: '',
  //       algoToLiquidity: '',
  //       presaleFundsToLiquidity: '',
  //     }),
  //   }),
  //   liquidity: this.fb.group({
  //     tokensToLiq: '',
  //     algoToLiq: '',
  //   }),
  //   tradingStart: this.fb.control(''),
  //   addRoadMapOptionGroup: this.fb.group({
  //     roadmapDescription: '',
  //     roadmapImage: '',
  //   }),
  //   teamInfoOptionGroup: this.fb.group({
  //     teamInfoImage: '',
  //     name: '',
  //     position: '',
  //     social: '',
  //   }),
  //   presaleCheck: this.fb.control(false),
  //   roadmapCheck: this.fb.control(false),
  //   teamInfoCheck: this.fb.control(false),
  // });
  // for form intitialize

  blockchainObjInitialize(): DeployedAppSettings {
    return this.blockchainObect = {
      creator: 'saba',
      total_supply: this.deployFormGroup.get('tokenInfoGroup.totalSupply')?.value,
      buy_burn: this.deployFormGroup.get('feesGroup.buyBurn')?.value,
      sell_burn: this.deployFormGroup.get('feesGroup.sellBurn')?.value,
      transfer_burn: this.deployFormGroup.get('feesGroup.sendBurn')?.value,
      to_lp: this.deployFormGroup.get('feesGroup.risingPriceFloor')?.value,
      to_backing: this.deployFormGroup.get('feesGroup.backing')?.value,
      max_buy: this.deployFormGroup.get('tokenInfoGroup.maxBuy')?.value,
      name: this.deployFormGroup.get('tokenInfoGroup.tokenName')?.value,
      unit: this.deployFormGroup.get('tokenInfoGroup.unitName')?.value || null,
      decimals: this.deployFormGroup.get('tokenInfoGroup.decimals')?.value,
      url: this.deployFormGroup.get('tokenInfoGroup.URL')?.value || null,
      trading_start: this.deployFormGroup.get('tradingStart')?.value,
      initial_token_liq: this.deployFormGroup.get('liquidity.tokensToLiq')?.value,
      initial_algo_liq: this.deployFormGroup.get('liquidity.algoToLiq')?.value,
      initial_algo_liq_fee: this.fee * +this.deployFormGroup.get('liquidity.algoToLiq')?.value,
      contract_id: this.deployFormGroup.get('additionalFeeOptionGroup.address')?.value || null, // ask
      contract_address: this.deployFormGroup.get('additionalFeeOptionGroup.address')?.value || null,
      asset_id: this.deployFormGroup.get('additionalFeeOptionGroup.address')?.value || null, // ask,
      presale_settings: {
        presale_token_amount: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value, // to ask
        presale_start: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value,
        presale_end: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value,
        to_lp: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value, // to ask
        softcap: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.softCap')?.value,
        hardcap: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value,
        walletcap: this.deployFormGroup.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value,
      } || null
    }
  }


  async onSubmit() {
    // let result = await this.walletProviderService.payToSetUpIndex('ZOLXPN2IQYCDBYQMA42S2WCPJJYMQ7V3OCMEBCBQFGUEUH3ATVPFCMUYYE', 1000);
    // console.log(result);
    console.log(this.blockchainObect);
    let result = await this.walletProviderService.payAndSign('ZOLXPN2IQYCDBYQMA42S2WCPJJYMQ7V3OCMEBCBQFGUEUH3ATVPFCMUYYE', 1000);
    console.log(result);

    // const deploy = new DeployedApp(this.walletProviderService);
    // deploy.deploy()

  }

  activatePurposeSection() {
    if (this.checkboxPurpose.nativeElement.checked) {
      this.purposeIsChecked = true;
    } else {
      this.purposeIsChecked = false;
    }
  }

  activatePresaleSection() {
    let createPresaleOptionGroup = this.deployFormGroup.get('createPresaleOptionGroup') as FormGroup

    if (this.checkPresale.nativeElement.checked) {
      this.presaleIsChecked = true;

      const presaleFormGroup = this.fb.group({
        presaleStart: new FormControl('', Validators.required),
        presaleEnd: new FormControl('', Validators.required),
        softCap: new FormControl('', Validators.required),                                              // presaleFormGroup ფორმ გრუპის დამატება createPresaleOptionGroup ფორმ გრუპში, ვალიდაციისთვის
        hardCap: new FormControl('', Validators.required),
        walletCap: new FormControl('', Validators.required),
      })

      createPresaleOptionGroup.addControl('presaleSettings', presaleFormGroup);

    } else {
      this.presaleIsChecked = false;

      createPresaleOptionGroup.removeControl('presaleSettings');
    }
  }

  onImageUpload(event: any) {
    let imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageURL = reader.result as string;
    };
    reader.readAsDataURL(imageFile);
  }


  httpRequests(projectId:string, mintDate:ProjectViewModelForMinit){
    mintDate.projectId = projectId;

    console.log(mintDate)
    this._http.postProjectViewModelForMint(mintDate).subscribe(v => console.log(v));
  }
}
