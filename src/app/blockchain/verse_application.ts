import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, getGlobalState, readLocalState, StateToObj, getAlgodClient, getIndexer } from "./algorand"
import {
    get_app_optin_txn,
    get_verse_app_call_txn,
    get_pay_txn,
    encodeParam,
    get_app_closeout_txn,
    get_app_call_txn,
    get_asa_xfer_txn,
    get_asa_optin_txn
} from "./transactions"
import algosdk, { Algodv2, encodeUint64, Transaction } from 'algosdk';
import { 
    BlockchainInformation,
    platform_settings as ps
} from "./platform-conf";
import { Wallet } from "algorand-session-wallet"
import { encode } from "querystring";
import { sign } from "crypto";
import { toBase64String } from "@angular/compiler/src/output/source_map";
import { Injectable } from "@angular/core";
import { AssetViewModel } from "../models/assetView.model"
import { IfStmt } from "@angular/compiler";
import { BlockchainTrackInfo } from "../modules/track/track.component";
//import { showErrorToaster, showInfo } from "../Toaster";

declare const AlgoSigner: any;

export enum verseStateKeys {
    token_liq_key = "s1",
    algo_liq_key = "s2",
    burned_key = "bd",
    total_supply_key = "ts",
    burn_key = "b",
    transfer_burn_key = "trb",
    flat_fee_key = "ff",
    to_lp_key = "lp",
    to_backing_key = "tb",
    max_buy_key = "mb",
    asset_id_key = "asa",
    trading_start_key = "t",
    extra_fee_time_key = "eft",
    distribution_id_key = "di",
    backing_id_key = "bi",
    fee_addr_key = "ta",
    burn_addr_key = "ba"
}

export enum backingStateKeys {
    user_supplied_key = "us",
    user_algo_borrowed_key = "uab",
    user_1_borrowed_key = "ub1",
    user_2_borrowed_key = "ub2",
    user_3_borrowed_key = "ub3",
    user_4_borrowed_key = "ub4",
    user_5_borrowed_key = "ub5",
    user_6_borrowed_key = "ub6",
    user_7_borrowed_key = "ub7",

    total_algo_borrowed_key = "tab",
    total_1_borrowed_key = "tb1",
    total_2_borrowed_key = "tb2",
    total_3_borrowed_key = "tb3",
    total_4_borrowed_key = "tb4",
    total_5_borrowed_key = "tb5",
    total_6_borrowed_key = "tb6",
    total_7_borrowed_key = "tb7",

    asset_1_key = "a1",
    asset_2_key = "a2",
    asset_3_key = "a3",
    asset_4_key = "a4",
    asset_5_key = "a5",
    asset_6_key = "a6",
    asset_7_key = "a7",

    number_of_backing_tokens_key = "nbt",
    verse_app_id_key = "vid",
    verse_token_id_key = "vai",
    burn_addr_key = "ba",
}

export enum stakingStateKeys {
    burn_addr_key = "BA",

    token_id_key = "TK_ID",
    token_app_id_key = "TA",
    current_end_epoch_key = "CE",
    week_total_stake_key = "WTA",
    week_total_added_stake_key = "WTAA",
    weekly_dist_amount_key = "WDA",
    distribution_asset_amount_key = "DTA",
    unclaimed_key = "UC",
    total_staked = "TS",

    token_amount_key = "TA",
    next_claimable_time_key = "NCT",
    week_stake_amount = "WSA"
}

export enum Method {
    Transfer = "transfer",
    Buy = "buy",
    Sell = "sell",
    GetBacking = "get_backing",
    Borrow = "borrow",
    Algo = "algo",
    RepayAssets = "repay_assets",
    RepayAlgo = "repay_algo",
    Supply = "supply",
    Stake = "stake",
    Withdraw = "withdraw",
    Claim = "claim"
}

@Injectable({
    providedIn: 'root',
  })

export class VerseApp {
    constructor(){
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

    async optInAsset(wallet: Wallet): Promise<any> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        const optin = new Transaction(get_asa_optin_txn(suggested, addr, ps.platform.verse_asset_id))
        const [signed] = await wallet.signTxn([optin])
        const result = await sendWait([signed])

        return result
    }

