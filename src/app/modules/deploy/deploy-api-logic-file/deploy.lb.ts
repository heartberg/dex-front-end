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
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { ProjectViewModel } from 'src/app/models/projectView.model';

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

  constructor(
    private _deployService: deployService,
    private deployerBC: DeployedApp, 
    private wallet: WalletsConnectService,
    private _projectService: projectReqService
    ) {
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
            console.log("value of deploy: " + value)
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
                      console.log("value of mint: " + value)
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

  async deployFromSetupPresale(projectModel: ProjectViewModel) {
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapPresaleProjectViewToBlockchainObject(projectModel)
    of (await this.deployerBC.setupWithPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          this.GetProjectSetup(projectModel.projectId).subscribe(
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

async deployFromSetupNoPresale(projectModel: ProjectViewModel) {
  this.sessionWallet = this.wallet.sessionWallet
  this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
  of (await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
    (value: any) => {
      if (value) {
        this.GetProjectSetup(projectModel.projectId).subscribe(
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

  async deployFromMintNoPresale(projectModel: ProjectViewModel){
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          console.log("value of mint: " + value)
          this.GetProjectMint(this.projectId, this.deployerBC.settings.asset_id!).subscribe(
            async (value: any) => {
              if (2 === 2) {
                of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                  (value: any) => {
                    if (value) {
                      this.GetProjectBurnOptIn(this.projectId).subscribe(
                        async (value: any) => {
                          if (2 === 2) {
                            of (await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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

  async deployFromMintPresale(projectModel: ProjectViewModel){
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapPresaleProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          console.log("value of mint: " + value)
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

  async deployFromOptInPresale(projectModel: ProjectViewModel) {
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapPresaleProjectViewToBlockchainObject(projectModel)
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

  async deployFromOptInNoPresale(projectModel: ProjectViewModel) {
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          this.GetProjectBurnOptIn(this.projectId).subscribe(
            async (value: any) => {
              if (2 === 2) {
                of (await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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

  mapPresaleProjectViewToBlockchainObject(projectView: ProjectViewModel): DeployedAppSettings {
    return {
      buy_burn: projectView.asset.buyBurn,
      creator: projectView.creatorWallet,
      decimals: projectView.asset.decimals,
      extra_fee_time: Math.floor(projectView.asset.extraFeeTime),
      initial_algo_liq: projectView.initialAlgoLiquidity,
      initial_algo_liq_with_fee: projectView.initialAlgoLiquidityWithFee,
      initial_token_liq: projectView.initialTokenLiquidity,
      max_buy: projectView.asset.maxBuy,
      name: projectView.asset.name,
      sell_burn: projectView.asset.sellBurn,
      to_backing: projectView.asset.backing,
      to_lp: projectView.asset.risingPriceFloor,
      total_supply: projectView.asset.totalSupply,
      trading_start: projectView.asset.tradingStart,
      transfer_burn: projectView.asset.sendBurn,
      unit: projectView.asset.unitName,
      url: projectView.asset.url || "",
      asset_id: projectView.asset.assetId,
      contract_address: projectView.asset.contractAddress,
      contract_id: projectView.asset.contractId,
      presale_settings: {
        hardcap: projectView.presale!.hardCap,
        presale_end: projectView.presale!.endingTime,
        presale_start: projectView.presale!.startingTime,
        presale_token_amount: projectView.presale!.tokenAmount,
        softcap: projectView.presale!.softCap,
        to_lp: projectView.presale!.presaleToLiq,
        walletcap: projectView.presale!.walletCap
      },

    }
  }

  mapProjectViewToBlockchainObject(projectView: ProjectViewModel): DeployedAppSettings {
    return {
      buy_burn: projectView.asset.buyBurn,
      creator: projectView.creatorWallet,
      decimals: projectView.asset.decimals,
      extra_fee_time: Math.floor(projectView.asset.extraFeeTime),
      initial_algo_liq: projectView.initialAlgoLiquidity,
      initial_algo_liq_with_fee: projectView.initialAlgoLiquidityWithFee,
      initial_token_liq: projectView.initialTokenLiquidity,
      max_buy: projectView.asset.maxBuy,
      name: projectView.asset.name,
      sell_burn: projectView.asset.sellBurn,
      to_backing: projectView.asset.backing,
      to_lp: projectView.asset.risingPriceFloor,
      total_supply: projectView.asset.totalSupply,
      trading_start: projectView.asset.tradingStart,
      transfer_burn: projectView.asset.sendBurn,
      unit: projectView.asset.unitName,
      url: projectView.asset.url || "",
      asset_id: projectView.asset.assetId,
      contract_address: projectView.asset.contractAddress,
      contract_id: projectView.asset.contractId,
      presale_settings: {
        hardcap: 0,
        presale_end: 0,
        presale_start: 0,
        presale_token_amount: 0,
        softcap: 0,
        to_lp: 0,
        walletcap: 0
      },

    }
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
        extraFeeTime: form.get('extraFeeTime')?.value
      }
    }
  }

  initializeApiObjWithoutPresale(form: any): void {

    console.log(form.value)

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
        extraFeeTime: +form.get('extraFeeTime')?.value
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
