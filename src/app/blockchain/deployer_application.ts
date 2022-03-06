import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction } from "./algorand"
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
import { Wallet } from "algorand-session-wallet"
import { encode } from "querystring";
import { sign } from "crypto";
import SuggestedParamsRequest from "algosdk/dist/types/src/client/v2/algod/suggestedParams";
import { allowedNodeEnvironmentFlags } from "process";
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


export class DeployedApp {

    settings: DeployedAppSettings;

    // TODO: check mapping of freshly deployed app with deployed app settings, maybe split it up, create mapper functions somewhere
    constructor(conf: DeployedAppSettings){
        this.settings = conf;
    }

    async deploy(wallet: Wallet) {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        
        const args = [encodeParam(this.settings.total_supply), encodeParam(this.settings.buy_burn), encodeParam(this.settings.sell_burn),
        encodeParam(this.settings.transfer_burn), encodeParam(this.settings.to_lp), encodeParam(this.settings.to_backing),
        encodeParam(this.settings.max_buy)]
        const accounts = [encodeParam(ps.platform.burn_addr), encodeParam(ps.platform.fee_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]
        const apps = [encodeParam(ps.platform.verse_app_id)]

        const createApp = new Transaction(get_create_deploy_app_txn(suggested, addr, args, apps, assets, accounts, ps.contracts.approval, ps.contracts.clear))
        
        const [signed] = await wallet.signTxn([createApp])
        const result = await sendWait([signed])
        this.settings.contract_id = result['application_index']
        this.settings.contract_address = algosdk.getApplicationAddress(BigInt(result['application_index']));
        return result
    }

    async mint(wallet: Wallet) {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, 10_000))
        
