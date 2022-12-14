import { SessionWallet } from "algorand-session-wallet";
import algosdk, { Algodv2, getApplicationAddress, Transaction } from "algosdk";
import { platform_settings as ps } from "./platform-conf";
import { getAlgodClient, getGlobalState, getSuggested, isOptedIntoApp, sendWait, StateToObj } from "./algorand";
import { get_app_call_txn, get_app_optin_txn, get_asa_xfer_txn, get_pay_txn } from "./transactions";
import { DeployerMethod } from "./deployer_application";
import { getAppLocalStateByKey } from "../services/utils.algo";
import { Inject, Injectable } from "@angular/core";
import { Method } from "./keys";

export type LockSettings = {
    assetId: number,
    assetContractId?: number,
    amount: number,
    lockTime: number,
    periodTime?: number,
    tokensPerPeriod?: number,
    nextClaimableTime?: number
}

export enum LockerGlobalKeys {
    burn_addr_key = "ba",
    verse_token_id_key = "v",
    verse_app_id_key = "vid",
    fee_key = "f"
}

export enum LockerLocalKeys {
    lock_pair_key = "lp",
    lock_amount_key = "la",
    lock_time_key = "lt",
    tokens_per_period_key = "tpp",
    release_period_key = "rp",
    next_released_time_key = "lrr",
    smart_asa_app_id_key = "sid"
}

export enum LockerMethods {
    setup = "setup",
    withdraw = "withdraw",
    smart_setup = "smart_setup",
    smart_withdraw = "smart_withdraw"
}



@Injectable({
    providedIn: 'root'
  })
export class LockerApp {

