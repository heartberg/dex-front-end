import { SessionWallet } from "algorand-session-wallet";
import algosdk, { Algodv2, getApplicationAddress, Transaction } from "algosdk";
import { platform_settings as ps } from "./platform-conf";
import { getAlgodClient, getGlobalState, getSuggested, isOptedIntoApp, sendWait, StateToObj } from "./algorand";
import { get_app_call_txn, get_asa_xfer_txn, get_pay_txn } from "./transactions";
import { DeployerMethod } from "./deployer_application";
import { getAppLocalStateByKey } from "../services/utils.algo";

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

export class LockerApp {
    async setupStandardLock(wallet: SessionWallet, settings: LockSettings) {
        let suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        let globalState = StateToObj(await getGlobalState(ps.platform.locker_id), LockerGlobalKeys)
        let fee = globalState[LockerGlobalKeys.fee_key]['i']

        let payAmount = fee + 2 * algosdk.ALGORAND_MIN_TX_FEE + 100000
        let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_address, payAmount))
        
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        let assets = [settings.assetId, ps.platform.verse_asset_id]
        let accounts = [ps.platform.burn_addr]
        let apps = [ps.platform.verse_app_id]
        let args = [new Uint8Array(Buffer.from(LockerMethods.setup)), algosdk.encodeUint64(settings.lockTime)]
        if(settings.tokensPerPeriod) {
            args.push(algosdk.encodeUint64(settings.periodTime!), algosdk.encodeUint64(settings.tokensPerPeriod!))
        }
        let setupTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, apps, assets, accounts))

        suggested.fee = 1 * algosdk.ALGORAND_MIN_TX_FEE

        let assetTransfer = new Transaction(get_asa_xfer_txn(suggested, addr, ps.platform.locker_address, settings.assetId, settings.amount))
        
        let grouped = [payTxn, setupTxn, assetTransfer]
        algosdk.assignGroupID(grouped)
        let signed = await wallet.signTxn(grouped)
        let response = await sendWait(signed)
        return response
    }

    async setupSmartLock(wallet: SessionWallet, settings: LockSettings) {
        let suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()
        let globalState = StateToObj(await getGlobalState(ps.platform.locker_id), LockerGlobalKeys)
        let fee = globalState[LockerGlobalKeys.fee_key]['i']

        let payAmount = fee + 2 * algosdk.ALGORAND_MIN_TX_FEE + 100000
        let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_address, payAmount))
        
        suggested.fee = 3 * algosdk.ALGORAND_MIN_TX_FEE
        let assets = [settings.assetId, ps.platform.verse_asset_id]
        let accounts = [ps.platform.burn_addr]
        let apps = [ps.platform.verse_app_id, settings.assetContractId!]
        let args = [new Uint8Array(Buffer.from(LockerMethods.smart_setup)), algosdk.encodeUint64(settings.amount) ,algosdk.encodeUint64(settings.lockTime)]
        if(settings.tokensPerPeriod) {
            args.push(algosdk.encodeUint64(settings.periodTime!), algosdk.encodeUint64(settings.tokensPerPeriod!))
        }
        let setupTxn = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, apps, assets, accounts))

        suggested.fee = 2 * algosdk.ALGORAND_MIN_TX_FEE

        args = [new Uint8Array(Buffer.from(DeployerMethod.SetupLock))]
        accounts = [ps.platform.locker_address]
        let setupLock = new Transaction(get_app_call_txn(suggested, addr, ps.platform.locker_id, args, undefined, assets, accounts))
        
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

        let payTxn = new Transaction(get_pay_txn(suggested, addr, ps.platform.locker_address, 2 * algosdk.ALGORAND_MIN_TX_FEE))

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
            amount: 0,
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
            
            let assetInfo = await client.getAssetByID(assetId).do()
            lockSettings.amount = amount / assetInfo['params']['decimals']
            lockSettings.assetContractId = asaContract
            lockSettings.lockTime = lockTime
            lockSettings.periodTime = releasePeriod
            lockSettings.tokensPerPeriod = tokensPerPeriod / assetInfo['params']['decimals']
            lockSettings.nextClaimableTime = nextReleaseTime
        }

        return lockSettings
    }
}