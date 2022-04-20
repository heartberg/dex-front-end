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
  blockchainObj: DeployedAppSettings;
  sessionWallet: any;
  constructor(private _deployService: deployService, private deployerBC: DeployedApp) {
  }

  // final
  DeployFinalFunc(isPresaleChecked: boolean, data: any): void {
    this.initializeApiObj(data);
    // @ts-ignore
    this.blockchainObj = JSON.parse(localStorage.getItem('blockchainObj'));
    // @ts-ignore
    this.sessionWallet = JSON.parse(localStorage.getItem('sessionWallet'));

    if (isPresaleChecked) {
      this.GetProjectPresaleCreate(this.presaleObj);
      this.presaleObj.contractId = this.deployerBC.settings.contract_id!
      this.presaleObj.contractAddress = this.deployerBC.settings.contract_address!
    }
    else {
      this.GetPorjectWithoutPresaleCreate(this.withoutPresaleObj);
      this.withoutPresaleObj.contractId = this.deployerBC.settings.contract_id!
      this.withoutPresaleObj.contractAddress = this.deployerBC.settings.contract_address!
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
    of(this.deployerBC.deploy(this.sessionWallet, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          this._deployService.ProjectPresaleCreate(project).subscribe(
            (value) => {
              if (value) {
                of(this.deployerBC.mint(this.sessionWallet, this.blockchainObj!)).subscribe(
                  (value: any) => {
                    if (2 === 2) {
                      this.GetProjectMint(this.mintObj).subscribe(
                        (value: any) => {
                          if (2 === 2) {
                            of(this.deployerBC.payAndOptInBurn(this.sessionWallet, this.blockchainObj!)).subscribe(
                              (value: any) => {
                                if (2 === 2) {
                                  this.GetProjectBurnOptIn(this.projectId).subscribe(
                                    (value: any) => {
                                      if (2 === 2) {
                                        of (this.deployerBC.setupWithPresale(this.sessionWallet, this.blockchainObj!)).subscribe(
                                          (value: any) => {
                                            if (value) {
                                              this.GetProjectSetup(this.projectId).subscribe(
                                                (value: any) => {
                                                  console.log('setup is done')
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
    // this._deployService.ProjectPresaleCreate(project)
    //   .subscribe( (value: any) => {
    //     if (value) {
    //       console.log(value, 'with presale');
    //       // assigning
    //       this.projectId = value;
    //       this.mintObj.projectId = this.projectId;
    //       // assigning
    //       this.GetProjectMint(this.mintObj).subscribe(
    //         (value) => {
    //           console.log(value, 'minted')
    //           if (2 === 2) {
    //             this.GetProjectBurnOptIn(this.projectId).subscribe(
    //               (value: any) => {
    //                 if (2 === 2) {
    //                   this.GetProjectSetup(this.projectId).subscribe(
    //                     (value: any) => {
    //                       console.log(value, 'everything is setted up');
    //                     }
    //                   )
    //                 }
    //               }
    //             )
    //           }
    //         }
    //       )
    //     }
    //   })
  }

  GetPorjectWithoutPresaleCreate(project: projectWithoutPresaleCreateModel) {
    of(this.deployerBC.deploy(this.sessionWallet, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          this._deployService.ProjectCreate(project).subscribe(
            (value) => {
              if (value) {
                of(this.deployerBC.mint(this.sessionWallet, this.blockchainObj!)).subscribe(
                  (value: any) => {
                    if (2 === 2) {
                      this.GetProjectMint(this.mintObj).subscribe(
                        (value: any) => {
                          if (2 === 2) {
                            of(this.deployerBC.payAndOptInBurn(this.sessionWallet, this.blockchainObj!)).subscribe(
                              (value: any) => {
                                if (2 === 2) {
                                  this.GetProjectBurnOptIn(this.projectId).subscribe(
                                    (value: any) => {
                                      if (2 === 2) {
                                        of (this.deployerBC.setupNoPresale(this.sessionWallet, this.blockchainObj!)).subscribe(
                                          (value: any) => {
                                            if (value) {
                                              this.GetProjectSetup(this.projectId).subscribe(
                                                (value: any) => {
                                                  console.log('setup is done')
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
    // this._deployService.ProjectCreate(project)
    //   .subscribe( (value: any) => {
    //     if (value) {
    //       console.log(value, 'without presale');
    //       // assigning
    //       this.projectId = value;
    //       this.mintObj.projectId = this.projectId;
    //       // assigning
    //       this.GetProjectMint(this.mintObj).subscribe(
    //         (value) => {
    //           console.log(value, 'minted')
    //           if (2 === 2) {
    //             this.GetProjectBurnOptIn(this.projectId).subscribe(
    //               (value: any) => {
    //                 if (2 === 2) {
    //                   this.GetProjectSetup(this.projectId).subscribe(
    //                     (value: any) => {
    //                       console.log(value, 'everything is setted up');
    //                     }
    //                   )
    //                 }
    //               }
    //             )
    //           }
    //         }
    //       )
    //     }
    //   })
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
