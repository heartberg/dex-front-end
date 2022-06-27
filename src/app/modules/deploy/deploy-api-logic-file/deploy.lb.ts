import { Injectable } from '@angular/core';
import {
  projectMintModel,
  projectPresaleCreateModel,
  projectWithoutPresaleCreateModel,
  stakingCreateModel
} from "../../../models/deployModel";
import { deployService } from "../../../services/APIs/deploy/deploy-service";
import { FormGroup } from "@angular/forms";
import { of } from "rxjs";
import { AsaSettings, DeployComponent } from "../deploy.component";
import { DeployedAppSettings, StakingSetup } from "../../../blockchain/platform-conf";
import { DeployedApp } from "../../../blockchain/deployer_application";
import { SessionWallet } from 'algorand-session-wallet';
import { WalletsConnectService } from "../../../services/wallets-connect.service";
import { TeamMemberViewModel } from 'src/app/models/TeamMemberViewModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { ProjectViewModel } from 'src/app/models/projectViewModel';
import { environment } from 'src/environments/environment';
import { SmartProperties } from 'src/app/models/assetViewModel';
import { calcPossibleSecurityContexts } from '@angular/compiler/src/template_parser/binding_parser';

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

  blockchainObj: DeployedAppSettings | undefined;
  sessionWallet: SessionWallet | undefined;

  finalStepApi: boolean = false;
  isFailed: boolean = false;
  isPending: boolean = false;
  hasStaking: boolean = false;
  standardAsaBlockchainObject: AsaSettings | undefined;

  constructor(
    private _deployService: deployService,
    private deployerBC: DeployedApp,
    private wallet: WalletsConnectService,
    private _projectService: projectReqService
  ) {
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
            this.presaleObj.asset.smartProperties!.contractId = this.deployerBC.settings.contractId!
            this.presaleObj.asset.smartProperties!.contractAddress = this.deployerBC.settings.contractAddress!
            this._deployService.ProjectPresaleCreate(this.presaleObj).subscribe(
              async (value: any) => {
                this.projectId = value
                if (true) {
                  of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
                    (value: any) => {
                      if (value) {
                        console.log("value of mint: " + value)
                        this.GetProjectMint(this.projectId, this.deployerBC.settings.assetId!).subscribe(
                          async (value: any) => {
                            if (2 === 2) {
                              of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                (value: any) => {
                                  if (value) {
                                    this.GetProjectBurnOptIn(this.projectId).subscribe(
                                      async (value: any) => {
                                        if (this.blockchainObj!.rewardsPerInterval) {
                                          of(await this.deployerBC.deploySmartStaking(this.sessionWallet!)).subscribe(
                                            (value: any) => {
                                              this.blockchainObj!.stakingContractId = this.deployerBC.settings.stakingContractId!
                                              console.log("created staking")
                                            }
                                          );
                                        }
                                        if (2 === 2) {
                                          of(await this.deployerBC.setupWithPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                            (value: any) => {
                                              if (value) {
                                                this.GetProjectSetup(this.projectId).subscribe(
                                                  (value: any) => {
                                                    if (this.blockchainObj!.poolRewards) {
                                                      this.GetStakingSetup().subscribe(
                                                        (value: any) => {
                                                          console.log("added staking")
                                                        }
                                                      );
                                                    }
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
        this.withoutPresaleObj.asset.smartProperties!.contractId = this.deployerBC.settings.contractId!
        this.withoutPresaleObj.asset.smartProperties!.contractAddress = this.deployerBC.settings.contractAddress!
        if (value) {
          setTimeout(() => {
            this._deployService.ProjectCreate(this.withoutPresaleObj).subscribe(
              async (value: any) => {
                if (value) {

                  this.projectId = value;
                  of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
                    (value: any) => {
                      if (value) {
                        this.GetProjectMint(this.projectId, this.deployerBC.settings.assetId!).subscribe(
                          async (value: any) => {
                            if (2 === 2) {
                              of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                async (value: any) => {
                                  if (value) {
                                    await this.GetProjectBurnOptIn(this.projectId).subscribe(
                                      async (value: any) => {
                                        if (this.blockchainObj!.rewardsPerInterval) {
                                          of(await this.deployerBC.deploySmartStaking(this.sessionWallet!)).subscribe(
                                            (value: any) => {
                                              this.blockchainObj!.stakingContractId = this.deployerBC.settings.stakingContractId!
                                              console.log(this.blockchainObj)
                                              console.log("created staking")
                                            }
                                          );
                                        }
                                        if (2 === 2) {
                                          of(await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
                                            (value: any) => {
                                              if (value) {
                                                this.GetProjectSetup(this.projectId).subscribe(
                                                  (value: any) => {
                                                    console.log("project setup in db")
                                                    console.log("value after setup")
                                                    console.log(value)
                                                    if (this.blockchainObj!.poolRewards) {
                                                      console.log("starting add staking")
                                                      this.GetStakingSetup().subscribe(
                                                        (value: any) => {
                                                          console.log("added staking")
                                                        }
                                                      );
                                                    }
                                                    console.log('setup is done')

                                                  },
                                                  error => {

                                                  }
                                                )
                                              }
                                            }
                                          )
                                        }
                                      },
                                      error => {

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

              }
            )
          }, 1200)
        }
      }
    )
  }

  GetStakingSetup() {
    if(this.blockchainObj) {
      let stakingSetup: stakingCreateModel = {
        assetId: this.blockchainObj.assetId!,
        contractId: this.deployerBC.settings.stakingContractId!,
        startingTime: this.blockchainObj.poolStart!,
        endingTime: this.blockchainObj.poolStart! + this.blockchainObj.poolDuration!,
        projectId: this.projectId,
        isDistribution: this.blockchainObj.isDistribution!
      }
      console.log(stakingSetup)
      return this._projectService.AddStakingPool(stakingSetup)
    } else {
      let stakingSetup: stakingCreateModel = {
        assetId: this.standardAsaBlockchainObject!.assetId!,
        contractId: this.deployerBC.settings.stakingContractId!,
        startingTime: this.standardAsaBlockchainObject!.poolStart!,
        endingTime: this.standardAsaBlockchainObject!.poolStart! + this.standardAsaBlockchainObject!.poolDuration!,
        projectId: this.projectId,
        isDistribution: this.standardAsaBlockchainObject!.isDistribution!
      }
      console.log(stakingSetup)
      return this._projectService.AddStakingPool(stakingSetup)
    }

  }

  async deployFromSetupPresale(projectModel: ProjectViewModel) {
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.setupWithPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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
    of(await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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

  async deployFromMintNoPresale(projectModel: ProjectViewModel) {
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          console.log("value of mint: " + value)
          this.GetProjectMint(this.projectId, this.deployerBC.settings.assetId!).subscribe(
            async (value: any) => {
              if (2 === 2) {
                of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                  (value: any) => {
                    if (value) {
                      this.GetProjectBurnOptIn(this.projectId).subscribe(
                        async (value: any) => {
                          if (2 === 2) {
                            of(await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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

  async deployFromMintPresale(projectModel: ProjectViewModel) {
    this.sessionWallet = this.wallet.sessionWallet
    this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.mint(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          console.log("value of mint: " + value)
          this.GetProjectMint(this.projectId, this.deployerBC.settings.assetId!).subscribe(
            async (value: any) => {
              if (2 === 2) {
                of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
                  (value: any) => {
                    if (value) {
                      this.GetProjectBurnOptIn(this.projectId).subscribe(
                        async (value: any) => {
                          if (2 === 2) {
                            of(await this.deployerBC.setupWithPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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
    this.blockchainObj = this.mapProjectViewToBlockchainObject(projectModel)
    of(await this.deployerBC.payAndOptInBurn(this.sessionWallet!, this.blockchainObj!)).subscribe(
      (value: any) => {
        if (value) {
          this.GetProjectBurnOptIn(this.projectId).subscribe(
            async (value: any) => {
              if (2 === 2) {
                of(await this.deployerBC.setupWithPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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
                of(await this.deployerBC.setupNoPresale(this.sessionWallet!, this.blockchainObj!)).subscribe(
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

  async deployStaking(stakingSetup: StakingSetup) {
    console.log(stakingSetup)
    this.sessionWallet = this.wallet.sessionWallet
    if (stakingSetup.assetContractId) {
      if (stakingSetup.isDistribution) {
        console.log("deploy smart distribution staking")
        let response = await this.deployerBC.deploySmartDistributionStaking(this.sessionWallet!)
        if (response) {
          let stakingId = response['application-index']
          let setupResponse = await this.deployerBC.setupSmartDistributionStaking(this.sessionWallet!, stakingId, stakingSetup.assetId,
            stakingSetup.assetContractId, stakingSetup.rewardsPerInterval, stakingSetup.poolRewards, stakingSetup.poolStart,
            stakingSetup.poolInterval)
          if (setupResponse) {
            let stakingPool: stakingCreateModel = {
              assetId: stakingSetup.assetId,
              contractId: stakingId,
              startingTime: stakingSetup.poolStart,
              endingTime: stakingSetup.poolStart + stakingSetup.poolDuration,
              projectId: stakingSetup.projectId!,
              isDistribution: stakingSetup.isDistribution!
            }
            this._projectService.AddStakingPool(stakingPool).subscribe(
              (value: any) => {
                console.log("smart distribution staking pool added!")
              }
            )
          }
        }
      } else {
        console.log("deploy smart staking")
        let response = await this.deployerBC.deploySmartStaking(this.sessionWallet!)
        if (response) {
          let stakingId = response['application-index']
          let setupResponse = await this.deployerBC.setupSmartStaking(this.sessionWallet!, stakingId, stakingSetup.assetId,
            stakingSetup.assetContractId, stakingSetup.rewardsPerInterval, stakingSetup.poolRewards, stakingSetup.poolStart,
            stakingSetup.poolInterval)
          if (setupResponse) {
            let stakingPool: stakingCreateModel = {
              assetId: stakingSetup.assetId,
              contractId: stakingId,
              startingTime: stakingSetup.poolStart,
              endingTime: stakingSetup.poolStart + stakingSetup.poolDuration,
              projectId: stakingSetup.projectId!,
              isDistribution: stakingSetup.isDistribution!
            }
            this._projectService.AddStakingPool(stakingPool).subscribe(
              (value: any) => {
                console.log("staking pool added!")
              }
            )
          }
        }
      }
    } else {
      if (stakingSetup.isDistribution) {
        console.log("deploy standard staking")
        let response = await this.deployerBC.deployStandardDistributionStaking(this.sessionWallet!)
        if (response) {
          let stakingId = response['application-index']
          let setupResponse = await this.deployerBC.setupStandardDistributionStaking(this.sessionWallet!, stakingId, stakingSetup.assetId,
            stakingSetup.rewardsPerInterval, stakingSetup.poolRewards, stakingSetup.poolStart,
            stakingSetup.poolInterval)
          if (setupResponse) {
            let stakingPool: stakingCreateModel = {
              assetId: stakingSetup.assetId,
              contractId: stakingId,
              startingTime: stakingSetup.poolStart,
              endingTime: stakingSetup.poolStart + stakingSetup.poolDuration,
              projectId: null,
              isDistribution: stakingSetup.isDistribution!
            }
            this._projectService.AddStakingPool(stakingPool).subscribe(
              (value: any) => {
                console.log("staking pool added!")
              }
            )
          }
        }
      } else {
        console.log("deploy standard staking")
        let response = await this.deployerBC.deployStandardStaking(this.sessionWallet!)
        if (response) {
          let stakingId = response['application-index']
          let setupResponse = await this.deployerBC.setupStandardStaking(this.sessionWallet!, stakingId, stakingSetup.assetId,
            stakingSetup.rewardsPerInterval, stakingSetup.poolRewards, stakingSetup.poolStart,
            stakingSetup.poolInterval)
          if (setupResponse) {
            let stakingPool: stakingCreateModel = {
              assetId: stakingSetup.assetId,
              contractId: stakingId,
              startingTime: stakingSetup.poolStart,
              endingTime: stakingSetup.poolStart + stakingSetup.poolDuration,
              projectId: null,
              isDistribution: stakingSetup.isDistribution!
            }
            this._projectService.AddStakingPool(stakingPool).subscribe(
              (value: any) => {
                console.log("staking pool added!")
              }
            )
          }
        }
      }
    }
  }

  mapProjectViewToBlockchainObject(projectView: ProjectViewModel): DeployedAppSettings {
    let presaleSettings = undefined
    if(projectView.presale) {
      presaleSettings = {
        hardcap: projectView.presale!.hardCap,
        presaleEnd: projectView.presale!.endingTime,
        presaleStart: projectView.presale!.startingTime,
        presaleTokenAmount: projectView.presale!.tokenAmount,
        softcap: projectView.presale!.softCap,
        toLp: projectView.presale!.presaleToLiquidity,
        walletcap: projectView.presale!.walletCap,
        vestingRelease: projectView.presale!.vestingRelease,
        vestingReleaseInterval: projectView.presale!.vestingReleaseInterval,
        vestingReleaseIntervalNumber: projectView.presale!.vestingReleaseIntervalNumber
      }
    } else {
      presaleSettings = {
        hardcap: 0,
        presaleEnd: 0,
        presaleStart: 0,
        presaleTokenAmount: 0,
        softcap: 0,
        toLp: 0,
        walletcap: 0
      }
    }

    return {
      buyBurn: projectView.asset.smartProperties!.buyBurn,
      creator: projectView.creatorWallet,
      decimals: projectView.asset.decimals,
      extraFeeTime: Math.floor(projectView.asset.smartProperties!.extraFeeTime),
      initialAlgoLiq: projectView.initialAlgoLiquidity,
      initialAlgoLiqWithFee: projectView.initialAlgoLiquidityWithFee,
      initialTokenLiq: projectView.initialTokenLiquidity,
      maxBuy: projectView.asset.smartProperties!.maxBuy,
      name: projectView.asset.name,
      sellBurn: projectView.asset.smartProperties!.sellBurn,
      toBacking: projectView.asset.smartProperties!.backing,
      toLp: projectView.asset.smartProperties!.risingPriceFloor,
      totalSupply: projectView.asset.totalSupply,
      tradingStart: projectView.asset.smartProperties!.tradingStart,
      transferBurn: projectView.asset.smartProperties!.sendBurn,
      unit: projectView.asset.unitName,
      url: projectView.asset.url || "",
      assetId: projectView.asset.assetId,
      contractAddress: projectView.asset.smartProperties!.contractAddress,
      contractId: projectView.asset.smartProperties!.contractId,
      presaleSettings: presaleSettings,

    }
  }

  GetProjectMint(projectId: string, assetId: number) {
    return this._deployService.projectMint(projectId, assetId)
  }

  GetProjectBurnOptIn(projectId: string) {
    return this._deployService.projectburnOptIn(projectId)
  }

  GetProjectSetup(projectId: string) {
    return this._deployService.projectSetup(projectId)
  }

  initializeApiObjWithPresale(form: any): void {
    let team = localStorage.getItem('teamArray');
    let finalTeam = JSON.parse(team!);
    console.log(form.value);
    let wallet = localStorage.getItem('wallet');

    let presaleStartTime = parseInt((new Date(form.get('createPresaleOptionGroup.presaleSettings.presaleStart')?.value).getTime() / 1000).toFixed(0))
    let presaleEndTime = parseInt((new Date(form.get('createPresaleOptionGroup.presaleSettings.presaleEnd')?.value).getTime() / 1000).toFixed(0))

    let initialAlgoLiquidityWithFee = Math.floor(+form.get('createPresaleOptionGroup.presaleLiquidity.algoToLiquidity')?.value * 1_000_000 / (1 - environment.Y_FEE))

    let smartProperties: SmartProperties | undefined;
    if (form.get('feesGroup.risingPriceFloor').value != null) {
      smartProperties = {
        maxBuy: form.get('tokenInfoGroup.maxBuy')?.value * 1_000_000,
        tradingStart: parseInt((new Date(form.get('tradingStart')?.value).getTime() / 1000).toFixed(0)),
        risingPriceFloor: form.get('feesGroup.risingPriceFloor')?.value * 100,
        backing: form.get('feesGroup.backing')?.value * 100,
        buyBurn: form.get('feesGroup.buyBurn')?.value * 100,
        sellBurn: form.get('feesGroup.sellBurn')?.value * 100,
        sendBurn: form.get('feesGroup.sendBurn')?.value * 100,
        additionalFee: form.get('feesGroup.fee')?.value * 100,
        additionalFeeAddress: form.get('feesGroup.address')?.value,
        additionalFeePurpose: form.get('feesGroup.purpose')?.value,
        extraFeeTime: form.get('extraFeeTime')?.value,
        contractId: 0,
        contractAddress: 'tbd',
      }
    }
    let release;
    let releaseInterval;
    let releaseIntervalNumber;

    if(form.get("createPresaleOptionGroup.vestedReleaseSettings.releaseIntervalNumber").value) {
      release = parseInt((new Date(form.get('createPresaleOptionGroup.vestedReleaseSettings.release')?.value).getTime() / 1000).toFixed(0))
      releaseInterval = Math.floor(+form.get('createPresaleOptionGroup.vestedReleaseSettings.releaseInterval')?.value * 86400)
      releaseIntervalNumber = +form.get('createPresaleOptionGroup.vestedReleaseSettings.releaseIntervalNumber')?.value
    }

    this.presaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      projectName: form.get('projectName')?.value,
      projectImage: form.get('addRoadMapOptionGroup.roadmapImage').value, // ask
      creatorWallet: wallet!,
      roadmap: form.get('addRoadMapOptionGroup.roadmapDescription')?.value,
      roadmapImage: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      twitter: form.get('twitter')?.value,
      telegram: form.get('telegram')?.value,
      discord: form.get('discord')?.value,
      website: form.get('website')?.value,
      initialAlgoLiquidity: initialAlgoLiquidityWithFee - Math.floor(initialAlgoLiquidityWithFee * environment.Y_FEE),
      initialAlgoLiquidityWithFee: initialAlgoLiquidityWithFee,
      initialTokenLiquidity: +form.get('createPresaleOptionGroup.presaleLiquidity.tokensInLiquidity')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value),

      // TODO: SABA
      teamMembers: finalTeam,
      presale: {
        softCap: +form.get('createPresaleOptionGroup.presaleSettings.softCap')?.value! * 1_000_000,
        hardCap: +form.get('createPresaleOptionGroup.presaleSettings.hardCap')?.value! * 1_000_000,
        tokenAmount: +form.get('createPresaleOptionGroup.presaleLiquidity.tokensInPresale')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value),
        walletCap: +form.get('createPresaleOptionGroup.presaleSettings.walletCap')?.value! * 1_000_000,
        startingTime: presaleStartTime,
        endingTime: presaleEndTime,
        presaleToLiquidity: +form.get('createPresaleOptionGroup.presaleLiquidity.presaleFundsToLiquidity')?.value! * 100,
        vestingRelease: release,
        vestingReleaseInterval: releaseInterval,
        vestingReleaseIntervalNumber: releaseIntervalNumber

      },
      asset: {
        assetId: 0,
        projectId: '00000000-0000-0000-0000-000000000000',
        decimals: +form.get('tokenInfoGroup.decimals')?.value,
        name: form.get('tokenInfoGroup.tokenName')?.value,
        unitName: form.get('tokenInfoGroup.unitName')?.value,
        totalSupply: +form.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value,),
        url: form.get('tokenInfoGroup.URL')?.value,
        image: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
        deployerWallet: localStorage.getItem('wallet')!,
        smartProperties: smartProperties
      }
    }
    console.log("with presale obj")
    console.log(this.presaleObj)
  }

  initializeApiObjWithoutPresale(form: any): void {
    let team = localStorage.getItem('teamArray');
    let finalTeam = JSON.parse(team!);
    let smartProperties: SmartProperties | undefined;
    if (form.get('feesGroup.risingPriceFloor').value != null) {
      smartProperties = {
        maxBuy: form.get('tokenInfoGroup.maxBuy')?.value * 1_000_000,
        tradingStart: parseInt((new Date(form.get('tradingStart')?.value).getTime() / 1000).toFixed(0)),
        risingPriceFloor: form.get('feesGroup.risingPriceFloor')?.value * 100,
        backing: form.get('feesGroup.backing')?.value * 100,
        buyBurn: form.get('feesGroup.buyBurn')?.value * 100,
        sellBurn: form.get('feesGroup.sellBurn')?.value * 100,
        sendBurn: form.get('feesGroup.sendBurn')?.value * 100,
        additionalFee: form.get('feesGroup.fee')?.value * 100,
        additionalFeeAddress: form.get('feesGroup.address')?.value,
        additionalFeePurpose: form.get('feesGroup.purpose')?.value,
        extraFeeTime: form.get('extraFeeTime')?.value,
        contractId: 0,
        contractAddress: 'tbd',
      }
    }

    let initialAlgoLiquidityWithFee = Math.floor(+form.get('liquidity.algoToLiq')?.value * 1_000_000 / (1 - environment.Y_FEE))
    let wallet = localStorage.getItem('wallet');
    this.withoutPresaleObj = {
      description: form.get('presaleOptionsGroupDescription')?.value,
      projectName: form.get('projectName')?.value,
      projectImage: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      creatorWallet: wallet!,
      roadmap: form.get('addRoadMapOptionGroup.roadmapDescription')?.value,
      roadmapImage: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
      twitter: form.get('twitter')?.value,
      telegram: form.get('telegram')?.value,
      discord: form.get('discord')?.value,
      website: form.get('discord')?.value,
      initialAlgoLiquidity: initialAlgoLiquidityWithFee - Math.floor(initialAlgoLiquidityWithFee * environment.Y_FEE),
      initialAlgoLiquidityWithFee: initialAlgoLiquidityWithFee,
      initialTokenLiquidity: +form.get('liquidity.tokensToLiq')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value),
      teamMembers: finalTeam,
      asset: {
        assetId: 0,
        projectId: '00000000-0000-0000-0000-000000000000',
        decimals: +form.get('tokenInfoGroup.decimals')?.value,
        name: form.get('tokenInfoGroup.tokenName')?.value,
        unitName: form.get('tokenInfoGroup.unitName')?.value,
        totalSupply: +form.get('tokenInfoGroup.totalSupply')?.value * Math.pow(10, +form.get('tokenInfoGroup.decimals')?.value,),
        url: form.get('tokenInfoGroup.URL')?.value,
        image: form.get('addRoadMapOptionGroup.roadmapImage')?.value,
        deployerWallet: localStorage.getItem('wallet')!,
        smartProperties: smartProperties
      }
    }

    console.log("without presale api obj:")
    console.log(this.withoutPresaleObj)

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

  async DeployStandardAssetWithPresale() {
    this.standardAsaBlockchainObject = JSON.parse(localStorage.getItem("standardBlockchainObj")!)
    this.blockchainObj = undefined
    this.sessionWallet = this.wallet.sessionWallet
    of(await this.deployerBC.deployStandardAsset(this.sessionWallet!, this.standardAsaBlockchainObject!)).subscribe(
      (value: any) => {
        if (value) {
          setTimeout(async () => {
            this.presaleObj.asset.assetId = this.deployerBC.settings.assetId!
            this.standardAsaBlockchainObject!.assetId = this.deployerBC.settings.assetId!
            of(await this.deployerBC.createAsaPresale(this.sessionWallet!, this.standardAsaBlockchainObject!.presaleSettings!.presaleStart, this.standardAsaBlockchainObject!.presaleSettings!.presaleEnd)).subscribe(
              (value: any) => {
                this.presaleObj.presale.contractId = this.deployerBC.settings.contractId
                this._deployService.ProjectPresaleCreate(this.presaleObj).subscribe(
                  async (value: any) => {
                    if (value) {
                      this.projectId = value;
                      if (2 === 2) {
                        if (this.standardAsaBlockchainObject!.rewardsPerInterval) {
                          of(await this.deployerBC.deployStandardStaking(this.sessionWallet!)).subscribe(
                            async (value: any) => {
                              this.standardAsaBlockchainObject!.stakingContractId = this.deployerBC.settings.stakingContractId!
                              console.log(this.standardAsaBlockchainObject)
                              console.log("created staking")
                              of(await this.deployerBC.setupAsaPresale(this.sessionWallet!, this.deployerBC.settings.contractId!, this.deployerBC.settings.assetId!,
                                this.presaleObj.presale.hardCap, this.presaleObj.presale.softCap, this.presaleObj.presale.walletCap, this.presaleObj.presale.tokenAmount,
                                this.standardAsaBlockchainObject!.stakingContractId, this.standardAsaBlockchainObject!.poolRewards, this.standardAsaBlockchainObject!.poolInterval, this.standardAsaBlockchainObject!.poolStart, this.standardAsaBlockchainObject!.rewardsPerInterval, 
                                this.presaleObj.presale.vestingRelease, this.presaleObj.presale.vestingReleaseInterval, this.presaleObj.presale.vestingReleaseIntervalNumber)).subscribe(
                                  (value: any) => {
                                    if (value) {
                                      console.log("successfully setuped presale and staking")
                                    }
                                  }
                                )
                            }
                          );
                        } else {
                          of(await this.deployerBC.setupAsaPresale(this.sessionWallet!, this.deployerBC.settings.contractId!, this.deployerBC.settings.assetId!,
                            this.presaleObj.presale.hardCap, this.presaleObj.presale.softCap, this.presaleObj.presale.walletCap, this.presaleObj.presale.tokenAmount,
                            undefined, undefined, undefined, undefined, undefined, this.presaleObj.presale.vestingRelease, this.presaleObj.presale.vestingReleaseInterval, this.presaleObj.presale.vestingReleaseIntervalNumber)).subscribe(
                              (value: any) => {
                                if (value) {
                                  console.log("successfully setuped presale")
                                }
                              }
                            )
                        }
                        this.GetProjectSetup(this.projectId).subscribe(
                          (value: any) => {
                            console.log("project setup in db")
                            if (this.standardAsaBlockchainObject!.poolRewards) {
                              console.log("starting add staking")
                              this.GetStakingSetup().subscribe(
                                (value: any) => {
                                  console.log("added staking")
                                }
                              );
                            }
                            console.log('setup is done')
                            this.finalStepApi = true;
                            this.isPending = false;
                            this.isFailed = false;
                          },
                          error => {
                            this.isPending = false;
                            this.isFailed = true;
                            this.finalStepApi = false;
                          }
                        )

                      }

                    }
                  },
                  error => {
                    this.isPending = false;
                    this.isFailed = true;
                    this.finalStepApi = false;
                  }
                )
              }
            )
          }, 1200)
        }
      }
    )
  }

  async DeployStandardAssetWithoutPresale() {
    this.standardAsaBlockchainObject = JSON.parse(localStorage.getItem("standardBlockchainObj")!)
    this.blockchainObj = undefined
    console.log(this.standardAsaBlockchainObject)
    this.sessionWallet = this.wallet.sessionWallet
    of(await this.deployerBC.deployStandardAsset(this.sessionWallet!, this.standardAsaBlockchainObject!)).subscribe(
      (value: any) => {
        if (value) {
          setTimeout(() => {
            this.withoutPresaleObj.asset.assetId = this.deployerBC.settings.assetId!
            this.standardAsaBlockchainObject!.assetId = this.deployerBC.settings.assetId!
            this._deployService.ProjectCreate(this.withoutPresaleObj).subscribe(
              async (value: any) => {
                if (value) {
                  this.projectId = value;
                  if (2 === 2) {
                    if (this.standardAsaBlockchainObject!.rewardsPerInterval) {
                      of(await this.deployerBC.deployStandardStaking(this.sessionWallet!)).subscribe(
                        async (value: any) => {
                          this.standardAsaBlockchainObject!.stakingContractId = this.deployerBC.settings.stakingContractId!
                          console.log(this.standardAsaBlockchainObject)
                          console.log("created staking")
                          of(await this.deployerBC.setupStandardStaking(this.sessionWallet!, this.standardAsaBlockchainObject!.stakingContractId, this.standardAsaBlockchainObject!.assetId!,
                            this.standardAsaBlockchainObject?.rewardsPerInterval!, this.standardAsaBlockchainObject?.poolRewards!, this.standardAsaBlockchainObject?.poolStart!, this.standardAsaBlockchainObject?.poolInterval!)).subscribe(
                              (value: any) => {
                                if (value) {
                                  console.log("successfully setuped staking on bc")
                                  this.GetProjectSetup(this.projectId).subscribe(
                                    (value: any) => {
                                      console.log("project setup in db")
                                      console.log("value after setup")
                                      console.log(value)
                                      console.log("starting add staking")
                                      this.GetStakingSetup().subscribe(
                                        (value: any) => {
                                          console.log("added staking")
                                        }
                                      );
                                      console.log('setup is done')
                                      this.finalStepApi = true;
                                      this.isPending = false;
                                      this.isFailed = false;
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
                      );
                    } else {
                      this.GetProjectSetup(this.projectId).subscribe(
                        (value: any) => {
                          console.log("project setup in db")
                          console.log("value after setup")
                          console.log(value)
                          console.log('setup is done')
                          this.finalStepApi = true;
                          this.isPending = false;
                          this.isFailed = false;
                        },
                        error => {
                          this.isPending = false;
                          this.isFailed = true;
                          this.finalStepApi = false;
                        }
                      )
                    }
                  }
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
}
