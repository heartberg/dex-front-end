import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, getAlgodClient, getGlobalState, StateToObj } from "./algorand"
import * as fs from 'fs';
import {
  get_app_optin_txn,
  get_verse_app_call_txn,
  get_pay_txn,
  encodeParam,
  get_app_closeout_txn,
  get_create_deploy_app_txn,
  get_app_call_txn,
  get_asa_optin_txn
} from "./transactions"
import algosdk, { LogicSigAccount, signLogicSigTransaction, Transaction } from 'algosdk';
import {
  DeployedAppSettings,
  platform_settings as ps
} from "./platform-conf";
import { SessionWallet, Wallet } from "algorand-session-wallet"
import { encode } from "querystring";
import { sign } from "crypto";
import SuggestedParamsRequest from "algosdk/dist/types/src/client/v2/algod/suggestedParams";
import { allowedNodeEnvironmentFlags } from "process";
import { HomeComponent } from "../modules/home/home.component";
import { Injectable } from "@angular/core";
import { WalletsConnectService } from "../services/wallets-connect.service";
import { AppRoutingModule } from "../app-routing.module";
import AlgodClient from "algosdk/dist/types/src/client/v2/algod/algod";
import { compileProgram, getTransactionParams, waitForTransaction } from "../services/utils.algo";
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
    extra_fee_time_key = "eft"
}

export enum Method {
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
  ClaimPresale = "claim_presale"
}

@Injectable({
  providedIn: 'root'
})

export class DeployedApp {

  settings: DeployedAppSettings;
  // this is
  // TODO: check mapping of freshly deployed app with deployed app settings, maybe split it up, create mapper functions somewhere
  constructor(
    private walletConnectService: WalletsConnectService
  ) {
    this.settings = <DeployedAppSettings>{};
  }

  async deploy(wallet: SessionWallet, settings: DeployedAppSettings) {

    this.settings = settings;
    const suggested = await getSuggested(10)
    console.log(suggested)
    console.log('wallet', wallet)
    const addr = wallet.getDefaultAccount()
    console.log('addr', addr)
    
    const args = [algosdk.encodeUint64(this.settings.total_supply), algosdk.encodeUint64(this.settings.buy_burn), algosdk.encodeUint64(this.settings.sell_burn),
                  algosdk.encodeUint64(this.settings.transfer_burn), algosdk.encodeUint64(this.settings.to_lp), algosdk.encodeUint64(this.settings.to_backing),
                  algosdk.encodeUint64(this.settings.max_buy)]
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr]
    const assets = [ps.platform.verse_asset_id]
    const apps = [ps.platform.verse_app_id, ps.platform.backing_id]

    const approval = await (await fetch('../../assets/contracts/deployer_token_approval.teal')).text()
    //console.log('approval', approval)
    const clear = await (await fetch('../../assets/contracts/deployer_token_clear.teal')).text()
    //console.log('clear', clear)

    const createApp = algosdk.makeApplicationCreateTxnFromObject({
        from: wallet.getDefaultAccount(),
        approvalProgram: await compileProgram(approval),
        clearProgram: await compileProgram(clear),
        numGlobalInts: 27,
        numGlobalByteSlices: 2,
        numLocalInts: 3,
        numLocalByteSlices: 0,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        note: new Uint8Array(Buffer.from("Deploy App")),
        appArgs: args,
        foreignApps: apps,
        accounts: accounts,
        foreignAssets: assets,
        extraPages: 1,
        suggestedParams: suggested,
    })

    const [signedTxns] = await wallet.signTxn([createApp])
    const result = await getAlgodClient().sendRawTransaction(signedTxns.blob).do();
    await waitForTransaction(getAlgodClient(), result.txId);

    // const result = await sendWait([signed])
    const txRes = await getAlgodClient().pendingTransactionInformation(result.txId).do();
    console.log('appCreateResult', txRes);

