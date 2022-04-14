import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, compileProgram } from "./algorand"
import { readFileSync } from 'fs';
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
import algosdk, { signLogicSigTransaction, Transaction } from 'algosdk';
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
//import { showErrorToaster, showInfo } from "../Toaster";


declare const AlgoSigner: any;


export enum Method {
  Transfer = "dHJhbnNmZXI=",
  Buy = "YnV5",
  Sell = "c2VsbA==",
  GetBacking = "Z2V0X2JhY2tpbmc=",
  Borrow = "Ym9ycm93",
  Repay = "cmVwYXk=",
  Create = "Y3JlYXRl",
  Setup = "c2V0dXA=",
  Resetup = "cmVzZXR1cF9wcmVzYWxl",
  RemoveMaxBuy = "cmVtb3ZlX21heF9idXk=",
  BuyPresale = "YnV5X3ByZXNhbGU=",
  ClaimPresale = "Y2xhaW1fcHJlc2FsZQ=="
}

@Injectable({
  providedIn: 'root'
})

export class DeployedApp {

  settings: DeployedAppSettings;
  // this is
  // TODO: check mapping of freshly deployed app with deployed app settings, maybe split it up, create mapper functions somewhere
  constructor(
    private wallet: WalletsConnectService
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

    const args = [this.settings.total_supply, this.settings.buy_burn, this.settings.sell_burn,
                  this.settings.transfer_burn, this.settings.to_lp, this.settings.to_backing,
                  this.settings.max_buy]
    const accounts = [ps.platform.burn_addr, ps.platform.fee_addr]
    const assets = [ps.platform.verse_asset_id]
    const apps = [ps.platform.verse_app_id]

    const fs = require('fs')
    var approval;
    var clear;
    try {
      approval = fs.readFileSync('../../assets/contracts/deployer_token_approval.teal', 'utf8');
      clear = fs.readFileSync('../../assets/contracts/deployer_token_clear.teal', 'utf8');
    } catch (err) {
      console.error(err)
    }
    

    const createApp = new Transaction(get_create_deploy_app_txn(suggested, addr, args, apps, assets, accounts, approval, clear))

    const [signed] = await wallet.signTxn([createApp])
    const result = await sendWait([signed])
    this.settings.contract_id = result['application_index']
    this.settings.contract_address = algosdk.getApplicationAddress(BigInt(result['application_index']));
    return result
  }

  async mint(wallet: Wallet, settings: DeployedAppSettings) {
    this.settings = settings;
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, 201_000))

    const args = [Method.Create, this.settings.name, this.settings.unit, this.settings.decimals, this.settings.url]
    const mint = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, undefined, undefined))

    const grouped = [pay, mint]

    algosdk.assignGroupID(grouped)

    const [signedPay, signedMint] = await wallet.signTxn([pay, mint])
    const result = await sendWait([signedPay, signedMint])

    this.settings.asset_id = result.innerTxns[0]['asset-index']

    return result
  }

  async payAndOptInBurn(wallet: Wallet, settings: DeployedAppSettings): Promise<boolean> {
    this.settings = settings;
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.burn_addr, 101_000))

    const optIn = new Transaction(get_asa_optin_txn(suggested, ps.platform.burn_addr, this.settings.asset_id))

    const grouped = [pay, optIn]

    algosdk.assignGroupID(grouped)

    const [signedPay] = await wallet.signTxn([pay])
    // @ts-ignore
    const [signedOptIn] = await algosdk.signLogicSigTransactionObject(optIn, ps.platform.burn_lsig)
    const result = await sendWait([signedPay, signedOptIn])

    return result
  }

  async setupNoPresale(wallet: Wallet, settings: DeployedAppSettings): Promise<boolean> {
    this.settings = settings;
    const suggestedExtraFee = await getSuggested(10)
    const addr = wallet.getDefaultAccount()
    suggestedExtraFee.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE

    const args = [Method.Setup, this.settings.initial_token_liq, this.settings.trading_start]
    const assets = [this.settings.asset_id]
    const accounts = [ps.platform.fee_addr, ps.platform.burn_addr]
    const setup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, assets, accounts))

    const suggested = await getSuggested(10)
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, this.settings.initial_algo_liq + this.settings.initial_algo_liq_fee))

    const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.asset_id))

    const grouped = [creatorOptin, pay, setup]
    algosdk.assignGroupID(grouped)

    const [signedCreatorOptin, signedPay, signedSetup] = await wallet.signTxn([creatorOptin, pay, setup])
    const result = await sendWait([signedCreatorOptin, signedPay, signedSetup])

    return result
  }

  async setupWithPresale(wallet: Wallet, settings: DeployedAppSettings): Promise<boolean> {
    this.settings = settings;
    const suggestedExtraFee = await getSuggested(10)
    const addr = wallet.getDefaultAccount()
    suggestedExtraFee.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE

    const args = [Method.Setup, this.settings.initial_token_liq, this.settings.trading_start, this.settings.presale_settings?.presale_start,
    this.settings.presale_settings?.presale_end, this.settings.presale_settings?.softcap, this.settings.presale_settings?.hardcap,
    this.settings.presale_settings?.walletcap, this.settings.presale_settings?.to_lp, this.settings.presale_settings?.presale_token_amount]

    const assets = [this.settings.asset_id]
    const accounts = [ps.platform.fee_addr, ps.platform.burn_addr]
    const setup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, assets, accounts))

    const suggested = await getSuggested(10)
    const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, this.settings.initial_algo_liq + this.settings.initial_algo_liq_fee))

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

  ////  deploy page end here ------------

  async buyPresale(wallet: Wallet, amount: number): Promise<boolean> {
    const suggested = await getSuggested(10)
    const addr = wallet.getDefaultAccount()

    const args = [Method.BuyPresale]

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

    const args = [Method.ClaimPresale]
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

    const args = [Method.Resetup, tradingStart, tokenLiq]

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

    const args = [Method.Resetup, softCap, hardCap, presaleStart, presaleEnd, walletCap,
    toLiq, tradingStart, presaleTokenAmount]
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

    const args = [Method.RemoveMaxBuy]

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

    const args = [Method.Buy, slippage, wantedReturn]
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

    const args = [Method.Sell, tokenAmount, slippage, wantedReturn]
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
}
