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
import { SessionWallet } from 'algorand-session-wallet';
import {WalletsConnectService} from "../../../services/wallets-connect.service";
import { TeamMemberViewModel } from 'src/app/models/TeamMemberView.model';

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
  sessionWallet: SessionWallet | undefined;

  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;

  constructor(private _deployService: deployService, private deployerBC: DeployedApp, private wallet: WalletsConnectService) {
  }


  SetMintVars(data: DeployedAppSettings) {
    this.mintObj.projectId = this.projectId
    this.mintObj.contractAddress = data.contract_address!
    this.mintObj.contractId = data.contract_id!
    this.mintObj.assetId = data.asset_id!
  }

  DeployFinalFunc(isPresaleChecked: boolean, data: any): void {
    // @ts-ignore
    this.blockchainObj = JSON.parse(localStorage.getItem('blockchainObj'));
    // @ts-ignore
    this.sessionWallet = this.wallet.sessionWallet;
    setTimeout(() => {
      if (isPresaleChecked) {
        this.GetProjectPresaleCreate();
      }
      else {
        this.GetProjectWithoutPresaleCreate();
      }
    }, 2000);
    // end of statement of false
  }

  // with presale
  async GetProjectPresaleCreate() {
    this.isPending = true;
    this.isFailed = false;
    this.finalStepApi = false;
    of(await this.deployerBC.deploy(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        setTimeout(() => {
          if (value) {
          this.presaleObj.contractId = this.deployerBC.settings.contract_id!
          this.presaleObj.contractAddress = this.deployerBC.settings.contract_address!
          this.presaleObj.asset.contractId = this.deployerBC.settings.contract_id!
          this.presaleObj.asset.contractAddress = this.deployerBC.settings.contract_address!
          this._deployService.ProjectPresaleCreate(this.presaleObj).subscribe(
            async (value: any) => {
              this.projectId = value
              if (true) {
                of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
                  (value: any) => {
                    if (value) {
                      this.GetProjectMint(this.projectId, this.deployerBC.settings.asset_id!).subscribe(
                        async (value: any) => {
                          if (2 === 2) {
                            of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                              (value: any) => {
                                if (value) {
                                  this.GetProjectBurnOptIn(this.projectId).subscribe(
                                    async (value: any) => {
                                      if (2 === 2) {
                                        of (await this.deployerBC.setupWithPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                          (value: any) => {
                                            if (value) {
                                              this.GetProjectSetup(this.projectId).subscribe(
                                                (value: any) => {
                                                  console.log('setup is done')
                                                }
                                              )
                                            }
                                          },
                                          error => {
                                            this.isPending = false;
                                            this.isFailed = true;
                                            this.finalStepApi = false;
                                          }
                                        )
                                      }
                                    },
                                    error => {
                                      this.isPending = false;
                                      this.isFailed = true;
                                      this.finalStepApi = false;
                                    }
                                  )
                                }
                              }
                            )
                          }
                        },
                        error => {
                          this.isPending = false;
                          this.isFailed = true;
                          this.finalStepApi = false;
                        }
                      )
                    }
                  }
                )
              }
            },
            error => {
              this.isPending = false;
              this.isFailed = true;
              this.finalStepApi = false;
            }
          )
        }
        }, 1200)
      }
    )
  }

  // without presale
  async GetProjectWithoutPresaleCreate() {
    of(await this.deployerBC.deploy(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        this.withoutPresaleObj.contractId = this.deployerBC.settings.contract_id!
        this.withoutPresaleObj.contractAddress = this.deployerBC.settings.contract_address!
        this.withoutPresaleObj.asset.contractId = this.deployerBC.settings.contract_id!
        this.withoutPresaleObj.asset.contractAddress = this.deployerBC.settings.contract_address!
        if (value) {
          setTimeout(() => {
            this._deployService.ProjectCreate(this.withoutPresaleObj).subscribe(
              async (value: any) => {
                if (value) {
                  this.isPending = true;
                  this.isFailed = false;
                  this.finalStepApi = false;
                  this.projectId = value;
                  of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
                    (value: any) => {
                      if (value) {
                        this.GetProjectMint(this.projectId, this.deployerBC.settings.asset_id!).subscribe(
                          async (value: any) => {
                            if (2 === 2) {
                              of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                async (value: any) => {
                                  if (value) {
                                    await this.GetProjectBurnOptIn(this.projectId).subscribe(
                                      async (value: any) => {
                                        if (2 === 2) {
                                          of (await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                            (value: any) => {
                                              if (value) {
                                                this.GetProjectSetup(this.projectId).subscribe(
                                                  (value: any) => {
                                                    if (value) {
                                                      console.log('setup is done')
                                                      this.finalStepApi = true;
                                                      this.isPending = false;
                                                      this.isFailed = false;
                                                    }
                                                  },
                                                  error => {
                                                    this.isPending = false;
                                                    this.isFailed = true;
                                                    this.finalStepApi = false;
                                                  }
                                                )
                                              }
                                            }
                                          )
                                        }
                                      },
                                      error => {
                                        this.isPending = false;
                                        this.isFailed = true;
                                        this.finalStepApi = false;
                                      }
                                    )
                                  }
                                }
                              )
                            }
                          },
                          error => {
                            this.isPending = false;
                            this.isFailed = true;
                            this.finalStepApi = false;
                          }
                        )
                      }
                    }
                  )
                }
              },
              error => {
                this.isPending = false;
                this.isFailed = true;
                this.finalStepApi = false;
              }
            )
          }, 1200)
        }
      }
    )
  }

  GetProjectMint(projectId: string, assetId: number) {
    return this._deployService.projectMint(projectId, assetId)
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

  initializeApiObjWithPresale(form: any): void {
    console.log(form);
    let wallet = localStorage.getItem('wallet');

    let presaleStartTime = parseInt((new Date(form.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value).getTime() / 1000).toFixed(0))
    let presaleEndTime = parseInt((new Date(form.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value).getTime() / 1000).toFixed(0))

    this.presaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      contractAddress: 'tbd',
      contractId: 0,
      projectName: form.get('projectName')?.value,
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
        softCap: +form.get('createPresaleOptionGroup.presaleSettings.softCap')?.value! * 1_000_000,
        hardCap: +form.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value! * 1_000_000,
        tokenAmount: +form.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value),
        walletCap: +form.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value! * 1_000_000,
        startingTime: presaleStartTime,
        endingTime: presaleEndTime,
      },
      asset: {
        assetId: 0,
        projectId: '00000000-0000-0000-0000-000000000000',
        contractId: 0,
        contractAddress: 'tbd',
        decimals: +form.get('tokenInfoGroup.decimals')?.value,
        name: form.get('tokenInfoGroup.tokenName')?.value,
        unitName: form.get('tokenInfoGroup.unitName')?.value,
        totalSupply: +form.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value,),
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

  initializeApiObjWithoutPresale(form: any): void {
    let wallet = localStorage.getItem('wallet');
    this.withoutPresaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      contractAddress: 'tbd',
      contractId: 0,
      projectName: form.get('projectName')?.value,
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
      asset: {
        assetId: 0,
        projectId: '00000000-0000-0000-0000-000000000000',
        contractId: 0,
        contractAddress: 'tbd',
        decimals: +form.get('tokenInfoGroup.decimals')?.value,
        name: form.get('tokenInfoGroup.tokenName')?.value,
        unitName: form.get('tokenInfoGroup.unitName')?.value,
        totalSupply: +form.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value,),
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

  mapTeamMembers(members: any[]) {
    let mapped: TeamMemberViewModel[] = []
    members.forEach(element => {
      let member: TeamMemberViewModel = {
        image: element.image,
        name: element.name,
        role: element.role,
        social: element.social
      }
      mapped.push(member)
    });
  }

}
