import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, getAlgodClient, getGlobalState, StateToObj, getIndexer, isOptedIntoApp } from "./algorand"
import * as fs from 'fs';
import {
  get_app_optin_txn,
  get_verse_app_call_txn,
  get_pay_txn,
  get_app_closeout_txn,
  get_app_call_txn,
  get_asa_optin_txn,
  get_asa_xfer_txn
} from "./transactions"
import algosdk, { Algodv2, getApplicationAddress, Indexer, seedFromMnemonic, Transaction } from 'algosdk';
import {
  DeployedAppSettings,
  platform_settings as ps
} from "./platform-conf";
import { SessionWallet } from "algorand-session-wallet"
import { Injectable } from "@angular/core";
import { compileProgram, getAppLocalStateByKey, getTransactionParams, singlePayTxnWithInvalidAuthAddress, waitForTransaction } from "../services/utils.algo";
import { BlockchainTrackInfo } from "../modules/track/track.component";
import { PresaleBlockchainInformation, PresaleEntryData } from "../modules/launchpad/launch-detail/launch-detail.component";
import { SmartToolData } from "../shared/pop-up/component/pop-up.component";
import { max } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { TradeRoutingModule } from "../modules/trade/trade-routing.module";
import { send } from "process";
import { AsaSettings } from "../modules/deploy/deploy.component";
import SuggestedParamsRequest from "algosdk/dist/types/src/client/v2/algod/suggestedParams";
import { url } from "inspector";
import { StakingModel } from "../models/stakingModel";
import { Method, smartDistributionStateKeys, stakingStateKeys, standardDistributionKeys, standardStakingKeys } from "./keys";
import { start } from "repl";
import { SIGTTIN } from "constants";
//import { showErrorToaster, showInfo } from "../Toaster";

declare const AlgoSigner: any;

export enum StateKeys {
  token_liq_key = "s1",
  algo_liq_key = "s2",
  burned_key = "bd",
  total_supply_key = "ts",
  buy_burn_key = "bb",
  sell_burn_key = "sb",
  transfer_burn_key = "trb",
  to_lp_key = "lp",
  to_backing_key = "tb",
  max_buy_key = "mb",
  burn_addr_key = "ba",
  asset_id_key = "asa",
  verse_asset_id_key = "vasa",
  verse_app_id_key = "vid",
  verse_backing_app_id_key = "vbid",
  verse_backing_key = "vb",
  platform_fee_address_key = "fa",
  flat_fee_key = "f",
  trading_start_key = "t",
  user_borrowed_key = "ub",
  user_supplied_key = "us",
  total_borrowed_key = "tbw",

  presale_start_key = "ps",
  presale_end_key = "pe",
  presale_hard_cap_key = "phc",
  presale_soft_cap_key = "psc",
  presale_wallet_cap_key = "pwc",
  presale_to_liq_key = "ptl",
  presale_contribution_key = "pc",
  presale_total_raised = "pr",
  presale_token_amount = "pta",
  presale_finished_key = "pf",
  extra_fee_time_key = "eft",
  presale_vesting_release_key = "pvr",
  presale_vesting_interval__length_key = "pvil",
  presalve_vesting_interval_numbers_key = "pvin",
  vesting_user_claims_key = "cv"
}

export enum DeployerMethod {
  Transfer = "transfer",
  Buy = "buy",
  Sell = "sell",
  GetBacking = "get_backing",
  Borrow = "borrow",
  Repay = "repay",
  Create = "create",
  Setup = "setup",
  Resetup = "resetup_presale",
  RemoveMaxBuy = "remove_max_buy",
  BuyPresale = "buy_presale",
  ClaimPresale = "claim_presale",
  SetupStaking = "setup_staking",
  SetupDistrbution = "setup_distribution",
  ClaimStaking = "claim",
  SetupLock = "setup_lock"
}

export type ClaimState = {
  canParticipate: boolean,
  canClaim: boolean,
  optedIn: boolean,
  isFinished: boolean,
  hasStarted: boolean
}

@Injectable({
  providedIn: 'root'
})

export class DeployedApp {
  settings: DeployedAppSettings;

  constructor(
  ) {
    this.settings = <DeployedAppSettings>{};
  }

  async deploy(wallet: SessionWallet, settings: DeployedAppSettings) {
    this.settings = settings;
    const suggested = await getSuggested(30)
    // console.log(suggested)
    // console.log('wallet', wallet)
    const addr = wallet.getDefaultAccount()
    // console.log('addr', addr)
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr]
    const args = [algosdk.encodeUint64(this.settings.totalSupply), algosdk.encodeUint64(this.settings.buyBurn), algosdk.encodeUint64(this.settings.sellBurn),
                  algosdk.encodeUint64(this.settings.transferBurn), algosdk.encodeUint64(this.settings.toLp), algosdk.encodeUint64(this.settings.toBacking),
                  algosdk.encodeUint64(this.settings.maxBuy)]
    
    if(settings.additionalFee) {
      console.log(settings.additionalFeeAddress)
      args.push(algosdk.encodeUint64(settings.additionalFee))
      accounts.push(settings.additionalFeeAddress!)
    }

    if(settings.presaleSettings) {
      args.push(algosdk.encodeUint64(settings.presaleSettings.presaleStart), algosdk.encodeUint64(settings.presaleSettings.presaleEnd))
    }

    const assets = [ps.platform.verse_asset_id]
    const apps = [ps.platform.verse_app_id, ps.platform.backing_id, ps.platform.locker_id]

    const approval = await (await fetch('../../assets/contracts/deployer_token_approval.teal')).text()
    //// console.log('approval', approval)
    const clear = await (await fetch('../../assets/contracts/deployer_token_clear.teal')).text()
    //// console.log('clear', clear)

    const createApp = algosdk.makeApplicationCreateTxnFromObject({
        from: wallet.getDefaultAccount(),
        approvalProgram: await compileProgram(approval),
        clearProgram: await compileProgram(clear),
        numGlobalInts: 34,
        numGlobalByteSlices: 3,
        numLocalInts: 4,
        numLocalByteSlices: 0,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        note: new Uint8Array(Buffer.from("Deploy App")),
        appArgs: args,
        foreignApps: apps,
        accounts: accounts,
        foreignAssets: assets,
        extraPages: 2,
        suggestedParams: suggested,
    })

    const [signedTxns] = await wallet.signTxn([createApp])
    
    //const result = await getAlgodClient().sendRawTransaction(signedTxns.blob).do();
    //await waitForTransaction(getAlgodClient(), result.txId);

    const result = await sendWait([signedTxns])
    //const txRes = await getAlgodClient().pendingTransactionInformation(result.txId).do();
    //// console.log('appCreateResult', txRes);

