import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, getGlobalState, readLocalState, StateToObj, getAlgodClient, getIndexer, isOptedIntoApp, isOptedIntoAsset } from "./algorand"
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
import algosdk, { Algodv2, Transaction } from 'algosdk';
import { 
    BlockchainInformation,
    platform_settings as ps
} from "./platform-conf";
import { SessionWallet } from "algorand-session-wallet"
import { Injectable } from "@angular/core";
import { AssetViewModel } from "../models/assetViewModel"
import { BlockchainTrackInfo } from "../modules/track/track.component";
import { backingStateKeys, Method, verseStateKeys } from "./keys";
//import { showErrorToaster, showInfo } from "../Toaster";

declare const AlgoSigner: any;


@Injectable({
    providedIn: 'root',
  })

export class VerseApp {
    constructor(){
    }

    async optIn(wallet: SessionWallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const optin = new Transaction(get_app_optin_txn(suggested, addr, ps.platform.backing_id))
        const [signed] = await wallet.signTxn([optin])
        const result = await sendWait([signed])

        return result  
    }

    async optOut(wallet: SessionWallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const optout = new Transaction(get_app_closeout_txn(suggested, addr, ps.platform.backing_id))
        const [signed] = await wallet.signTxn([optout])
        const result = await sendWait([signed])

        return result  
    }

    async optInAsset(wallet: SessionWallet): Promise<any> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        const optin = new Transaction(get_asa_optin_txn(suggested, addr, ps.platform.verse_asset_id))
        const [signed] = await wallet.signTxn([optin])
        const result = await sendWait([signed])