    async claim(wallet: SessionWallet) {
        const addr = wallet.getDefaultAccount()
        let suggested = await getSuggested(30)
        let client: Algodv2 = getAlgodClient()
        let smartAsaContractId = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.smart_asa_app_id_key)
        let assets = [await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.lock_pair_key)]
        
        let args = []
        if(smartAsaContractId != 0) {
            let apps = [smartAsaContractId]
            args.push(new Uint8Array(Buffer.from(LockerMethods.smart_withdraw)))
            let claimTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, apps, assets, undefined))
            let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_addr, 2 * algosdk.ALGORAND_MIN_TX_FEE))
            let grouped = [payTxn, claimTxn]
            algosdk.assignGroupID(grouped)
            let signed = await wallet.signTxn(grouped)
            let response = await sendWait(signed)
            return response
        } else {
            suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
            suggested.flatFee = true
            args.push(new Uint8Array(Buffer.from(LockerMethods.withdraw)))
            let claimTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, undefined, assets, undefined))
            let signed = await wallet.signTxn([claimTxn])
            let response = await sendWait(signed)
            return response
        }   
    }

    async optIn(wallet: SessionWallet) {
        const addr = wallet.getDefaultAccount()
        let suggested = await getSuggested(30)
        let txn = new Transaction(get_app_optin_txn(suggested, addr, ps.platform.locker_id, undefined))
        let signed = await wallet.signTxn([txn])
        let response = await sendWait(signed)
        return response
    }

    async setupStandardLock(wallet: SessionWallet, settings: LockSettings) {
        
        let suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        let payAmount = algosdk.ALGORAND_MIN_TX_FEE + 100000
        let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_addr, payAmount))
        
        let assets = [settings.assetId]
        let args = [new Uint8Array(Buffer.from(LockerMethods.setup)), algosdk.encodeUint64(settings.lockTime)]
        if(settings.tokensPerPeriod) {
            args.push(algosdk.encodeUint64(settings.periodTime!), algosdk.encodeUint64(settings.tokensPerPeriod!))
        }
        let setupTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, undefined, assets, undefined))

        let assetTransfer = new Transaction(get_asa_xfer_txn(suggested, addr, ps.platform.locker_addr, settings.assetId, settings.amount))
        
        let grouped = [payTxn, setupTxn, assetTransfer]
        algosdk.assignGroupID(grouped)
        let signed = await wallet.signTxn(grouped)
        let response = await sendWait(signed)
        return response
    }

    async setupSmartLock(wallet: SessionWallet, settings: LockSettings) {
        let suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        let payAmount = algosdk.ALGORAND_MIN_TX_FEE + 100000
        let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_addr, payAmount))
        
        let assets = [settings.assetId]
        let apps = [settings.assetContractId!]
        let args = [new Uint8Array(Buffer.from(LockerMethods.smart_setup)), algosdk.encodeUint64(settings.amount) ,algosdk.encodeUint64(settings.lockTime)]
        if(settings.tokensPerPeriod) {
            args.push(algosdk.encodeUint64(settings.periodTime!), algosdk.encodeUint64(settings.tokensPerPeriod!))
        }
        let setupTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, apps, assets, undefined))

        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE

        args = [new Uint8Array(Buffer.from(DeployerMethod.SetupLock))]
        let accounts = [ps.platform.locker_addr]

        console.log(accounts)
        console.log(addr)
        let setupLock = new Transaction(get_app_call_txn(suggested, addr, settings.assetContractId!, args, undefined, assets, accounts))
        
        let grouped = [payTxn, setupTxn, setupLock]
        algosdk.assignGroupID(grouped)
        let signed = await wallet.signTxn(grouped)
        let response = await sendWait(signed)
        return response
    }

    async withdrawStandard(wallet: SessionWallet, settings: LockSettings) {
        let suggested = await getSuggested(10)
        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE
        let addr = wallet.getDefaultAccount()
        let assets = [settings.assetId]
        let args = [new Uint8Array(Buffer.from(LockerMethods.withdraw))]
        let withdrawTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, undefined, assets, undefined))
        let signed = await wallet.signTxn([withdrawTxn])
        let response = await sendWait(signed)
        return response
    }

    async withdrawSmart(wallet: SessionWallet, settings: LockSettings) {
        let suggested = await getSuggested(10)
        let addr = wallet.getDefaultAccount()

        let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_addr, 2 * algosdk.ALGORAND_MIN_TX_FEE))

        let assets = [settings.assetId]
        let apps = [settings.assetContractId!]
        let args = [new Uint8Array(Buffer.from(LockerMethods.withdraw))]
        let withdrawTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, apps, assets, undefined))
        
        let grouped = [payTxn, withdrawTxn]
        algosdk.assignGroupID(grouped)
        let signed = await wallet.signTxn(grouped)
        let response = await sendWait(signed)
        return response
    }

    async getLockData(addr: string) {
        let lockSettings: LockSettings = {
            amount: -1,
            assetId: 0,
            lockTime: 0,
            assetContractId: 0,
            periodTime: 0,
            tokensPerPeriod: 0,
            nextClaimableTime: 0
        }
        if(await isOptedIntoApp(addr, ps.platform.locker_id)) {
            let client: Algodv2 = getAlgodClient()
            let assetId = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.lock_pair_key)
            let amount = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.lock_amount_key)
            let lockTime = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.lock_time_key)
            let asaContract = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.smart_asa_app_id_key)
            let releasePeriod = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.release_period_key)
            let nextReleaseTime = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.next_released_time_key)
            let tokensPerPeriod = await getAppLocalStateByKey(client, ps.platform.locker_id, addr, LockerLocalKeys.tokens_per_period_key)
            
            if(assetId == 0) {
                lockSettings.amount = 0
                return lockSettings
            }

            let assetInfo = await client.getAssetByID(assetId).do()
            lockSettings.amount = amount / Math.pow(10, assetInfo['params']['decimals'])
            lockSettings.assetContractId = asaContract
            lockSettings.lockTime = lockTime
            lockSettings.periodTime = releasePeriod
            lockSettings.tokensPerPeriod = tokensPerPeriod / Math.pow(10, assetInfo['params']['decimals'])
            lockSettings.nextClaimableTime = nextReleaseTime
            lockSettings.assetId = assetId
        }

        return lockSettings
    }
}