    this.settings.contract_id = txRes['application-index'];
    this.settings.contract_address = algosdk.getApplicationAddress(BigInt( txRes['application-index'] ));
    return result
  }

  async mint(wallet: Wallet, settings: DeployedAppSettings) {
    const client = getAlgodClient()
    this.settings = settings;
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, 201_000))

    const args = [new Uint8Array(Buffer.from(Method.Create)), new Uint8Array(Buffer.from(this.settings.name)), new Uint8Array(Buffer.from(this.settings.unit)), 
      algosdk.encodeUint64(this.settings.decimals), new Uint8Array(Buffer.from(this.settings.url))]
    const mint = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, undefined, undefined))

    const grouped = [pay, mint]

    algosdk.assignGroupID(grouped)
    
    const [signedPay, signedMint] = await wallet.signTxn([pay, mint])
    const result = await sendWait([signedPay, signedMint])
    const txId = mint.txID()
    let pending = await client.pendingTransactionInformation(txId).do()
    console.log(pending)
    this.settings.asset_id = pending['inner-txns'][0]['asset-index']

    return result
  }

  async payAndOptInBurn(wallet: Wallet, settings: DeployedAppSettings): Promise<boolean> {
    let client = getAlgodClient()
    this.settings = settings;
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.burn_addr, 101_000))

    const optIn = new Transaction(get_asa_optin_txn(suggested, ps.platform.burn_addr, this.settings.asset_id))

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

  async setupNoPresale(wallet: Wallet, settings: DeployedAppSettings): Promise<boolean> {
    this.settings = settings;
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true

    const args = [new Uint8Array(Buffer.from(Method.Setup)), algosdk.encodeUint64(this.settings.initial_token_liq), algosdk.encodeUint64(this.settings.trading_start), algosdk.encodeUint64(this.settings.extra_fee_time)]
    const assets = [this.settings.asset_id]
    const accounts = [ps.platform.fee_addr, ps.platform.burn_addr]
    const setup = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, assets, accounts))

    console.log(this.settings.initial_algo_liq_with_fee)
    suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, this.settings.initial_algo_liq_with_fee))

    const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.asset_id))

    const grouped = [creatorOptin, pay, setup]
    algosdk.assignGroupID(grouped)

    const [signedCreatorOptin, signedPay, signedSetup] = await wallet.signTxn([creatorOptin, pay, setup])

    const result = await sendWait([signedCreatorOptin, signedPay, signedSetup])
    return result
  }

  async setupWithPresale(wallet: Wallet, settings: DeployedAppSettings): Promise<boolean> {
    this.settings = settings;
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    suggested.flatFee = true

    const args = [new Uint8Array(Buffer.from(Method.Setup)), algosdk.encodeUint64(this.settings.initial_token_liq), algosdk.encodeUint64(this.settings.trading_start), algosdk.encodeUint64(this.settings.extra_fee_time), algosdk.encodeUint64(this.settings.presale_settings.presale_start),
      algosdk.encodeUint64(this.settings.presale_settings?.presale_end), algosdk.encodeUint64(algosdk.algosToMicroalgos(this.settings.presale_settings?.softcap)), algosdk.encodeUint64(algosdk.algosToMicroalgos(this.settings.presale_settings?.hardcap)),
      algosdk.encodeUint64(algosdk.algosToMicroalgos(this.settings.presale_settings?.walletcap)), algosdk.encodeUint64(this.settings.presale_settings?.to_lp), algosdk.encodeUint64(this.settings.presale_settings?.presale_token_amount)]

    const assets = [this.settings.asset_id]
    const accounts = [ps.platform.fee_addr, ps.platform.burn_addr]
    const setup = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, assets, accounts))

    suggested.fee = 1 * algosdk.ALGORAND_MIN_TX_FEE
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, algosdk.algosToMicroalgos(this.settings.initial_algo_liq_with_fee)))

    const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.asset_id))

    const grouped = [creatorOptin, pay, setup]
    algosdk.assignGroupID(grouped)

    const [signedCreatorOptin, signedPay, signedSetup] = await wallet.signTxn([creatorOptin, pay, setup])

    const result = await sendWait([signedCreatorOptin, signedPay, signedSetup])

    return result
  }
  /// api calls for each steps of this calls

  // /project/create - without presale
  // /project/presale/create - with presale
  // 2 - mint
  // 3 - optedIn/burn -- will be added soon (projectId: argument) => boolean
  // 4 - setup (will be added one more);  (project/setup - if it's  not)
  // anouther container for a blockchain state of ngrx

  ////  deploy-api-logic-file page end here ------------

  async buyPresale(wallet: Wallet, amount: number): Promise<boolean> {
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.BuyPresale))]

    const buy = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, undefined, undefined))
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, amount))

    const grouped = [buy, pay]

    algosdk.assignGroupID(grouped)

    const [signedBuy, signedPay] = await wallet.signTxn([buy, pay])
    const result = await sendWait([signedBuy, signedPay])

    return result
  }

  async claimPresale(wallet: Wallet): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.ClaimPresale))]
    const assets = [this.settings.asset_id]
    const accounts = [ps.platform.burn_addr, this.settings.creator]

    const claim = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, assets, accounts))

    const signedClaim = await wallet.signTxn([claim])
    const result = await sendWait(signedClaim)

    return result
  }

  async resetupPresaleToFairLaunch(wallet: Wallet, tradingStart: number, tokenLiq: number, algoLiq: number): Promise<boolean> {
    const suggestedExtraFee = await getSuggested(10)
    suggestedExtraFee.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.Resetup)), algosdk.encodeUint64(tradingStart), algosdk.encodeUint64(tokenLiq)]

    const resetup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, undefined, undefined))

    if (algoLiq > this.settings.initial_algo_liq) {
      const suggested = await getSuggested(10)
      const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, algoLiq - this.settings.initial_algo_liq))
      algosdk.assignGroupID([resetup, pay])
      const [signedResetup, signedPay] = await wallet.signTxn([resetup, pay])
      const result = await sendWait([signedResetup, signedPay])
      return result
    } else {
      const signedResetup = await wallet.signTxn([resetup])
      const result = await sendWait([signedResetup])
      return result
    }
  }

  async resetupPresale(wallet: Wallet, softCap: number, hardCap: number, presaleStart: number, presaleEnd: number, walletCap: number,
    toLiq: number, tradingStart: number, presaleTokenAmount: number): Promise<boolean> {
    const suggestedExtraFee = await getSuggested(10)
    suggestedExtraFee.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.Resetup)), algosdk.encodeUint64(softCap), algosdk.encodeUint64(hardCap), 
      algosdk.encodeUint64(presaleStart), algosdk.encodeUint64(presaleEnd), algosdk.encodeUint64(walletCap),
      algosdk.encodeUint64(toLiq), algosdk.encodeUint64(tradingStart), algosdk.encodeUint64(presaleTokenAmount)]
    const assets = [this.settings.asset_id]
    const resetup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, assets, undefined))

    const signedResetup = await wallet.signTxn([resetup])
    const result = await sendWait([signedResetup])
    return result
  }

  async optIn(wallet: Wallet): Promise<boolean> {
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const optin = new Transaction(get_app_optin_txn(suggested, addr, ps.platform.verse_app_id))
    const [signed] = await wallet.signTxn([optin])
    const result = await sendWait([signed])

    return result
  }
  // also in token or project page (same page)
  async optOut(wallet: Wallet): Promise<boolean> {
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const optout = new Transaction(get_app_closeout_txn(suggested, addr, ps.platform.verse_app_id))
    const [signed] = await wallet.signTxn([optout])
    const result = await sendWait([signed])
    // some popup info mmanagaer in sendWait

    return result
  }
  // presale page ended here
  // token page  (your wallet)
  async removeMaxBuy(wallet: Wallet): Promise<boolean> {
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.RemoveMaxBuy))]

    const remove = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, undefined, undefined))

    const signedRemove = await wallet.signTxn([remove])
    const result = await sendWait(signedRemove)

    return result
  }
  // #token page  (your wallet)
  // trade page
  async buy(wallet: Wallet, algoAmount: bigint, slippage: number, wantedReturn: bigint): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.Buy)), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr, ps.platform.verse_app_addr]
    const assets = [this.settings.asset_id, ps.platform.verse_asset_id]
    const apps = [ps.platform.verse_app_id]

    const buy = new Transaction(get_verse_app_call_txn(suggested, addr, args, apps, assets, accounts))
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, algoAmount))

    const grouped = [pay, buy]

    algosdk.assignGroupID(grouped)

    const [signedPay, signedBuy] = await wallet.signTxn([pay, buy])
    const result = await sendWait([signedPay, signedBuy])

    return result
  }

  async sell(wallet: Wallet, tokenAmount: bigint, slippage: number, wantedReturn: bigint): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [new Uint8Array(Buffer.from(Method.Sell)), algosdk.encodeUint64(tokenAmount), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr, ps.platform.verse_app_addr]
    const assets = [this.settings.asset_id]

    const sell = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
    const [signed] = await wallet.signTxn([sell])
    const result = await sendWait([signed])

    return result
  }
  // #trade page
  // transfer page
  async transfer(wallet: Wallet, tokenAmount: bigint, to: string): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [Method.Transfer, tokenAmount]

    const accounts = [ps.platform.burn_addr, to]
    const assets = [this.settings.asset_id]

    const send = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
    const [signed] = await wallet.signTxn([send])
    const result = await sendWait([signed])

    return result
  }
  // #transfer page
  // trade and token page
  async getBacking(wallet: Wallet, tokenAmount: bigint): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [Method.GetBacking, tokenAmount]
    const accounts = [ps.platform.burn_addr]
    const assets = [this.settings.asset_id]

    const backing = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
    const [signed] = await wallet.signTxn([backing])
    const result = await sendWait([signed])

    return result
  }

  async borrow(wallet: Wallet, tokenAmount: bigint): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [Method.Borrow, tokenAmount]
    const assets = [this.settings.asset_id]

    const borrow = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, undefined))
    const [signed] = await wallet.signTxn([borrow])
    const result = await sendWait([signed])

    return result
  }

  async repay(wallet: Wallet, algoAmount: bigint): Promise<boolean> {
    const suggested = await getSuggested(10)
    suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
    const addr = wallet.getDefaultAccount()

    const args = [Method.Repay]
    const assets = [this.settings.asset_id]

    const repay = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, undefined))
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, algoAmount))

    const grouped = [repay, pay]

    algosdk.assignGroupID(grouped)

    const [signedRepay, signedPay] = await wallet.signTxn([repay, pay])
    const result = await sendWait([signedRepay, signedPay])

    return result
  }
  // trade and token page

  // in final we gonna do one more call for blockchain in trad epoage to calculate

  async getContractGlobalState(){
    if(this.settings.contract_id){
      var globalState = StateToObj(await getGlobalState(this.settings.contract_id), StateKeys)
      console.log(globalState)
      return globalState
    }
    return undefined
  }



}