        return result
    }

    async buy(wallet: SessionWallet , algoAmount: number, slippage: number, wantedReturn: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 5 * algosdk.ALGORAND_MIN_TX_FEE
        suggested.flatFee = true
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from("buy")), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
        const accounts = [ps.platform.burn_addr, ps.platform.fee_addr, ps.platform.backing_addr]
        const assets = [ps.platform.verse_asset_id]

        const buy = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const pay = new Transaction(get_pay_txn(suggested, addr, ps.platform.verse_app_addr, algoAmount))

        const grouped = [buy, pay]

        algosdk.assignGroupID(grouped)

        const [signedBuy, signedPay] = await wallet.signTxn([buy, pay])
        const result = await sendWait([signedBuy, signedPay])

        return result
    }

    async sell(wallet: SessionWallet , tokenAmount: number, slippage: number, wantedReturn: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 6 * algosdk.ALGORAND_MIN_TX_FEE 
        suggested.flatFee = true
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Sell)), algosdk.encodeUint64(tokenAmount), algosdk.encodeUint64(slippage), algosdk.encodeUint64(wantedReturn)]
        const accounts = [ps.platform.burn_addr, ps.platform.fee_addr, ps.platform.backing_addr]
        const assets = [ps.platform.verse_asset_id]

        const sell = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([sell])
        const result = await sendWait([signed])

        return result
    }


    async transfer(wallet: SessionWallet , tokenAmount: number, to: string): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        suggested.flatFee = true
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Transfer)), algosdk.encodeUint64(tokenAmount)]
        const accounts = [ps.platform.burn_addr, to]
        const assets = [ps.platform.verse_asset_id]

        const send = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        const [signed] = await wallet.signTxn([send])
        const result = await sendWait([signed])

        return result
    }


    async getBacking(wallet: SessionWallet , tokenAmount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        suggested.flatFee = true
        const addr = wallet.getDefaultAccount()
        
        var args = [new Uint8Array(Buffer.from(Method.Transfer)), algosdk.encodeUint64(tokenAmount)]
        var accounts = [ps.platform.burn_addr, ps.platform.burn_addr]
        var assets = [ps.platform.verse_asset_id]

        const transfer = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))

        args = [new Uint8Array(Buffer.from(Method.GetBacking)), algosdk.encodeUint64(tokenAmount)]
        
        const apps = [ps.platform.verse_app_id]
        assets = []
        let backingState = StateToObj(await getGlobalState(ps.platform.backing_id), Method)
        for(let key in backingState){
            if(key.startsWith("a") && key != 'algo'){
                let assetId = backingState[key]['i']
                console.log(key)
                console.log(assetId)
                assets.push(assetId)
            }
        }
        
        const backing = new Transaction(get_app_call_txn(suggested, addr, ps.platform.backing_id, args, apps, assets, undefined))
        const grouped = [transfer, backing]
        algosdk.assignGroupID(grouped)
        const [signedTransfer, signedBacking] = await wallet.signTxn(grouped)
        const result = await sendWait([signedTransfer, signedBacking])

        return result
    }


    async borrow(wallet: SessionWallet , tokenAmount: bigint, assetIds: number[]): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE 
        suggested.flatFee = true
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

    async repay(wallet: SessionWallet , algoAmount: bigint, assetIds: number[], assetAmount: number[]): Promise<boolean> {
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

    async stake(wallet: SessionWallet, amount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        suggested.flatFee = true
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Transfer)), algosdk.encodeUint64(amount)]
        const accounts = [ps.platform.burn_addr, ps.platform.staking_addr]
        const assets = [ps.platform.verse_asset_id]

        const transfer = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        
        suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
        const stakingArgs = [new Uint8Array(Buffer.from(Method.Stake)), algosdk.encodeUint64(amount)]
        const apps = [ps.platform.verse_app_id]
        const stake = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, stakingArgs, apps, undefined, undefined))

        algosdk.assignGroupID([transfer, stake])

        const [signedTransfer, signedStake] = await wallet.signTxn([transfer, stake])
        const result = await sendWait([signedTransfer, signedStake])

        return result
    }

    async withdraw(wallet: SessionWallet, amount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.flatFee = true
        const addr = wallet.getDefaultAccount()
        
        const args = [new Uint8Array(Buffer.from(Method.Withdraw)), algosdk.encodeUint64(amount)]
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

    async claim(wallet: SessionWallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        suggested.flatFee = true
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

    async getContractGlobalState(){
        var globalState = StateToObj(await getGlobalState(ps.platform.verse_app_id), verseStateKeys)
        //console.log(globalState)
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
        let maxBuy = verseState[verseStateKeys.max_buy_key]['i']

        return {
            algoLiquidity: algoLiquidity,
            tokenLiquidity: tokenLiquidity,
            totalsupply: totalSupply,
            totalBacking: totalBacking,
            totalBorrowedAlgo: totalBorrowedAlgo,
            maxBuy: maxBuy
        }
    }

    async getViewModel() : Promise<AssetViewModel>{
        let state: any = await this.getContractGlobalState()

        let verse: AssetViewModel = {
            assetId: ps.platform.verse_asset_id,
            name: "Verse",
            unitName: "Verse",
            totalSupply: state[verseStateKeys.total_supply_key]['i'],
            decimals: ps.platform.verse_decimals,
            image: "",
            deployerWallet: "",
            projectId: ps.platform.verse_project_id,
            isFavorite: true,
            smartProperties: {
                risingPriceFloor: state[verseStateKeys.to_lp_key]['i'],
                backing: state[verseStateKeys.to_backing_key]['i'],
                buyBurn: state[verseStateKeys.burn_key]['i'],
                sellBurn: state[verseStateKeys.burn_key]['i'],
                sendBurn: state[verseStateKeys.transfer_burn_key]['i'],
                contractId: ps.platform.verse_app_id,
                contractAddress: ps.platform.verse_app_addr,
                maxBuy: state[verseStateKeys.max_buy_key]['i'],
                tradingStart: state[verseStateKeys.trading_start_key]['i'],
                extraFeeTime: state[verseStateKeys.extra_fee_time_key]['i']
            }
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
        
        let tradingStart = verseState[verseStateKeys.trading_start_key]['i']
        let algoLiquidity = verseState[verseStateKeys.algo_liq_key]['i'] / Math.pow(10, 6)
        let tokenLiquidity = verseState[verseStateKeys.token_liq_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalSupply = verseState[verseStateKeys.total_supply_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalBacking = (backingInfo['amount'] - backingInfo['min-balance'] + backingState[backingStateKeys.total_algo_borrowed_key]['i']) / Math.pow(10, 6)
        let marketCap = algoLiquidity / tokenLiquidity * totalSupply
        let price = algoLiquidity / tokenLiquidity
        let burned = verseState[verseStateKeys.burned_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        
        let indexer = getIndexer()
        //console.log(await indexer.lookupAssetByID(ps.platform.verse_asset_id).do())
        //let holder = await indexer.lookupAssetBalances(ps.platform.verse_asset_id).currencyGreaterThan(0).do()
        //console.log(holder)
        let holders = 0
        //console.log(accountInfo)
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
            tradingStart: tradingStart
        }

        return trackInfo
    }
}