        const args = [Method.Create, encodeParam(this.settings.name), encodeParam(this.settings.unit), encodeParam(this.settings.decimals), encodeParam(this.settings.url)]
        const mint = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, undefined, undefined))
        
        const grouped = [pay, mint]

        algosdk.assignGroupID(grouped)

        const [signedPay, signedMint] = await wallet.signTxn([pay, mint])
        const result = await sendWait([signedPay, signedMint])

        this.settings.asset_id = result.innerTxns[0]['asset-index']

        return result
    }

    async setupNoPresale(wallet: Wallet): Promise<boolean> {
        const suggestedExtraFee = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        suggestedExtraFee.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE

        const args = [Method.Setup, encodeParam(this.settings.initial_token_liq), encodeParam(this.settings.trading_start)]
        const assets = [encodeParam(this.settings.asset_id)]
        const accounts = [encodeParam(ps.platform.fee_addr)]
        const setup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, assets, accounts))

        const suggested = await getSuggested(10)
        const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, this.settings.initial_algo_liq + this.settings.initial_algo_liq_fee))

        const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.asset_id))
        const payBurn = new Transaction(get_pay_txn(suggested, addr, ps.platform.burn_addr, 10_000))
        const burnOptin = new Transaction(get_asa_optin_txn(suggested, ps.platform.burn_addr, this.settings.asset_id))

        const grouped = [payBurn, burnOptin, creatorOptin, pay, setup]
        algosdk.assignGroupID(grouped)
        
        const [signedPayBurn, signedCreatorOptin, signedPay, signedSetup] = await wallet.signTxn([payBurn, creatorOptin, pay, setup])
        const signedBurnOptin = signLogicSigTransaction(burnOptin, ps.platform.burn_lsig)
        const result = await sendWait([signedPayBurn, signedBurnOptin, signedCreatorOptin, signedPay, signedSetup])
        
        return result
    }

    async setupWithPresale(wallet: Wallet): Promise<boolean> {
        const suggestedExtraFee = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        suggestedExtraFee.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE

        const args = [Method.Setup, encodeParam(this.settings.initial_token_liq), encodeParam(this.settings.trading_start), encodeParam(this.settings.presale_settings?.presale_start),
        encodeParam(this.settings.presale_settings?.presale_end), encodeParam(this.settings.presale_settings?.softcap), encodeParam(this.settings.presale_settings?.hardcap),
        encodeParam(this.settings.presale_settings?.walletcap), encodeParam(this.settings.presale_settings?.to_lp), encodeParam(this.settings.presale_settings?.presale_token_amount)]

        const assets = [encodeParam(this.settings.asset_id)]
        const accounts = [encodeParam(ps.platform.fee_addr)]
        const setup = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, assets, accounts))

        const suggested = await getSuggested(10)
        const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, this.settings.initial_algo_liq + this.settings.initial_algo_liq_fee))

        const creatorOptin = new Transaction(get_asa_optin_txn(suggested, addr, this.settings.asset_id))
        const payBurn = new Transaction(get_pay_txn(suggested, addr, ps.platform.burn_addr, 10_000))
        const burnOptin = new Transaction(get_asa_optin_txn(suggested, ps.platform.burn_addr, this.settings.asset_id))

        const grouped = [payBurn, burnOptin, creatorOptin, pay, setup]
        algosdk.assignGroupID(grouped)
        
        const [signedPayBurn, signedCreatorOptin, signedPay, signedSetup] = await wallet.signTxn([payBurn, creatorOptin, pay, setup])
        const signedBurnOptin = signLogicSigTransaction(burnOptin, ps.platform.burn_lsig)
        const result = await sendWait([signedPayBurn, signedBurnOptin, signedCreatorOptin, signedPay, signedSetup])
        
        return result
    }

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
        const assets = [encodeParam(this.settings.asset_id)]
        const accounts = [encodeParam(ps.platform.burn_addr), encodeParam(this.settings.creator)]

        const claim = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, assets, accounts))

        const signedClaim = await wallet.signTxn([claim])
        const result = await sendWait(signedClaim)

        return result
    }

    async resetupPresaleToFairLaunch(wallet: Wallet, tradingStart: number, tokenLiq: number, algoLiq: number): Promise<boolean> {
        const suggestedExtraFee = await getSuggested(10)
        suggestedExtraFee.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()

        const args = [Method.Resetup, encodeParam(tradingStart), encodeParam(tokenLiq)]

        const claim = new Transaction(get_app_call_txn(suggestedExtraFee, addr, this.settings.contract_id, args, undefined, undefined, undefined))

        if(algoLiq > this.settings.initial_algo_liq) {
            const suggested = await getSuggested(10)
            const pay = new Transaction(get_pay_txn(suggested, addr, this.settings.contract_address, algoLiq - this.settings.initial_algo_liq))
            algosdk.assignGroupID([claim, pay])
            const [signedClaim, signedPay] = await wallet.signTxn([claim, pay])
            const result = await sendWait([signedClaim, signedPay])
            return result
        } else {
            const signedClaim = await wallet.signTxn([claim])
            const result = await sendWait([signedClaim])
            return result
        }
    }

    async optIn(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const optin = new Transaction(get_app_optin_txn(suggested, addr, ps.platform.verse_app_id))
        const [signed] = await wallet.signTxn([optin])
        const result = await sendWait([signed])

        return result  
    }

    async optOut(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const optout = new Transaction(get_app_closeout_txn(suggested, addr, ps.platform.verse_app_id))
        const [signed] = await wallet.signTxn([optout])
        const result = await sendWait([signed])

        return result  
    }

    async removeMaxBuy(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const args = [Method.RemoveMaxBuy]

        const remove = new Transaction(get_app_call_txn(suggested, addr, this.settings.contract_id, args, undefined, undefined, undefined))

        const signedRemove = await wallet.signTxn([remove])
        const result = await sendWait(signedRemove)

        return result
    }

    async buy(wallet: Wallet , algoAmount: bigint, slippage: number, wantedReturn: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Buy, encodeParam(slippage), encodeParam(wantedReturn)]
        const accounts = [encodeParam(ps.platform.burn_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const buy = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.verse_app_addr, algoAmount))

        const grouped = [buy, pay]

        algosdk.assignGroupID(grouped)

        const [signedBuy, signedPay] = await wallet.signTxn([buy, pay])
        const result = await sendWait([signedBuy, signedPay])

        return result
    }

    async sell(wallet: Wallet , tokenAmount: bigint, slippage: number, wantedReturn: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Sell, encodeParam(tokenAmount), encodeParam(slippage), encodeParam(wantedReturn)]
        const accounts = [encodeParam(ps.platform.burn_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const buy = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([buy])
        const result = await sendWait([signed])

        return result
    }

    async transfer(wallet: Wallet , tokenAmount: bigint, to: string): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Transfer, encodeParam(tokenAmount)]

        const accounts = [encodeParam(ps.platform.burn_addr), encodeParam(to)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const send = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([send])
        const result = await sendWait([signed])

        return result
    }

    async getBacking(wallet: Wallet , tokenAmount: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = []
        args.push(Method.GetBacking)
        args.push(encodeParam(tokenAmount))
        const accounts = [encodeParam(ps.platform.burn_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const backing = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([backing])
        const result = await sendWait([signed])

        return result
    }

    async borrow(wallet: Wallet , tokenAmount: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = []
        args.push(Method.Borrow)
        args.push(encodeParam(tokenAmount))
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const borrow = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, undefined))
        const [signed] = await wallet.signTxn([borrow])
        const result = await sendWait([signed])

        return result
    }

    async repay(wallet: Wallet , algoAmount: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = []
        args.push(Method.Repay)
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const repay = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, undefined))
        const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.verse_app_addr, algoAmount))

        const grouped = [repay, pay]

        algosdk.assignGroupID(grouped)

        const [signedRepay, signedPay] = await wallet.signTxn([repay, pay])
        const result = await sendWait([signedRepay, signedPay])

        return result
    }
}