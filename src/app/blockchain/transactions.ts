import algosdk from 'algosdk'  
import { platform_settings as ps } from './platform-conf'


// @ts-ignore
export function get_asa_optin_txn(suggestedParams, addr, id) {
    return get_asa_xfer_txn(suggestedParams, addr, addr, id, 0)
}

// @ts-ignore
export function get_asa_xfer_txn(suggestedParams, from, to, id, amt) {
    return {
        from: from,
        to: to,
        assetIndex: id,
        type: 'axfer',
        amount: amt,
        ...suggestedParams
    }
}

// @ts-ignore
export function get_pay_txn(suggestedParams, addr, to, amount) {
    return {
        from: addr,
        to: to,
        amount: amount,
        type: 'pay',
        ...suggestedParams
    }
}

// @ts-ignore
export function get_app_optin_txn(suggestedParams, addr, id) {
    return {
        from: addr,
        appIndex:id,
        type: 'appl',
        appOnComplete: algosdk.OnApplicationComplete.OptInOC,
        ...suggestedParams
    }
}

// @ts-ignore
export function get_app_closeout_txn(suggestedParams, addr, id) {
    return {
        from: addr,
        appIndex:id,
        type: 'appl',
        appOnComplete: algosdk.OnApplicationComplete.CloseOutOC,
        ...suggestedParams
    }
}

// @ts-ignore
export function get_verse_app_call_txn(suggestedParams, addr, args, apps, assets, accounts) {
    return {
        from: addr,
        appArgs: args,
        appIndex: ps.platform.verse_app_id,
        appOnComplete: algosdk.OnApplicationComplete.NoOpOC,
        type: "appl",
        appForeignAssets: assets,
        appForeignApps: apps,
        appAccounts: accounts,
        ...suggestedParams
    }
}

const max_app_size = 2048
function getExtraPages(len: number): number {
    if(len<=max_app_size) return 0
    return (Math.floor((len-max_app_size)/max_app_size) % max_app_size) + 1
}

// @ts-ignore
export function get_create_deploy_app_txn(suggestedParams, addr, args, apps, assets, accounts, approval, clear) {
    return {
        from:addr,
        type:'appl',
        appGlobalByteSlices: 2,
        appGlobalInts: 18,
        appLocalByteSlices: 0,
        appLocalInts: 3,
        appApprovalProgram: approval,
        appClearProgram: clear,
        extraPages:getExtraPages(approval.length+clear.length),
        appArgs: args,
        appForeignAssets: assets,
        appForeignApps: apps,
        appAccounts: accounts,
        ...suggestedParams
    } 
}

// @ts-ignore
export function get_app_call_txn(suggestedParams, addr, app_id, args, apps, assets, accounts) {
    return {
        from: addr,
        appArgs: args,
        appIndex: app_id,
        appOnComplete: algosdk.OnApplicationComplete.NoOpOC,
        type: "appl",
        appForeignAssets: assets,
        appForeignApps: apps,
        appAccounts: accounts,
        ...suggestedParams
    }
}

export function encodeParam(value: any) {
    if(typeof value === "string") {
        return new Uint8Array(Buffer.from(value));
    } else if (typeof value === "number" || typeof value === "bigint") {
        const buffer = Buffer.alloc(8);
        const bigIntValue = BigInt(value);
        buffer.writeBigUInt64BE(bigIntValue)
        return Uint8Array.from(buffer);
    } else {
        return undefined
    }
}
