import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, getGlobalState, readLocalState } from "./algorand"
import {
    get_app_optin_txn,
    get_verse_app_call_txn,
    get_pay_txn,
    encodeParam,
    get_app_closeout_txn,
    get_app_call_txn
} from "./transactions"
import algosdk, { Transaction } from 'algosdk';
import { 
    platform_settings as ps
} from "./platform-conf";
import { Wallet } from "algorand-session-wallet"
import { encode } from "querystring";
import { sign } from "crypto";
import { toBase64String } from "@angular/compiler/src/output/source_map";
//import { showErrorToaster, showInfo } from "../Toaster";


declare const AlgoSigner: any;


export enum Method {
    Transfer = "dHJhbnNmZXI=",
    Buy = "YnV5",
    Sell = "c2VsbA==",
    GetBacking = "Z2V0X2JhY2tpbmc=",
    Borrow = "Ym9ycm93",
    Repay = "cmVwYXk=",
    Burn = "YnVybg==",
    Stake = "c3Rha2U=",
    Withdraw = "d2l0aGRyYXc=",
    Claim = "Y2xhaW0="
}


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

    async buy(wallet: Wallet , algoAmount: bigint, slippage: number, wantedReturn: bigint): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = []
        args.push(Method.Buy)
        args.push(encodeParam(slippage))
        args.push(encodeParam(wantedReturn))
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
        
        const args = []
        args.push(Method.Sell)
        args.push(encodeParam(tokenAmount))
        args.push(encodeParam(slippage))
        args.push(encodeParam(wantedReturn))
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
        
        const args = []
        args.push(Method.Transfer)
        args.push(encodeParam(tokenAmount))
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

    async stake(wallet: Wallet, amount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Transfer, encodeParam(amount)]
        const accounts = [encodeParam(ps.platform.burn_addr), encodeParam(ps.platform.staking_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]

        const transfer = new Transaction(get_verse_app_call_txn(suggested, addr, args, undefined, assets, accounts))
        
        suggested.fee = algosdk.ALGORAND_MIN_TX_FEE
        const stake = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, args, undefined, assets, accounts))

        algosdk.assignGroupID([transfer, stake])

        const [signedTransfer, signedStake] = await wallet.signTxn([transfer, stake])
        const result = await sendWait([signedTransfer, signedStake])

        return result
    }

    async withdraw(wallet: Wallet, amount: number): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 4 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Withdraw, encodeParam(amount)]
        const accounts = [encodeParam(ps.platform.burn_addr), encodeParam(ps.platform.staking_addr)]
        const assets = [encodeParam(ps.platform.verse_asset_id)]
        const apps = [encodeParam(ps.platform.verse_app_id)]

        const withdraw = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, args, apps, assets, accounts))

        const [signedWithdraw] = await wallet.signTxn([withdraw])
        const result = await sendWait([signedWithdraw])

        return result
    }

    async claim(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        suggested.fee = 5 * algosdk.ALGORAND_MIN_TX_FEE
        const addr = wallet.getDefaultAccount()
        
        const args = [Method.Claim]
        const assets = [encodeParam(ps.platform.verse_asset_id)]
        const apps = [encodeParam(ps.platform.verse_app_id)]

        const claim = new Transaction(get_app_call_txn(suggested, addr, ps.platform.staking_id, args, apps, assets, undefined))

        const [signedClaim] = await wallet.signTxn([claim])
        const result = await sendWait([signedClaim])

        return result
    }

    async getClaimableAmount(wallet: Wallet): Promise<number> {
        const addr = wallet.getDefaultAccount()
        const stakingGlobalState = await getGlobalState(ps.platform.staking_id)
        const localState = await readLocalState(addr, ps.platform.staking_id)
        const claimableAmount = 0
        return claimableAmount
    }

    async getNextClaimableDate(wallet: Wallet): Promise<number> {
        const addr = wallet.getDefaultAccount()
        const distributionState = await readLocalState(addr, ps.platform.distribution_id)
        const nextDate = distributionState[toBase64String('nct')]
        return nextDate
    }
}