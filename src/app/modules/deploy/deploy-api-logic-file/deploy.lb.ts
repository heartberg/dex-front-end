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

  constructor(private _deployService: deployService) {
  }

  // final
  DeployFinalFunc(isPresaleChecked: boolean, data: any): void {
    this.initializeApiObj(data);
    if (isPresaleChecked) {
      of(this.GetProjectPresaleCrate(this.presaleObj)).subscribe(
        (value: any) => {
          if (value) {
            of(this.GetProjectMint(this.mintObj)).subscribe(
              (value: any) => {
                if (value) {
                  of(this.GetProjectBurnOptIn(this.projectId)).subscribe(
                    (value: any) => {
                      if (value) {
                        of(this.GetProjectSetup(this.projectId)).subscribe(
                          (value: any) => {
                            if (value) {
                              console.log('success everything was deployed!')
                            }
                          }
                        )
                      }
                    }
                  )
                }
              }
            )
          }
        }
      )
      // end of presale checked api calls
    }
    // end of presale checked statement on true
    else {
      console.log('saba');
      console.log(this.withoutPresaleObj);
      of(this.GetPorjectWithoutPresaleCreate(this.withoutPresaleObj)).subscribe(
        (value: any) => {
          console.log(value);
          if (value) {
            of(this.GetProjectMint(this.mintObj)).subscribe(
              (value: any) => {
                if (value) {
                  of(this.GetProjectBurnOptIn(this.projectId)).subscribe(
                    (value: any) => {
                      if (value) {
                        of(this.GetProjectSetup(this.projectId)).subscribe(
                          (value: any) => {
                            if (value) {
                              console.log('success everything was deployed!')
                            }
                          }
                        )
                      }
                    }
                  )
                }
              }
            )
          }
        }
      )
      // end of api call on project withour presale
    }
    // end of statement of false
  }
  // final

  GetProjectPresaleCrate(project: projectPresaleCreateModel) {
    this._deployService.ProjectPresaleCreate(project).subscribe( (value: projectPresaleCreateModel) => {
      return value;
    })
  }

  GetPorjectWithoutPresaleCreate(project: projectWithoutPresaleCreateModel) {
    this._deployService.ProjectCreate(project).subscribe( (value: projectWithoutPresaleCreateModel) => {
      console.log(value);
      return value;
    })
  }

  GetProjectMint(project: projectMintModel) {
    this._deployService.projectMint(project).subscribe( (value: projectMintModel) => {
      console.log(value);
      return value;
    })
  }

  GetProjectBurnOptIn(projectId: string) {
    this._deployService.projectburnOptIn(projectId).subscribe( (value: any) => {
      console.log(value);
      return value;
    })
  }

  GetProjectSetup(projectId: string) {
    this._deployService.projectSetup(projectId).subscribe( (value: any) => {
      console.log(value);
      return value;
    })
  }

  // initializeObj
  initializeApiObj(form: any): void {
    console.log(form);
    let wallet = localStorage.getItem('wallet');

    this.presaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      contractAddress: 'GQ34GQ5G6HW6W57J7',
      contractId: 32,
      projectName: form.get('tokenInfoGroup.tokenName')?.value,
      projectImage: form.get('addRoadMapOptionGroup.roadmapImage').value, // ask
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
      presale: {
        softCap: +form.get('presaleOptionsGroupDescription')?.value!,
        hardCap: +form.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value!,
        tokenAmount: +form.get('createPresaleOptionGroup.presaleSettings.softCap')?.value!, // ask
        walletCap: +form.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value!,
        startingTime: +form.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value!,
        endingTime: +form.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value!,
      }
    }

    this.withoutPresaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      contractAddress: 'GQ34GQ5G6HW6W57J7',
      contractId: 32,
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
      assetId: 3445,
      projectId: 'dkj495950dj',
      smartContractId: 1234,
      smartContractAddress: 'ejj34',
      name: form.get('tokenInfoGroup.tokenName')?.value,
      unitName: form.get('tokenInfoGroup.unitName')?.value,
      totalSupply: form.get('tokenInfoGroup.totalSupply')?.value,
      url: form.get('tokenInfoGroup.URL')?.value,
      maxBuy: form.get('tokenInfoGroup.maxBuy')?.value,
      tradingStart: form.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value,
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

    this.projectId = 'dkk35'

  }

}