    this.settings.contractId = result['application-index'];
    this.settings.contractAddress = algosdk.getApplicationAddress(BigInt( result['application-index'] ));
    return result
  }

  async mint(wallet: SessionWallet, settings: DeployedAppSettings) {
    const client = getAlgodClient()
    this.settings = settings;
    const suggested = await getSuggested(30)
    const addr = wallet.getDefaultAccount()

    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contractAddress, 201_000))

    const args = [new Uint8Array(Buffer.from(DeployerMethod.Create)), new Uint8Array(Buffer.from(this.settings.name)), new Uint8Array(Buffer.from(this.settings.unit)), 
      algosdk.encodeUint64(this.settings.decimals), new Uint8Array(Buffer.from(this.settings.url))]
    const mint = new Transaction(get_app_call_txn(suggested, addr, this.settings.contractId, args, undefined, undefined, undefined))

    const grouped = [pay, mint]

    algosdk.assignGroupID(grouped)
    
    const [signedPay, signedMint] = await wallet.signTxn([pay, mint])
    const result = await sendWait([signedPay, signedMint])
    const txId = mint.txID()
    let pending = await client.pendingTransactionInformation(txId).do()
    // console.log(pending)
    this.settings.assetId = pending['inner-txns'][0]['asset-index']

    return result
  }

  async payAndOptInBurn(wallet: SessionWallet, settings: DeployedAppSettings): Promise<any> {
    let client = getAlgodClient()
    this.settings = settings;
    const suggested = await getSuggested(30)
    const addr = wallet.getDefaultAccount()

    const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.burn_addr, 101_000))

    const optIn = new Transaction(get_asa_optin_txn(suggested, ps.platform.burn_addr, this.settings.assetId))

    const grouped = [pay, optIn]

    algosdk.assignGroupID(grouped)

    const [signedPay] = await wallet.signTxn([pay])

    const burn_teal = await (await fetch('../../assets/contracts/burn_escrow.teal')).text()
    const results = await client.compile(burn_teal).do();
    const program = new Uint8Array(Buffer.from(results.result , "base64"));

    const burn_lsig = new algosdk.LogicSigAccount(program)

    const signedOptIn = algosdk.signLogicSigTransactionObject(optIn, burn_lsig)
    const result = await sendWait([signedPay, signedOptIn])

    return result
  }

  async setupNoPresale(wallet: SessionWallet, settings: DeployedAppSettings): Promise<any> {
    this.settings = settings;
    const suggested = await getSuggested(30)
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()
    
    let accounts = []
    let algoAmountToSend = this.settings.initialAlgoLiqWithFee
    if(this.settings.rewardsPerInterval) {
      suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE
      accounts = [ps.platform.fee_addr, ps.platform.burn_addr, getApplicationAddress(this.settings.stakingContractId!)]
      if(settings.poolRewards! >= Math.floor(0.03 * settings.totalSupply)) {
        algoAmountToSend = this.settings.initialAlgoLiq
      }
    } else {
      suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
      accounts = [ps.platform.fee_addr, ps.platform.burn_addr]
    }

    suggested.flatFee = true
    
    let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(this.settings.initialTokenLiq), algosdk.encodeUint64(this.settings.tradingStart), algosdk.encodeUint64(this.settings.extraFeeTime)]
    let assets = [this.settings.assetId]
    const setup = new Transaction(get_app_call_txn(suggested, addr, this.settings.contractId, args, undefined, assets, accounts))

    // console.log(this.settings.initial_algo_liq_with_fee)
    suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contractAddress, algoAmountToSend))

    const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.assetId))
    const grouped = [creatorOptin, pay, setup]

    if(this.settings.rewardsPerInterval){
      suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
      let setupPay = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(this.settings.stakingContractId!), 200000))

      const apps = [this.settings.contractId!, ps.platform.staking_id]
      const stakingAssets = [this.settings.assetId!, ps.platform.verse_asset_id]
      const stakingArgs = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(this.settings.poolRewards!), 
        algosdk.encodeUint64(this.settings.rewardsPerInterval!), algosdk.encodeUint64(this.settings.poolStart!), algosdk.encodeUint64(this.settings.poolInterval!)]
      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      let txn = new Transaction(get_app_call_txn(suggested, addr, this.settings.stakingContractId, stakingArgs, apps, stakingAssets, undefined))
      grouped.unshift(setupPay, txn)
      console.log(grouped)
    }
  
    algosdk.assignGroupID(grouped)

    const signedGroup = await wallet.signTxn(grouped)
    signedGroup.forEach(element => {
      console.log(element.txID)
    });

    const result = await sendWait(signedGroup)
    return result
  }

  async setupWithPresale(wallet: SessionWallet, settings: DeployedAppSettings): Promise<any> {
    this.settings = settings;
    const suggested = await getSuggested(30)
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    let accounts = []
    if(this.settings.rewardsPerInterval) {
      suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE
      accounts = [ps.platform.fee_addr, ps.platform.burn_addr, getApplicationAddress(this.settings.stakingContractId!)]
    } else {
      suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
      accounts = [ps.platform.fee_addr, ps.platform.burn_addr]
    }

    let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(this.settings.initialTokenLiq), algosdk.encodeUint64(this.settings.tradingStart), 
      algosdk.encodeUint64(this.settings.extraFeeTime), algosdk.encodeUint64(this.settings.presaleSettings!.softcap), algosdk.encodeUint64(this.settings.presaleSettings!.hardcap),
      algosdk.encodeUint64(this.settings.presaleSettings!.walletcap), algosdk.encodeUint64(this.settings.presaleSettings!.toLp), algosdk.encodeUint64(this.settings.presaleSettings!.presaleTokenAmount)]

    if (settings.presaleSettings?.vestingRelease) {
      args.push(algosdk.encodeUint64(settings.presaleSettings.vestingRelease!), algosdk.encodeUint64(settings.presaleSettings.vestingReleaseInterval!), algosdk.encodeUint64(settings.presaleSettings.vestingReleaseIntervalNumber!))
    }

    let assets = [this.settings.assetId]
    const setup = new Transaction(get_app_call_txn(suggested, addr, this.settings.contractId, args, undefined, assets, accounts))

    suggested.fee = 1 * algosdk.ALGORAND_MIN_TX_FEE
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contractAddress, this.settings.initialAlgoLiqWithFee))

    const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.assetId))

    const grouped = [creatorOptin, pay, setup]

    if(this.settings.rewardsPerInterval){
      suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
      let setupPay = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(this.settings.stakingContractId!), 200000))

      const apps = [this.settings.contractId!, ps.platform.staking_id]
      const stakingAssets = [this.settings.assetId!, ps.platform.verse_asset_id]
      const stakingArgs = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(this.settings.poolRewards!), algosdk.encodeUint64(this.settings.rewardsPerInterval!), algosdk.encodeUint64(this.settings.poolStart!), algosdk.encodeUint64(this.settings.poolInterval!)]
      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      suggested.flatFee = true
      let txn = new Transaction(get_app_call_txn(suggested, addr, this.settings.stakingContractId, stakingArgs, apps, stakingAssets, undefined))
      grouped.unshift(setupPay, txn)
      console.log(grouped)
    }

    algosdk.assignGroupID(grouped)

    const signedGrouped = await wallet.signTxn(grouped)

    const result = await sendWait(signedGrouped)

    return result
  }

  async deployStandardAsset(wallet: SessionWallet, settings: AsaSettings): Promise<any> {
    const addr = wallet.getDefaultAccount()
    let suggested = await getSuggested(10)

    let createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      decimals: settings.decimals,
      defaultFrozen: false,
      from: addr,
      suggestedParams: suggested,
      total: settings.totalSupply,
      assetName: settings.name,
      unitName: settings.unit,
      assetURL: settings.url,
    })

    let signed = await wallet.signTxn([createTxn])
    let response = await sendWait(signed)
    console.log(response)
    this.settings.assetId = response['asset-index']
    return response
  }

  // Deploy Staking
  async deploySmartStaking(wallet: SessionWallet) {
    const addr = wallet.getDefaultAccount()
    const suggested = await getSuggested(10)

    const approval = await (await fetch('../../assets/contracts/smart_staking_approval.teal')).text()
    //// console.log('approval', approval)
    const clear = await (await fetch('../../assets/contracts/smart_staking_clear_state.teal')).text()

    let createApp = algosdk.makeApplicationCreateTxnFromObject({
      from: addr,
      approvalProgram: await compileProgram(approval),
      clearProgram: await compileProgram(clear),
      numGlobalInts: 9,
      numGlobalByteSlices: 0,
      numLocalInts: 1,
      numLocalByteSlices: 0,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      note: new Uint8Array(Buffer.from("Deploy Staking App")),
      suggestedParams: suggested,
    })
    let [signed] = await wallet.signTxn([createApp])
    let response = await sendWait([signed])
    this.settings.stakingContractId = response['application-index']
    return response
  }

  async setupSmartStaking(wallet: SessionWallet, contractId: number, assetId: number, assetContractId: number, rewardsPerInterval: number, 
    totalRewards: number, start: number, periodTime: number) {
      let addr = wallet.getDefaultAccount()
      let suggested = await getSuggested(10)
      suggested.flatFee = true

      let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 200000))

      let assets = [assetId, ps.platform.verse_asset_id]
      let apps = [assetContractId, ps.platform.staking_id]
      let accounts = [ps.platform.burn_addr]
      let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(totalRewards), algosdk.encodeUint64(rewardsPerInterval), algosdk.encodeUint64(start),
                  algosdk.encodeUint64(periodTime)]
      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      let stakingTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, accounts))
      
      args = [new Uint8Array(Buffer.from(DeployerMethod.SetupStaking))]
      accounts = [getApplicationAddress(contractId)]
      let setupStaking = new Transaction(get_app_call_txn(suggested, addr, assetContractId, args, undefined, assets, accounts))
      
      let grouped = [payTxn, stakingTxn, setupStaking]
      algosdk.assignGroupID(grouped)

      let signed = await wallet.signTxn(grouped)
      let response = await sendWait(signed)
      return response
  }

  // TODO
  async deploySmartDistributionStaking(wallet: SessionWallet) {
    const addr = wallet.getDefaultAccount()
    const suggested = await getSuggested(10)

    const approval = await (await fetch('../../assets/contracts/smart_distribution_approval.teal')).text()
    //// console.log('approval', approval)
    const clear = await (await fetch('../../assets/contracts/smart_distribution_clear_state.teal')).text()

    let createApp = algosdk.makeApplicationCreateTxnFromObject({
      from: addr,
      approvalProgram: await compileProgram(approval),
      clearProgram: await compileProgram(clear),
      numGlobalInts: 9,
      numGlobalByteSlices: 1,
      numLocalInts: 2,
      numLocalByteSlices: 0,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      note: new Uint8Array(Buffer.from("Deploy Staking App")),
      suggestedParams: suggested,
    })
    let [signed] = await wallet.signTxn([createApp])
    let response = await sendWait([signed])
    this.settings.stakingContractId = response['application-index']
    return response
  }

  async setupSmartDistributionStaking(wallet: SessionWallet, contractId: number, assetId: number, assetContractId: number, rewardsPerInterval: number, 
    totalRewards: number, start: number, periodTime: number) {
      let addr = wallet.getDefaultAccount()
      let suggested = await getSuggested(10)

      let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 200000))

      let assets = [assetId]
      let apps = [assetContractId]
      let accounts = [ps.platform.burn_addr]
      let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(totalRewards), algosdk.encodeUint64(rewardsPerInterval), algosdk.encodeUint64(start),
                  algosdk.encodeUint64(periodTime)]
      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      suggested.flatFee = true
      let stakingTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, accounts))
      
      args = [new Uint8Array(Buffer.from(DeployerMethod.SetupDistrbution))]
      accounts = [getApplicationAddress(contractId)]
      let setupStaking = new Transaction(get_app_call_txn(suggested, addr, assetContractId, args, undefined, assets, accounts))
      
      let grouped = [payTxn, stakingTxn, setupStaking]
      algosdk.assignGroupID(grouped)

      let signed = await wallet.signTxn(grouped)
      let response = await sendWait(signed)
      return response
  }

    // Deploy Staking
    async deployStandardStaking(wallet: SessionWallet) {
      const addr = wallet.getDefaultAccount()
      const suggested = await getSuggested(10)
  
      const approval = await (await fetch('../../assets/contracts/standard_staking_approval.teal')).text()
      //// console.log('approval', approval)
      const clear = await (await fetch('../../assets/contracts/standard_staking_clear_state.teal')).text()
  
      let createApp = algosdk.makeApplicationCreateTxnFromObject({
        from: addr,
        approvalProgram: await compileProgram(approval),
        clearProgram: await compileProgram(clear),
        numGlobalInts: 8,
        numGlobalByteSlices: 0,
        numLocalInts: 1,
        numLocalByteSlices: 0,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        note: new Uint8Array(Buffer.from("Deploy Staking App")),
        suggestedParams: suggested,
      })
      let [signed] = await wallet.signTxn([createApp])
      let response = await sendWait([signed])
      this.settings.stakingContractId = response['application-index']
      return response
    }
  
    async setupStandardStaking(wallet: SessionWallet, contractId: number, assetId: number, rewardsPerInterval: number, 
      totalRewards: number, start: number, periodTime: number) {
        let addr = wallet.getDefaultAccount()
        let suggested = await getSuggested(10)
        suggested.flatFee = true

        let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 200000))
  
        let assets = [assetId, ps.platform.verse_asset_id]
        let apps = [ps.platform.staking_id]
        let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(rewardsPerInterval), algosdk.encodeUint64(start),
        algosdk.encodeUint64(periodTime)]
        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        let stakingTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, undefined))

        suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
        let sendAssetTxn = new Transaction(get_asa_xfer_txn(suggested, addr, getApplicationAddress(contractId), assetId, totalRewards))

        let grouped  =[payTxn, stakingTxn, sendAssetTxn]
        algosdk.assignGroupID(grouped)
  
        let signed = await wallet.signTxn(grouped)
        let response = await sendWait(signed)
        return response
    }

    // TODO
    async deployStandardDistributionStaking(wallet: SessionWallet) {
      const addr = wallet.getDefaultAccount()
      const suggested = await getSuggested(10)
  
      const approval = await (await fetch('../../assets/contracts/standard_distribution_approval.teal')).text()
      //// console.log('approval', approval)
      const clear = await (await fetch('../../assets/contracts/standard_distribution_clear_state.teal')).text()
  
      let createApp = algosdk.makeApplicationCreateTxnFromObject({
        from: addr,
        approvalProgram: await compileProgram(approval),
        clearProgram: await compileProgram(clear),
        numGlobalInts: 8,
        numGlobalByteSlices: 0,
        numLocalInts: 2,
        numLocalByteSlices: 0,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        note: new Uint8Array(Buffer.from("Deploy Staking App")),
        suggestedParams: suggested,
      })
      let [signed] = await wallet.signTxn([createApp])
      let response = await sendWait([signed])
      this.settings.stakingContractId = response['application-index']
      return response
    }
  
    async setupStandardDistributionStaking(wallet: SessionWallet, contractId: number, assetId: number, rewardsPerInterval: number, 
      totalRewards: number, start: number, periodTime: number) {
        let addr = wallet.getDefaultAccount()
        let suggested = await getSuggested(10)
        suggested.flatFee = true

        let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 200000))
  
        let assets = [assetId]
        let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(rewardsPerInterval), algosdk.encodeUint64(start),
                    algosdk.encodeUint64(periodTime)]
        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        let stakingTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, undefined))

        suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
        let sendAssetTxn = new Transaction(get_asa_xfer_txn(suggested, addr, getApplicationAddress(contractId), assetId, totalRewards))

        let grouped  =[payTxn, stakingTxn, sendAssetTxn]
        algosdk.assignGroupID(grouped)
  
        let signed = await wallet.signTxn(grouped)
        let response = await sendWait(signed)
        return response
    }

    async claimStaking(wallet: SessionWallet, contractId: number, assetId: number, smartAssetContractId?: number) {
      let addr = wallet.getDefaultAccount()
      let suggested = await getSuggested(10)

      let assets = [assetId, ps.platform.verse_asset_id]
      let args = [new Uint8Array(Buffer.from(DeployerMethod.ClaimStaking))]

      if(smartAssetContractId){
        let apps = [smartAssetContractId, ps.platform.staking_id]
        let txn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, undefined))

        let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 2 * algosdk.ALGORAND_MIN_TX_FEE))
        algosdk.assignGroupID([payTxn, txn])
        let signed = await wallet.signTxn([payTxn, txn])
        let response = await sendWait(signed)
        return response
      } else {
        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        suggested.flatFee = true
        let apps = [ps.platform.staking_id]
        let txn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, undefined))
        let signed = await wallet.signTxn([txn])
        let response = await sendWait(signed)
        return response
      }
      
    }

  /// api calls for each steps of this calls

  // /project/create - without presale
  // /project/presale/create - with presale
  // 2 - mint
  // 3 - optedIn/burn -- will be added soon (projectId: argument) => any
  // 4 - setup (will be added one more);  (project/setup - if it's  not)
  // anouther container for a blockchain state of ngrx

  ////  deploy-api-logic-file page end here ------------

  async buyPresale(wallet: SessionWallet, amount: number, contractId: number): Promise<any> {
    const suggested = await getSuggested(30)
    suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.BuyPresale))]

    const buy = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, undefined, undefined))
    const pay = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), amount))

    const grouped = [buy, pay]

    algosdk.assignGroupID(grouped)

    const [signedBuy, signedPay] = await wallet.signTxn([buy, pay])
    const result = await sendWait([signedBuy, signedPay])

    return result
  }

  async claimPresale(wallet: SessionWallet, contractId: number): Promise<any> {

    let globalState = StateToObj(await getGlobalState(contractId), StateKeys)
    let client: Algodv2 = getAlgodClient()
    let appInfo = await client.getApplicationByID(contractId).do()
    console.log(appInfo)
    const suggested = await getSuggested(30)
    suggested.fee = 5 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.ClaimPresale))]
    const assets = [globalState[StateKeys.asset_id_key]['i']]
    const accounts = [ps.platform.burn_addr, appInfo['params']['creator'], ps.platform.fee_addr]

    const claim = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, accounts))

    const signedClaim = await wallet.signTxn([claim])
    const result = await sendWait(signedClaim)

    return result
  }

  async resetupPresaleToFairLaunch(wallet: SessionWallet, tradingStart: number, tokenLiq: number, algoLiq: number, contractId: number, assetId: number ): Promise<any> {
    
    let globalState = StateToObj(await getGlobalState(contractId), StateKeys)
    console.log(globalState)
    let extraFeeTime = globalState[StateKeys.extra_fee_time_key]['i']
    let initialAlgoLiq = globalState[StateKeys.algo_liq_key]['i']
    let initialTokenLiq = globalState[StateKeys.token_liq_key]['i']
    let suggested = await getSuggested(30)
    suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    if(algoLiq > initialAlgoLiq) {
      suggested.fee += algosdk.ALGORAND_MIN_TX_FEE
    }
    if(tokenLiq != initialTokenLiq) {
      suggested.fee += algosdk.ALGORAND_MIN_TX_FEE
    }
    const addr = wallet.getDefaultAccount()
    const assets = [globalState[StateKeys.asset_id_key]['i']]
    const accounts = [ps.platform.fee_addr]
    const args = [new Uint8Array(Buffer.from(DeployerMethod.Resetup)), algosdk.encodeUint64(tradingStart), algosdk.encodeUint64(tokenLiq), algosdk.encodeUint64(extraFeeTime)]

    const resetup = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, accounts))

    if (algoLiq > initialAlgoLiq) {
      suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
      let addedLiq = Math.floor((algoLiq - initialAlgoLiq) / (1 - environment.Y_FEE))
      const pay = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), addedLiq))
      algosdk.assignGroupID([pay, resetup])
      const [signedPay, signedResetup] = await wallet.signTxn([pay, resetup])
      const result = await sendWait([signedPay, signedResetup])
      return result
    } else {
      const signedResetup = await wallet.signTxn([resetup])
      const result = await sendWait([signedResetup])
      return result
    }
  }

  async resetupPresale(wallet: SessionWallet, softCap: number, hardCap: number, presaleStart: number, presaleEnd: number, walletCap: number,
    toLiq: number, tradingStart: number, presaleTokenAmount: number, tokenLiquidity: number, algoLiquidity: number, contractId: number, assetId: number,
    release: number | undefined, releaseInterval: number | undefined, releaseIntervalNumbers: number | undefined): Promise<any> {
    
      let globalState = StateToObj(await getGlobalState(contractId), StateKeys)

      console.log(globalState)
      console.log("tradestart: " + tradingStart)      
      console.log("presale start: " + presaleStart)      
      console.log("presale end: " + presaleEnd)      
      console.log("hardcap: " + hardCap)      
      console.log("softcap: " + softCap)      
      console.log("presale tok amount: " + presaleTokenAmount)      
      console.log("token liq: " + tokenLiquidity)      
      console.log("algoliq: " + algoLiquidity)      

      let extraFeeTime = globalState[StateKeys.extra_fee_time_key]['i']
      let initialAlgoLiq = globalState[StateKeys.algo_liq_key]['i']
      let initialTokenLiq = globalState[StateKeys.token_liq_key]['i']
      
      const suggestedExtraFee = await getSuggested(30)
      suggestedExtraFee.fee = algosdk.ALGORAND_MIN_TX_FEE
      suggestedExtraFee.flatFee = true
      // suggestedExtraFee.flatFee = true
      const addr = wallet.getDefaultAccount()

      let payTxn = null;
      if(algoLiquidity > initialAlgoLiq){
        let addedLiq = Math.floor((algoLiquidity - initialAlgoLiq) / (1 - environment.Y_FEE))
        payTxn = new Transaction(get_pay_txn(suggestedExtraFee, addr, getApplicationAddress(contractId), addedLiq))
        suggestedExtraFee.fee += algosdk.ALGORAND_MIN_TX_FEE
      }

      if(tokenLiquidity > initialTokenLiq) {
        suggestedExtraFee.fee += algosdk.ALGORAND_MIN_TX_FEE
      }

      const accs = [ps.platform.fee_addr]
      const args = [new Uint8Array(Buffer.from(DeployerMethod.Resetup)), algosdk.encodeUint64(softCap), algosdk.encodeUint64(hardCap), 
        algosdk.encodeUint64(presaleStart), algosdk.encodeUint64(presaleEnd), algosdk.encodeUint64(walletCap),
        algosdk.encodeUint64(toLiq), algosdk.encodeUint64(tradingStart), algosdk.encodeUint64(presaleTokenAmount), algosdk.encodeUint64(extraFeeTime)]
      const assets = [assetId]
      
      if(release && releaseInterval && releaseIntervalNumbers) {
        args.push(algosdk.encodeUint64(release), algosdk.encodeUint64(releaseInterval), algosdk.encodeUint64(releaseIntervalNumbers))
      }
      
      const resetup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, contractId, args, undefined, assets, accs))
      
      let result;
      if(payTxn) {
        algosdk.assignGroupID([resetup, payTxn])
        const signedGrp = await wallet.signTxn([resetup, payTxn])
        result = await sendWait(signedGrp)
      } else {

        const signedResetup = await wallet.signTxn([resetup])
        result = await sendWait([signedResetup])
      }

      return result
  }

  async optIn(wallet: SessionWallet, contractId: number): Promise<any> {
    const suggested = await getSuggested(30)
    const addr = wallet.getDefaultAccount()

    const optin = new Transaction(get_app_optin_txn(suggested, addr, contractId))
    const [signed] = await wallet.signTxn([optin])
    const result = await sendWait([signed])

    return result
  }
  // also in token or project page (same page)
  async optOut(wallet: SessionWallet, contractId: number): Promise<any> {
    const suggested = await getSuggested(30)
    const addr = wallet.getDefaultAccount()

    const optout = new Transaction(get_app_closeout_txn(suggested, addr, this.settings.contractId))
    const [signed] = await wallet.signTxn([optout])
    const result = await sendWait([signed])
    // some popup info mmanagaer in sendWait

    return result
  }
  // presale page ended here
  // token page  (your wallet)
  async removeMaxBuy(wallet: SessionWallet, contractId: number): Promise<any> {
    const suggested = await getSuggested(30)
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.RemoveMaxBuy))]

    const remove = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, undefined, undefined))

    const signedRemove = await wallet.signTxn([remove])
    const result = await sendWait(signedRemove)

    return result
  }
  // #token page  (your wallet)
  // trade page
  async buy(wallet: SessionWallet, algoAmount: number, slippage: number, wantedReturn: number, settings: DeployedAppSettings): Promise<any> {
    this.settings = settings
    const suggested = await getSuggested(30)
    suggested.fee = 5 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.Buy)), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr, ps.platform.verse_app_addr]
    const assets = [this.settings.assetId, ps.platform.verse_asset_id]
    const apps = [ps.platform.verse_app_id]

    const buy = new Transaction(get_app_call_txn(suggested, addr, this.settings.contractId, args, apps, assets, accounts))
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contractAddress, algoAmount))

    const grouped = [pay, buy]

    algosdk.assignGroupID(grouped)

    const [signedPay, signedBuy] = await wallet.signTxn([pay, buy])
    const result = await sendWait([signedPay, signedBuy])

    return result
  }

  async sell(wallet: SessionWallet, tokenAmount: number, slippage: number, wantedReturn: number, settings: DeployedAppSettings): Promise<any> {
    this.settings = settings
    const suggested = await getSuggested(30)
    suggested.fee = 6 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.Sell)), algosdk.encodeUint64(tokenAmount), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr, ps.platform.backing_addr]
    const assets = [this.settings.assetId, ps.platform.verse_asset_id]

    const sell = new Transaction(get_app_call_txn(suggested, addr, this.settings.contractId, args, undefined, assets, accounts))
    const [signed] = await wallet.signTxn([sell])
    const result = await sendWait([signed])

    return result
  }
  // #trade page
  // transfer page
  async transfer(wallet: SessionWallet, tokenAmount: number, to: string, assetId: number, contractId: number): Promise<any> {
    const suggested = await getSuggested(30)
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.Transfer)), algosdk.encodeUint64(tokenAmount)]

    const accounts = [ps.platform.burn_addr, to]
    const assets = [assetId]

    const send = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, accounts))
    const [signed] = await wallet.signTxn([send])
    const result = await sendWait([signed])

    return result
  }
  // #transfer page
  // trade and token page
  async getBacking(wallet: SessionWallet, tokenAmount: number, contractId: number): Promise<any> {
    let globalState = StateToObj(await getGlobalState(contractId), StateKeys)
    
    const suggested = await getSuggested(30)
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.GetBacking)), algosdk.encodeUint64(tokenAmount)]
    const accounts = [ps.platform.burn_addr]
    const assets = [globalState[StateKeys.asset_id_key]['i']]

    const backing = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, accounts))
    const [signed] = await wallet.signTxn([backing])
    const result = await sendWait([signed])

    return result
  }

  async borrow(wallet: SessionWallet, tokenAmount: number, contractId: number): Promise<any> {
    let globalState = StateToObj(await getGlobalState(contractId), StateKeys)
    const suggested = await getSuggested(30)
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()
    let assetId = globalState[StateKeys.asset_id_key]['i']

    const args = [new Uint8Array(Buffer.from(DeployerMethod.Borrow)), algosdk.encodeUint64(tokenAmount)]
    const assets = [assetId]

    const borrow = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, undefined))
    const [signed] = await wallet.signTxn([borrow])
    const result = await sendWait([signed])

    return result
  }

  async repay(wallet: SessionWallet, algoAmount: number, contractId: number): Promise<any> {
    let globalState = StateToObj(await getGlobalState(contractId), StateKeys)
    let assetId = globalState[StateKeys.asset_id_key]['i']
    const suggested = await getSuggested(30)
    suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(DeployerMethod.Repay))]
    const assets = [assetId]

    const repay = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, undefined))
    const pay = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), algoAmount))

    const grouped = [repay, pay]

    algosdk.assignGroupID(grouped)

    const [signedRepay, signedPay] = await wallet.signTxn([repay, pay])
    const result = await sendWait([signedRepay, signedPay])

    return result
  }
  // trade and token page

  // in final we gonna do one more call for blockchain in trad epoage to calculate

  async getContractGlobalState(contractId: number){
    var globalState = StateToObj(await getGlobalState(contractId), StateKeys)
    // console.log(globalState)
    return globalState
  }

  async getBlockchainInformation(contractId: number) {
    let client: Algodv2 = getAlgodClient()
    let appState: any = await this.getContractGlobalState(contractId)
    let appInfo = await client.accountInformation(getApplicationAddress(contractId)).do()
    let assetInfo = await client.getAssetByID(appState[StateKeys.asset_id_key]['i']).do()

    let algoLiquidity = appState[StateKeys.algo_liq_key]['i']
    let tokenLiquidity = appState[StateKeys.token_liq_key]['i']
    let totalSupply = appState[StateKeys.total_supply_key]['i'] / Math.pow(10, assetInfo.params.decimals)
    let totalBacking = (appInfo['amount'] - appInfo['min-balance'] - algoLiquidity + appState[StateKeys.total_borrowed_key]['i']) / Math.pow(10, 6)
    let totalBorrowedAlgo = appState[StateKeys.total_borrowed_key]['i']
    let maxBuy = appState[StateKeys.max_buy_key]['i']

    return {
        algoLiquidity: algoLiquidity,
        tokenLiquidity: tokenLiquidity,
        totalsupply: totalSupply,
        totalBacking: totalBacking,
        totalBorrowedAlgo: totalBorrowedAlgo,
        maxBuy: maxBuy
    }
  }

  async optInAsset(wallet: SessionWallet, assetId: number) {
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()
    const optin = new Transaction(get_asa_optin_txn(suggested, addr, assetId))
    const [signed] = await wallet.signTxn([optin])
    const result = await sendWait([signed])

    return result
  }

  async getTrackInfo(wallet: string, contractId: number) : Promise<BlockchainTrackInfo> {

    let client: Algodv2 = getAlgodClient()
    let globalState: any = await this.getContractGlobalState(contractId)
    let appAccInfo: any = await client.accountInformation(getApplicationAddress(contractId)).do()
    let accountInfo: any = await client.accountInformation(wallet).do()
    let assetInfo: any = await client.getAssetByID(globalState[StateKeys.asset_id_key]['i']).do()
    // console.log(appAccInfo)

    let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
      return el['asset-id'] == globalState[StateKeys.asset_id_key]['i']
    })
    let holding = 0
    if(asset){
        holding = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
    }

    let algoLiquidity = globalState[StateKeys.algo_liq_key]['i'] / 1_000_000
    let tokenLiquidity = globalState[StateKeys.token_liq_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let totalSupply = globalState[StateKeys.total_supply_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let totalBacking = (appAccInfo['amount'] - appAccInfo['min-balance'] - algoLiquidity * 1_000_000 + globalState[StateKeys.total_borrowed_key]['i']) / 1_000_000
    let marketCap = algoLiquidity / tokenLiquidity * totalSupply
    let price = algoLiquidity / tokenLiquidity
    let burned = globalState[StateKeys.burned_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let tradingStart = globalState[StateKeys.trading_start_key]['i']
    let indexer: Indexer = getIndexer()

    const health = await indexer.makeHealthCheck().do()
    // console.log(health)
    let holderInfo = await indexer.lookupAssetBalances(globalState[StateKeys.asset_id_key]['i']).currencyGreaterThan(0).do()
    // console.log(holderInfo)
    let holders = holderInfo.length
    // console.log(holders)

    let trackInfo: BlockchainTrackInfo = {
        algoLiq: algoLiquidity,
        tokenLiq: tokenLiquidity,
        totalSupply: totalSupply,
        totalBacking: totalBacking,
        marketCap: marketCap,
        burned: burned,
        holding: holding,
        holders: holders,
        price: price,
        tradingStart: tradingStart
    }

    // console.log(trackInfo)

    return trackInfo
  }

  async getPresaleInfo(contractId: number): Promise<PresaleBlockchainInformation> {
    let client: Algodv2 = getAlgodClient()
    let globalState: any = await this.getContractGlobalState(contractId)
    let appAccInfo: any = await client.accountInformation(getApplicationAddress(contractId)).do()
    let assetInfo: any = await client.getAssetByID(globalState[StateKeys.asset_id_key]['i']).do()

    let algoLiquidity = globalState[StateKeys.algo_liq_key]['i'] / 1_000_000
    let tokenLiquidity = globalState[StateKeys.token_liq_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let totalSupply = globalState[StateKeys.total_supply_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let price = algoLiquidity / tokenLiquidity
    let burned = globalState[StateKeys.burned_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let tradingStart = globalState[StateKeys.trading_start_key]['i']
    let tokensInPresale = globalState[StateKeys.presale_token_amount]['i'] / Math.pow(10, assetInfo['params']['decimals'])
    let presaleFundsToLiquidityPercentage = globalState[StateKeys.presale_to_liq_key]['i'] / 10000
    let saleEnd = globalState[StateKeys.presale_end_key]['i']
    let saleStart = globalState[StateKeys.presale_start_key]['i']
    let softCap = globalState[StateKeys.presale_soft_cap_key]['i'] / 1_000_000
    let hardCap = globalState[StateKeys.presale_hard_cap_key]['i'] / 1_000_000
    let walletCap = globalState[StateKeys.presale_wallet_cap_key]['i'] / 1_000_000
    let totalRaised = globalState[StateKeys.presale_total_raised]['i'] / 1_000_000
    let presalePrice = hardCap / tokensInPresale
    
    let vestingRelease = globalState[StateKeys.presale_vesting_release_key]['i']
    let vestingIntervalLength = globalState[StateKeys.presale_vesting_interval__length_key]['i']
    let vestingIntervalNumbers = globalState[StateKeys.presalve_vesting_interval_numbers_key]['i']

    let presaleInfo: PresaleBlockchainInformation = {
      algoLiq: algoLiquidity,
      tokenLiq: tokenLiquidity,
      burned: burned,
      tokensInPresale: tokensInPresale,
      presaleFundsToLiqPercentage: presaleFundsToLiquidityPercentage,
      initialPrice: price,
      presalePrice: presalePrice,
      totalSupply: totalSupply,
      tradingStart: tradingStart,
      saleEnd: saleEnd,
      saleStart: saleStart,
      softCap: softCap,
      hardCap: hardCap,
      walletCap: walletCap,
      totalRaised: totalRaised,
      contractId: contractId,
      assetId: globalState[StateKeys.asset_id_key]['i'],
      vestingIntervalLength: vestingIntervalLength,
      vestingIntervalNumbers: vestingIntervalNumbers,
      vestingRelease: vestingRelease
    }
    return presaleInfo;
  }

  async getSmartToolData(contractId: number, wallet: string | null): Promise<SmartToolData> {

    let client: Algodv2 = getAlgodClient()
    let globalState: any = StateToObj(await getGlobalState(contractId), StateKeys)
    console.log(globalState)
    let assetInfo = await client.getAssetByID(globalState[StateKeys.asset_id_key]['i']).do()

    let algos = 0
    let holding = 0
    let userSupplied = 0
    let userBorrowed = 0
    let optedIn = false

    if(wallet){
      let accountInfo: any = await client.accountInformation(wallet).do()
      algos = accountInfo['amount'] / Math.pow(10, 6)
      let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
        return el['asset-id'] == globalState[StateKeys.asset_id_key]['i']
      })
      if(asset){
          holding = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
      }

      if(await isOptedIntoApp(wallet, contractId)) {
        optedIn = true
        userSupplied = await getAppLocalStateByKey(client, contractId, wallet, StateKeys.user_supplied_key) / Math.pow(10, assetInfo['params']['decimals'])
        userBorrowed = await getAppLocalStateByKey(client, contractId, wallet, StateKeys.user_borrowed_key) / Math.pow(10, 6)
        console.log(userSupplied)
        console.log(userBorrowed)
      }

    }
    
    let appInfo: any = await client.accountInformation(getApplicationAddress(contractId)).do()
    let totalBacking = (appInfo['amount'] - appInfo['min-balance'] - globalState[StateKeys.algo_liq_key]['i'] + globalState[StateKeys.total_borrowed_key]['i']) / Math.pow(10, 6)

    let totalBorrowed = globalState[StateKeys.total_borrowed_key]['i'] / Math.pow(10, 6)
    let totalSupply = globalState[StateKeys.total_supply_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])

    return {
        userBorrowed: userBorrowed,
        assetDecimals: assetInfo['params']['decimals'],
        availableTokenAmount: holding,
        availableAlgoAmount: algos,
        contractId: contractId,
        userSupplied: userSupplied,
        totalBacking: totalBacking,
        totalBorrowed: totalBorrowed,
        totalSupply: totalSupply,
        optedIn: optedIn,
        name: assetInfo['params']['name'],
        unitName: assetInfo['params']['unit-name']
    }
  }

  async getPresaleEntryData(contractId: number): Promise<PresaleEntryData> {
    
    let client: Algodv2 = getAlgodClient()
    let globalState: any = StateToObj(await getGlobalState(contractId), StateKeys)

    return {
      availableAmount: 0,
      presalePrice: 0,
      filledAmount: globalState[StateKeys.presale_total_raised]['i'],
      hardCap: globalState[StateKeys.presale_hard_cap_key]['i'],
      walletCap: globalState[StateKeys.presale_wallet_cap_key]['i'],
      assetId: globalState[StateKeys.asset_id_key]['i'],
      contractId: contractId,
      presaleId: "",
      isOptedIn: false,
      userContribution: 0
    }
  }

  async hasMaxBuy(contractId: number) {
    let globalState: any = StateToObj(await getGlobalState(contractId), StateKeys)
    let maxBuy = globalState[StateKeys.max_buy_key]['i']

    if(maxBuy >= Number.MAX_SAFE_INTEGER){
      return false
    } else {
      return true
    }
  }

  async isFailedPresale(contractId: number) {
    let globalState: any = StateToObj(await getGlobalState(contractId), StateKeys)

    let latestTimestemp = Math.floor(new Date().getTime() * 1000)
    let softCap = globalState[StateKeys.presale_soft_cap_key]['i']
    let raised = globalState[StateKeys.presale_total_raised]['i']
    let presaleEnd = globalState[StateKeys.presale_end_key]['i']

    if(presaleEnd == 0) {
      return false
    } 
    if(latestTimestemp > presaleEnd && softCap > raised) {
      return true
    } else {
      return false
    }
  }

  async isClaimablePresale(addr: string, contractId: number){
    let client: Algodv2 = getAlgodClient()
    let globalState = StateToObj(await getGlobalState(contractId), StateKeys)

    let presaleEnd = globalState[StateKeys.presale_end_key]['i']
    let presaleStart = globalState[StateKeys.presale_start_key]['i']
    let isOptedIn = await isOptedIntoApp(addr, contractId)
    let userContribution = await getAppLocalStateByKey(client, contractId, addr, StateKeys.presale_contribution_key)
    let latestTimestamp = Math.floor(Date.now() / 1000);

    let vestingRelease = globalState[StateKeys.presale_vesting_release_key]['i']
    let vestingIntervalLength = globalState[StateKeys.presale_vesting_interval__length_key]['i']
    let vestingIntervalNumbers = globalState[StateKeys.presalve_vesting_interval_numbers_key]['i']

    let vestingUserClaims = await getAppLocalStateByKey(client, contractId, addr, StateKeys.vesting_user_claims_key)
    
    let claimState: ClaimState = {
      optedIn: isOptedIn,
      canClaim: false,
      canParticipate: false,
      isFinished: false,
      hasStarted: false,
    }

    if((presaleEnd < latestTimestamp) || (presaleStart > latestTimestamp)) {
      if(presaleEnd < latestTimestamp) {
        if(userContribution > 0) {
          if(vestingRelease > 0) {
            if(vestingUserClaims < vestingIntervalNumbers && latestTimestamp > (vestingRelease + vestingUserClaims * vestingIntervalLength)) {
              claimState.canClaim = true
            } else {
              claimState.canClaim = false
            }
          } else {
            claimState.canClaim = true
          }
        } else {
          claimState.canClaim = false
        }
      } else if(presaleStart > latestTimestamp) {
        if(userContribution > 0) {
          claimState.canClaim = true
        } else {
          claimState.canClaim = false
        }
      } else {
        claimState.canClaim = false
      }
      
    }

    if(presaleStart < latestTimestamp) {
      claimState.hasStarted = true
    } else {
      claimState.hasStarted = false
    }

    if(presaleEnd < latestTimestamp) {
      claimState.isFinished = true
    } else {
      claimState.isFinished = false
    }

    if(!claimState.isFinished && claimState.hasStarted) {
      claimState.canParticipate = true
    } else {
      claimState.canParticipate = false
    }

    return claimState
  }

  async optInStakingPool(wallet: SessionWallet, contractId: number) {
    let addr = wallet.getDefaultAccount()
    let suggested = await getSuggested(30)
    let apps = [ps.platform.staking_id]
    let optInTxn = new Transaction(get_app_optin_txn(suggested, addr, contractId, apps))
    let signed = await wallet.signTxn([optInTxn])
    let response = await sendWait(signed)
    return response
  }

  async stakeDistributionPool(wallet: SessionWallet, stakeAmount: number, contractId: number, isSmartPool: boolean) {
    let addr = wallet.getDefaultAccount()
    let suggested = await getSuggested(30)
    if(isSmartPool) {
      let globalState = StateToObj(await getGlobalState(contractId), smartDistributionStateKeys)
      let args = [new Uint8Array(Buffer.from(Method.Stake))]
      let apps = [globalState[smartDistributionStateKeys.token_app_id_key]['i']]
      let stakeTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, undefined, undefined))

      suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
      suggested.flatFee = true
      args = [new Uint8Array(Buffer.from(Method.Transfer)), algosdk.encodeUint64(stakeAmount)]
      let accounts = [ps.platform.burn_addr, getApplicationAddress(contractId)]
      let assets = [globalState[smartDistributionStateKeys.token_id_key]['i']]
      let transferToStakeTxn = new Transaction(get_app_call_txn(suggested, addr, globalState[smartDistributionStateKeys.token_app_id_key]['i'], args, undefined, assets, accounts))
      
      let grouped = [transferToStakeTxn, stakeTxn]
      algosdk.assignGroupID(grouped)

      let signed = await wallet.signTxn(grouped)
      let response = await sendWait(signed)
      return response
      
    } else {
      let globalState = StateToObj(await getGlobalState(contractId), standardDistributionKeys)
      let asaId = globalState[standardStakingKeys.token_id_key]['i']
      let assetTxn = new Transaction(get_asa_xfer_txn(suggested, addr, getApplicationAddress(contractId), asaId, stakeAmount))

      let args = [new Uint8Array(Buffer.from(Method.Stake))]
      let stakeTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, undefined, undefined))

      let grouped = [assetTxn, stakeTxn]
      algosdk.assignGroupID(grouped)

      let signed = await wallet.signTxn(grouped)
      let response = await sendWait(signed)
      return response
    }
  }

  async claimDistributionPool(wallet: SessionWallet, contractId: number, assetSmartContract?: number) {
    let addr = wallet.getDefaultAccount()
    let suggested = await getSuggested(30)
    if(assetSmartContract) {
      let globalState = StateToObj(await getGlobalState(contractId), smartDistributionStateKeys)
      let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 3000))

      let args = [new Uint8Array(Buffer.from(Method.Claim))]
      let accounts = [ps.platform.burn_addr]
      let assets = [globalState[smartDistributionStateKeys.token_id_key]['i']]
      let apps = [globalState[smartDistributionStateKeys.token_app_id_key]['i']]
      let claimTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, accounts))

      let grouped = [payTxn, claimTxn]
      algosdk.assignGroupID(grouped)

      let signed = await wallet.signTxn(grouped)
      let response = await sendWait(signed)
      return response
    } else {
      let globalState = StateToObj(await getGlobalState(contractId), standardDistributionKeys)
      let assets = [globalState[standardDistributionKeys.token_id_key]['i']]
      let args = [new Uint8Array(Buffer.from(Method.Claim))]
      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      suggested.flatFee = true
      let claimTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, undefined))
      let signed = await wallet.signTxn([claimTxn])
      let response = await sendWait(signed)
      return response
    }
  }

  async withdrawDistributionPool(wallet: SessionWallet, contractId: number, withdrawAmount: number, isSmartPool: boolean) {
    let addr = wallet.getDefaultAccount()
    let suggested = await getSuggested(30)
    if(isSmartPool) {
      let globalState = StateToObj(await getGlobalState(contractId), smartDistributionStateKeys)
      let payTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 3000))

      let args = [new Uint8Array(Buffer.from(Method.Withdraw)), algosdk.encodeUint64(withdrawAmount)]
      let accounts = [ps.platform.burn_addr]
      let assets = [globalState[smartDistributionStateKeys.token_id_key]['i']]
      let apps = [globalState[smartDistributionStateKeys.token_app_id_key]['i']]
      let withdrawTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, apps, assets, accounts))

      let grouped = [payTxn, withdrawTxn]
      algosdk.assignGroupID(grouped)

      let signed = await wallet.signTxn(grouped)
      let response = await sendWait(signed)
      return response
    } else {
      let globalState = StateToObj(await getGlobalState(contractId), standardDistributionKeys)
      let assets = [globalState[standardDistributionKeys.token_id_key]['i']]
      let args = [new Uint8Array(Buffer.from(Method.Withdraw)), algosdk.encodeUint64(withdrawAmount)]
      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      suggested.flatFee = true
      let withdrawTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, undefined))
      let signed = await wallet.signTxn([withdrawTxn])
      let response = await sendWait(signed)
      return response
    }
  }

  async createAsaPresale(wallet: SessionWallet, presaleStart: number, presaleEnd: number) {

    const approval = await (await fetch('../../assets/contracts/asa_presale_approval.teal')).text()
    const clear = await (await fetch('../../assets/contracts/asa_presale_clear.teal')).text()

    let args = [algosdk.encodeUint64(presaleStart), algosdk.encodeUint64(presaleEnd)]

    let suggested = await getSuggested(10)
    const createApp = algosdk.makeApplicationCreateTxnFromObject({
        from: wallet.getDefaultAccount(),
        approvalProgram: await compileProgram(approval),
        clearProgram: await compileProgram(clear),
        numGlobalInts: 14,
        numGlobalByteSlices: 1,
        numLocalInts: 2,
        numLocalByteSlices: 0,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        note: new Uint8Array(Buffer.from("Deploy App")),
        suggestedParams: suggested,
        appArgs: args
    })

    const [signedTxns] = await wallet.signTxn([createApp])

    const result = await sendWait([signedTxns])

    this.settings.contractId = result['application-index'];
    this.settings.contractAddress = algosdk.getApplicationAddress(BigInt( result['application-index'] ));
    return result
  }

  async setupAsaPresale(wallet: SessionWallet, contractId: number, assetId: number, hardCap: number, softCap: number, walletCap: number, presaleTokenAmount: number,
    stakingId: number | undefined, stakingAmount: number | undefined, periodTime: number | undefined, stakingStart: number | undefined, periodDistributionAmount: number | undefined, 
    vestingRelease: number | undefined, vestingIntervalLength: number | undefined, vestingIntervalNumbers: number | undefined) {
    let addr = wallet.getDefaultAccount()
    let suggested = await getSuggested(10)
    let args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(hardCap), algosdk.encodeUint64(softCap), algosdk.encodeUint64(walletCap)]
    
    if(vestingRelease && vestingIntervalLength && vestingIntervalNumbers) {
      args.push(algosdk.encodeUint64(vestingRelease), algosdk.encodeUint64(vestingIntervalLength), algosdk.encodeUint64(vestingIntervalNumbers))
    }

    let accounts = [ps.platform.fee_addr]
    let assets = [assetId]

    let paymentTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(contractId), 200000))
    
    suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    let presaleSetupTxn = new Transaction(get_app_call_txn(suggested, addr, contractId, args, undefined, assets, accounts))
    
    suggested.fee = 1 * algosdk.ALGORAND_MIN_TX_FEE
    let assetToPresaleTxn = new Transaction(get_asa_xfer_txn(suggested, addr, getApplicationAddress(contractId), assetId, presaleTokenAmount))
    let grouped = [paymentTxn, presaleSetupTxn, assetToPresaleTxn]
    if(stakingId && periodDistributionAmount && stakingStart && periodTime && stakingAmount) {
      let stakingPayTxn = new Transaction(get_pay_txn(suggested, addr, getApplicationAddress(stakingId), 200000))

      suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
      let apps = [ps.platform.staking_id]
      let assets = [assetId, ps.platform.verse_asset_id]
      args = [new Uint8Array(Buffer.from(DeployerMethod.Setup)), algosdk.encodeUint64(periodDistributionAmount), algosdk.encodeUint64(stakingStart), algosdk.encodeUint64(periodTime)]
      let stakingSetupTxn = new Transaction(get_app_call_txn(suggested, addr, stakingId, args, apps, assets, undefined))
      
      suggested.fee = 1 * algosdk.ALGORAND_MIN_TX_FEE
      let stakingAssetTransferTxn = new Transaction(get_asa_xfer_txn(suggested, addr, getApplicationAddress(stakingId), assetId, stakingAmount))
      grouped.unshift(stakingPayTxn, stakingSetupTxn, stakingAssetTransferTxn)
    }
    algosdk.assignGroupID(grouped)
    let signed = await wallet.signTxn(grouped)
    let response = await sendWait(signed)
    return response
  }

}
