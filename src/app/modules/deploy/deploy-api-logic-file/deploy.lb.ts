import { Injectable } from '@angular/core';
import {
  projectMintModel,
  projectPresaleCreateModel,
  projectWithoutPresaleCreateModel
} from "../../../models/deployModel";
import {deployService} from "../../../services/APIs/deploy/deploy-service";
import {FormGroup} from "@angular/forms";
import {of} from "rxjs";
import {DeployComponent} from "../deploy.component";
import {DeployedAppSettings} from "../../../blockchain/platform-conf";
import {DeployedApp} from "../../../blockchain/deployer_application";

@Injectable({
  providedIn: 'root',
})

export class DeployLb {

  // @ts-ignore
  presaleObj: projectPresaleCreateModel;
  // @ts-ignore
  withoutPresaleObj: projectWithoutPresaleCreateModel;
  // @ts-ignore
  mintObj: projectMintModel;
  // @ts-ignore
  projectId: string;
  // ProjectID: any = '';
  // @ts-ignore
  sessionWallet: any;
  constructor(private _deployService: deployService) {
  }

  SetMintVars(data: DeployedAppSettings) {
    this.mintObj.projectId = this.projectId
    this.mintObj.contractAddress = data.contract_address!
    this.mintObj.contractId = data.contract_id!
    this.mintObj.assetId = data.asset_id!
  }

  GetProjectPresaleCreate() {
    return this._deployService.ProjectPresaleCreate(this.presaleObj)
  }

  GetProjectWithoutPresaleCreate() {
    return this._deployService.ProjectCreate(this.withoutPresaleObj)
  }

   GetProjectMint() {
     return this._deployService.projectMint(this.mintObj)
   }
  
   GetProjectBurnOptIn() {
     return this._deployService.projectburnOptIn(this.projectId)
   }
  
   GetProjectSetup() {
     return this._deployService.projectSetup(this.projectId)
  }

  initializeApiObj(form: any): void {
    console.log(form);
    let wallet = localStorage.getItem('wallet');

    this.presaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      contractAddress: 'tbd',
      contractId: 0,
      projectName: form.get('tokenInfoGroup.tokenName')?.value,
      projectImage: form.get('addRoadMapOptionGroup.roadmapImage').value, // ask
      creatorWallet: wallet!,
      roadmap: form.get('addRoadMapOptionGroup.roadmapDescription')?.value,
      roadmapImage: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      twitter: 's',
      telegram: 's',
      instagram:  's',
      website:  's',
      // TODO: SABA
      teamMembers: [
        {
          name: 'saba',
          image: 'snaas',
          role: 'asdfklfjdklf',
          social: 'dksdfkldf'
        }
      ],
      presale: {
        softCap: +form.get('presaleOptionsGroupDescription')?.value!,
        hardCap: +form.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value!,
        tokenAmount: +form.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value),
        walletCap: +form.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value!,
        startingTime: +form.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value!,
        endingTime: +form.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value!,
      }
    }

    this.withoutPresaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      contractAddress: 'tbd',
      contractId: 0,
      projectName: form.get('tokenInfoGroup.tokenName')?.value,
      projectImage: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      creatorWallet: wallet!,
      roadmap: form.get('addRoadMapOptionGroup.roadmapDescription')?.value,
      roadmapImage: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      twitter: 's',
      telegram: 's',
      instagram:  's',
      website:  's',
      teamMembers: [
        {
          name: 'saba',
          image: 'snaas',
          role: 'asdfklfjdklf',
          social: 'dksdfkldf'
        }
      ],
    }

    this.mintObj = {
      assetId: 0,
      projectId: 'tbd',
      contractId: 0,
      contractAddress: 'tbd',
      decimals: +form.get('tokenInfoGroup.decimals')?.value,
      name: form.get('tokenInfoGroup.tokenName')?.value,
      unitName: form.get('tokenInfoGroup.unitName')?.value,
      totalSupply: +form.get('tokenInfoGroup.totalSupply')?.value,
      url: form.get('tokenInfoGroup.URL')?.value,
      maxBuy: form.get('tokenInfoGroup.maxBuy')?.value * 1_000_000,
      tradingStart: parseInt((new Date(form.get('tradingStart')?.value).getTime() / 1000).toFixed(0)),
      risingPriceFloor: form.get('feesGroup.risingPriceFloor')?.value * 100,
      backing: form.get('feesGroup.backing')?.value * 100,
      buyBurn: form.get('feesGroup.buyBurn')?.value * 100,
      sellBurn: form.get('feesGroup.sellBurn')?.value * 100,
      sendBurn: form.get('feesGroup.sendBurn')?.value * 100,
      image: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      deployerWallet: localStorage.getItem('wallet')!,
    }

  }

}