    async buy(wallet: Wallet , algoAmount: number, slippage: number, wantedReturn: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from("buy")), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
        const accounts = [ps.platform.burn_addr, ps.platform.fee_addr]
        const assets = [ps.platform.verse_asset_id]

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
        suggested.fee = 5 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Sell)), algosdk.encodeUint64(tokenAmount), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
        const accounts = [ps.platform.burn_addr, ps.platform.fee_addr]
        const assets = [ps.platform.verse_asset_id]

        const sell = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([sell])
        const result = await sendWait([signed])

        return result
    }


    async transfer(wallet: Wallet , tokenAmount: bigint, to: string): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Transfer)), algosdk.encodeUint64(tokenAmount)]
        const accounts = [ps.platform.burn_addr, to]
        const assets = [ps.platform.verse_asset_id]

        const send = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([send])
        const result = await sendWait([signed])

        return result
    }


    async getBacking(wallet: Wallet , tokenAmount: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        var args = [new Uint8Array(Buffer.from(Method.Transfer)), algosdk.encodeUint64(tokenAmount)]
        var accounts = [ps.platform.burn_addr, ps.platform.burn_addr]
        var assets = [ps.platform.verse_asset_id]

        const transfer = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))

        args = [new Uint8Array(Buffer.from(Method.GetBacking)), algosdk.encodeUint64(tokenAmount)]

        //TODO: finish
        let globalState = StateToObj(await getGlobalState(ps.platform.backing_id), Method)
        console.log(globalState)

        assets = [ps.platform.verse_asset_id]

        const backing = new Transaction(get_app_call_txn(suggested, addr, ps.platform.backing_id, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([backing])
        const result = await sendWait([signed])

        return result
    }


    async borrow(wallet: Wallet , tokenAmount: bigint, assetIds: number[]): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Borrow)), algosdk.encodeUint64(tokenAmount)]
        const assets = [ps.platform.verse_asset_id]
        assetIds.forEach(id => {
            assets.push(id)
        });

        const borrow = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, undefined))
        const [signed] = await wallet.signTxn([borrow])
        const result = await sendWait([signed])

        return result
    }

    async repay(wallet: Wallet , algoAmount: bigint, assetIds: number[], assetAmount: number[]): Promise<boolean> {
        if(assetAmount.length != assetIds.length) return false

        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        let grouped = []
        if(assetIds.length > 0){
            for(let i = 0; i < assetIds.length; i++){
                let assetSend = new Transaction(get_asa_xfer_txn(suggested, addr, ps.platform.backing_addr, assetIds[i], assetAmount[i]))
                grouped.push(assetSend)
            }
    
            let args = [new Uint8Array(Buffer.from(Method.RepayAssets))]
            const repayAssets = new Transaction(get_app_call_txn(suggested, addr, ps.platform.backing_id, args, undefined, undefined, undefined))
            grouped.push(repayAssets)
        }

        if(algoAmount > 0){
            const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.verse_app_addr, algoAmount))
            let args = [new Uint8Array(Buffer.from(Method.RepayAlgo))]
            const algoRepay = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, undefined, undefined))
            grouped.push(pay)
            grouped.push(algoRepay)
        }

        algosdk.assignGroupID(grouped)

        const signedGroup = await wallet.signTxn(grouped)
        const result = await sendWait(signedGroup)

        return result
    }

    async stake(wallet: Wallet, amount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Transfer, encodeParam(amount)]
        const accounts = [encodeParam(ps.platform.burn_addr), encodeParam(ps.platform.staking_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const transfer = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        
        suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
        const stakingArgs = [Method.Stake, encodeParam(amount)]
        const stake = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, stakingArgs, undefined, undefined, undefined))

        algosdk.assignGroupID([transfer, stake])

        const [signedTransfer, signedStake] = await wallet.signTxn([transfer, stake])
        const result = await sendWait([signedTransfer, signedStake])

        return result
    }

    async withdraw(wallet: Wallet, amount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Withdraw)), algosdk,encodeUint64(amount)]
        const accounts = [ps.platform.burn_addr]
        const assets = [ps.platform.verse_asset_id]
        const apps = [ps.platform.verse_app_id]

        const withdraw = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, args, apps, assets, accounts))

        const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.staking_addr, 3000))

        algosdk.assignGroupID([pay, withdraw])
        const [signedPay, signedWithdraw] = await wallet.signTxn([pay, withdraw])
        const result = await sendWait([signedPay, signedWithdraw])

        return result
    }

    async claim(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Claim))]
        const assets = [ps.platform.verse_asset_id]
        const accounts = [ps.platform.burn_addr]
        const apps = [ps.platform.verse_app_id]

        const claim = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, args, apps, assets, accounts))
        const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.staking_addr, 3000))
        algosdk.assignGroupID([pay, claim])
        const [signedPay, signedClaim] = await wallet.signTxn([pay, claim])
        const result = await sendWait([signedPay, signedClaim])

        return result
    }

    async getClaimableAmount(wallet: Wallet): Promise<number> {
        const addr = wallet.getDefaultAccount()
        const stakingGlobalState = await getGlobalState(ps.platform.staking_id)
        const localState = await readLocalState(addr, ps.platform.staking_id)
        console.log("Users local state")
        for (let n = 0; n < localState[`key-value`].length; n++) {
            console.log(localState[`key-value`][n]);
        }
        console.log("Apps global state")
        for (let n = 0; n < stakingGlobalState.length; n++) {
            console.log(stakingGlobalState[n]);
        }
        const claimableAmount = 0
        return claimableAmount
    }

    async getNextClaimableDate(wallet: Wallet): Promise<any> {
        const addr = wallet.getDefaultAccount()
        const stakingState = StateToObj(await readLocalState(addr, ps.platform.staking_id), stakingStateKeys)
        console.log(stakingState)
        return stakingState['NCT']
    }

    async getContractGlobalState(){
        var globalState = StateToObj(await getGlobalState(ps.platform.verse_app_id), verseStateKeys)
        console.log(globalState)
        return globalState
    }

    async getBlockchainInformation(): Promise<BlockchainInformation>{
        let client: Algodv2 = getAlgodClient()
        let backingInfo: any = await client.accountInformation(ps.platform.backing_addr).do()
        let verseState: any = await this.getContractGlobalState()
        let backingState = StateToObj(await getGlobalState(ps.platform.backing_id), backingStateKeys)
        
        let algoLiquidity = verseState[verseStateKeys.algo_liq_key]['i']
        let tokenLiquidity = verseState[verseStateKeys.token_liq_key]['i']
        let totalSupply = verseState[verseStateKeys.total_supply_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalBacking = (backingInfo['amount'] - backingInfo['min-balance'] + backingState[backingStateKeys.total_algo_borrowed_key]['i']) / Math.pow(10, 6)
        let totalBorrowedAlgo = backingState[backingStateKeys.total_algo_borrowed_key]['i']

        return {
            algoLiquidity: algoLiquidity,
            tokenLiquidity: tokenLiquidity,
            totalsupply: totalSupply,
            totalBacking: totalBacking,
            totalBorrowedAlgo: totalBorrowedAlgo
        }
    }

    async getViewModel() : Promise<AssetViewModel>{
        let state: any = await this.getContractGlobalState()

        let verse: AssetViewModel = {
            assetId: ps.platform.verse_asset_id,
            contractId: ps.platform.verse_app_id,
            contractAddress: ps.platform.verse_app_addr,
            name: "Verse",
            unitName: "Verse",
            totalSupply: state[verseStateKeys.total_supply_key]['i'],
            decimals: ps.platform.verse_decimals,
            maxBuy: state[verseStateKeys.max_buy_key]['i'],
            tradingStart: 0,
            risingPriceFloor: state[verseStateKeys.to_lp_key]['i'],
            backing: state[verseStateKeys.to_backing_key]['i'],
            buyBurn: state[verseStateKeys.burn_key]['i'],
            sellBurn: state[verseStateKeys.burn_key]['i'],
            sendBurn: state[verseStateKeys.transfer_burn_key]['i'],
            image: "",
            deployerWallet: ""
        }
        return verse
    }

    async getTrackInfo(wallet: string) : Promise<BlockchainTrackInfo>{
        let client: Algodv2 = getAlgodClient()
        let verseState: any = await this.getContractGlobalState()
        let backingInfo: any = await client.accountInformation(ps.platform.backing_addr).do()
        let backingState = StateToObj(await getGlobalState(ps.platform.backing_id), backingStateKeys)
        let assetInfo: any = await client.getAssetByID(ps.platform.verse_asset_id).do()
        let accountInfo: any = await client.accountInformation(wallet).do()

        let algoLiquidity = verseState[verseStateKeys.algo_liq_key]['i'] / Math.pow(10, 6)
        let tokenLiquidity = verseState[verseStateKeys.token_liq_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalSupply = verseState[verseStateKeys.total_supply_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalBacking = (backingInfo['amount'] - backingInfo['min-balance'] + backingState[backingStateKeys.total_algo_borrowed_key]['i']) / Math.pow(10, 6)
        let marketCap = algoLiquidity / tokenLiquidity * totalSupply
        let price = algoLiquidity / tokenLiquidity
        let burned = verseState[verseStateKeys.burned_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let holders = 0


        console.log(accountInfo)
        let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
            return el['asset-id'] == ps.platform.verse_asset_id
        })
        let holding = 0
        if(asset){
            holding = asset['amount'] / Math.pow(10, ps.platform.verse_decimals)
        }

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
            tradingStart: 0
        }

        return trackInfo
    }
}