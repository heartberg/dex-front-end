import { Injectable } from '@angular/core';
import {
  projectMintModel,
  projectPresaleCreateModel,
  projectWithoutPresaleCreateModel
} from "../../../models/deployModel";
import {deployService} from "../../../services/APIs/deploy/deploy-service";
import {FormGroup} from "@angular/forms";
import {of} from "rxjs";

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
  constructor(private _deployService: deployService) {
  }

  // final
  DeployFinalFunc(isPresaleChecked: boolean, data: any): void {
    // this.initializeApiObj(data);
    // if (isPresaleChecked) {
    //   this.GetProjectPresaleCreate();
    // }
    // else {
    //   this.GetProjectWithoutPresaleCreate();
    // }
    this.initializeApiObj(data);
    if (isPresaleChecked) {
      this.GetProjectPresaleCreate(this.presaleObj);
    }
    else {
      this.GetPorjectWithoutPresaleCreate(this.withoutPresaleObj);
    }
    // end of statement of false
  }
  // final

  SetAssetId(assetId: number) {
    this.mintObj.assetId = assetId
  }

  // GetProjectPresaleCreate() {
  //   return this._deployService.ProjectPresaleCreate(this.presaleObj).subscribe( (value: any) => {
  //     console.log(value, 'presale')
  //     this.projectId = value;
  //     this.mintObj.projectId = this.projectId;
  //   })
  // }
  //
  // GetProjectWithoutPresaleCreate() {
  //   this._deployService.ProjectCreate(this.withoutPresaleObj).subscribe( (value: any) => {
  //     if (value) {
  //       console.log(value, 'without presale');
  //       this.projectId = value;
  //       this.mintObj.projectId = this.projectId;
  //     }
  //   })
  // }

  // must thing
  GetProjectPresaleCreate(project: projectPresaleCreateModel) {
    this._deployService.ProjectPresaleCreate(project)
      .subscribe( (value: any) => {
        if (value) {
          console.log(value, 'with presale');
          // assigning
          this.projectId = value;
          this.mintObj.projectId = this.projectId;
          // assigning
          this.GetProjectMint(this.mintObj).subscribe(
            (value) => {
              console.log(value, 'minted')
              if (2 === 2) {
                this.GetProjectBurnOptIn(this.projectId).subscribe(
                  (value: any) => {
                    if (2 === 2) {
                      this.GetProjectSetup(this.projectId).subscribe(
                        (value: any) => {
                          console.log(value, 'everything is setted up');
                        }
                      )
                    }
                  }
                )
              }
            }
          )
        }
      })
  }

  GetPorjectWithoutPresaleCreate(project: projectWithoutPresaleCreateModel) {
    this._deployService.ProjectCreate(project)
      .subscribe( (value: any) => {
        if (value) {
          console.log(value, 'without presale');
          // assigning
          this.projectId = value;
          this.mintObj.projectId = this.projectId;
          // assigning
          this.GetProjectMint(this.mintObj).subscribe(
            (value) => {
              console.log(value, 'minted')
              if (2 === 2) {
                this.GetProjectBurnOptIn(this.projectId).subscribe(
                  (value: any) => {
                    if (2 === 2) {
                      this.GetProjectSetup(this.projectId).subscribe(
                        (value: any) => {
                          console.log(value, 'everything is setted up');
                        }
                      )
                    }
                  }
                )
              }
            }
          )
        }
      })
  }
  // #must thing

  // GetProjectMint() {
  //   return this._deployService.projectMint(this.mintObj)
  // }
  //
  // GetProjectBurnOptIn() {
  //   return this._deployService.projectburnOptIn(this.projectId)
  // }
  //
  // GetProjectSetup() {
  //   return this._deployService.projectSetup(this.projectId)
  // }
  GetProjectMint(project: projectMintModel) {
    return this._deployService.projectMint(project)
    // .subscribe( (value: projectMintModel) => {
    // console.log(value, 'mint');
    // return value;
    // })
  }

  GetProjectBurnOptIn(projectId: string) {
    return this._deployService.projectburnOptIn(projectId)
    //   .subscribe( (value: any) => {
    //   console.log(value, 'burnOptIn');
    // })
  }

  GetProjectSetup(projectId: string) {
    return this._deployService.projectSetup(projectId)
  }

  // initializeObj
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
      name: form.get('tokenInfoGroup.tokenName')?.value,
      unitName: form.get('tokenInfoGroup.unitName')?.value,
      totalSupply: form.get('tokenInfoGroup.totalSupply')?.value,
      url: form.get('tokenInfoGroup.URL')?.value,
      maxBuy: form.get('tokenInfoGroup.maxBuy')?.value,
      tradingStart: 1641387372,
      risingPriceFloor: form.get('feesGroup.risingPriceFloor')?.value,
      backing: form.get('feesGroup.backing')?.value,
      buyBurn: form.get('feesGroup.buyBurn')?.value,
      sellBurn: form.get('feesGroup.sellBurn')?.value,
      sendBurn: form.get('feesGroup.sendBurn')?.value,
      additionalFee: form.get('additionalFeeOptionGroup.fee')?.value,
      additionalFeeWallet: form.get('additionalFeeOptionGroup.address')?.value,
      image: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      deployerWallet: localStorage.getItem('wallet')!,
    }

  }

}
