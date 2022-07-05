import { SessionWallet } from "algorand-session-wallet";
import algosdk, { Algodv2, Transaction, getApplicationAddress } from "algosdk";
import { platform_settings as ps } from "./platform-conf";
import { StakingUserInfo, StakingInfo } from "../modules/staking/staking.component";
import { getAppLocalStateByKey } from "../services/utils.algo";
import { getAlgodClient, StateToObj, getGlobalState, isOptedIntoApp, isOptedIntoAsset, getSuggested, sendWait } from "./algorand";
import { stakingStateKeys, verseStateKeys, backingStateKeys, standardDistributionKeys, standardStakingKeys, smartDistributionStateKeys, smartStakingKeys } from "./keys";
import { get_asa_optin_txn, get_app_optin_txn } from "./transactions";
import { SmartToolData } from "../shared/pop-up/component/pop-up.component";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
  })
export class StakingUtils {

    async getVerseStakingUserInfo(wallet: string) : Promise<StakingUserInfo>{
        let client: Algodv2 = getAlgodClient()
        let accountInfo: any = await client.accountInformation(wallet).do()
        let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
            return el['asset-id'] == ps.platform.verse_asset_id
        })
        let holding = 0
        if(asset){
            holding = asset['amount'] / Math.pow(10, ps.platform.verse_decimals)
        }
        let globalState: any = StateToObj(await getGlobalState(ps.platform.staking_id), stakingStateKeys)
        let nextClaimabletime = await getAppLocalStateByKey(client, ps.platform.staking_id, wallet, stakingStateKeys.next_claimable_time_key)
        let status = await client.status().do()
        let latestRound = await client.block(status['last-round']).do()
        let latestTimestemp = latestRound['block']['ts']
        let appAccInfo = await client.accountInformation(ps.platform.staking_addr).do()
        let assetOnApp = appAccInfo['assets'].find((el: { [x: string]: number; }) => {
            return el['asset-id'] == ps.platform.verse_asset_id
        })
        let remainingRewards = assetOnApp['amount'] / Math.pow(10, ps.platform.verse_decimals)
    
        if(await isOptedIntoApp(wallet, ps.platform.staking_id)) {
            
            let usersStake = await getAppLocalStateByKey(client, ps.platform.staking_id, wallet, stakingStateKeys.token_amount_key)
            let usersWeekStake = await getAppLocalStateByKey(client, ps.platform.staking_id, wallet, stakingStateKeys.week_stake_amount_key)
    
            let claimableAmount = 0
            if(usersStake > usersWeekStake) {
                let rewardPool = globalState[stakingStateKeys.distribution_asset_amount_key]['i']
                if(latestTimestemp > globalState[stakingStateKeys.current_end_epoch_key]['i']){
                    console.log("start next period")
                    rewardPool = globalState[stakingStateKeys.weekly_dist_amount_key]['i'] + globalState[stakingStateKeys.unclaimed_key]['i']
                    claimableAmount = (((usersStake - usersWeekStake) * rewardPool) / globalState[stakingStateKeys.total_staked_key]['i']) / Math.pow(10, ps.platform.verse_decimals)
                } else {
                    console.log("current period already started")
                    let staked = globalState[stakingStateKeys.week_total_stake_key]['i']
                    if (staked == 0) {
                        staked = globalState[stakingStateKeys.total_staked_key]['i']
                    }
                    claimableAmount = (((usersStake - usersWeekStake) * rewardPool) / staked) / Math.pow(10, ps.platform.verse_decimals)
                }
                
            }
    
            usersStake = usersStake / Math.pow(10, ps.platform.verse_decimals)
            usersWeekStake = usersWeekStake / Math.pow(10, ps.platform.verse_decimals)
            let stakingInfo: StakingUserInfo = {
                nextClaimableDate: nextClaimabletime,
                usersHolding: holding,
                usersStake: usersStake,
                rewards: claimableAmount,
                userAddedWeek: usersWeekStake,
                optedIn: true,
                totalPoolSize: remainingRewards,
                contractId: ps.platform.staking_id,
                assetId: ps.platform.verse_asset_id,
                isSmartPool: true,
                poolEnd: 0
            }
            return stakingInfo
        } else {
            let stakingInfo: StakingUserInfo = {
                nextClaimableDate: 0,
                usersHolding: holding,
                usersStake: 0,
                rewards: 0,
                userAddedWeek: 0,
                optedIn: false,
                totalPoolSize: remainingRewards,
                contractId: ps.platform.staking_id,
                assetId: ps.platform.verse_asset_id,
                isSmartPool: true,
                poolEnd: 0
            }
            return stakingInfo
        }
    }
    
    async getVerseStakingInfo() : Promise<StakingInfo>{
        let globalState: any = StateToObj(await getGlobalState(ps.platform.staking_id), stakingStateKeys)
        let totalStaked = globalState[stakingStateKeys.total_staked_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalAddedWeek = globalState[stakingStateKeys.week_total_added_stake_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let weeklyRewards = globalState[stakingStateKeys.distribution_asset_amount_key]['i']
        let client: Algodv2 = getAlgodClient()
        let status = await client.status().do()
        let latestRound = await client.block(status['last-round']).do()
        let latestTimestemp = latestRound['block']['ts']
        
        if(latestTimestemp > globalState[stakingStateKeys.current_end_epoch_key]['i']){
            weeklyRewards = globalState[stakingStateKeys.weekly_dist_amount_key]['i'] + globalState[stakingStateKeys.unclaimed_key]['i']
        }
        weeklyRewards = weeklyRewards / Math.pow(10, 6)
    
        let stakingInfo: StakingInfo = {
            totalAddedWeek: totalAddedWeek,
            totalStaked: totalStaked,
            weeklyRewards: weeklyRewards
        }
        return stakingInfo
    }
    
    async getVerseSmartToolData(wallet: string | null): Promise<SmartToolData> {
        let client: Algodv2 = getAlgodClient()
        let verseState: any = StateToObj(await getGlobalState(ps.platform.verse_app_id), verseStateKeys)
        let globalState: any = StateToObj(await getGlobalState(ps.platform.backing_id), backingStateKeys)
        let appInfo: any = await client.accountInformation(ps.platform.backing_addr).do()
        
        let userSupplied = 0
        let userBorrowed = 0
        let holding = 0
        let algos = 0
        let optedIn = false
        if(wallet){
            let accountInfo: any = await client.accountInformation(wallet).do()
            algos = accountInfo['amount'] / Math.pow(10, 6)
            let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
                return el['asset-id'] == ps.platform.verse_asset_id
            })
            if(asset){
                holding = asset['amount'] / Math.pow(10, ps.platform.verse_decimals)
            }
            if(await isOptedIntoApp(wallet, ps.platform.backing_id)) {
                optedIn = true
                userSupplied = await getAppLocalStateByKey(client, ps.platform.backing_id, wallet, backingStateKeys.user_supplied_key) / Math.pow(10, ps.platform.verse_decimals)
                userBorrowed = await getAppLocalStateByKey(client, ps.platform.backing_id, wallet, backingStateKeys.user_algo_borrowed_key) / Math.pow(10, 6)
            }
        }
        
        let totalBacking = (appInfo['amount'] - appInfo['min-balance'] + globalState[backingStateKeys.total_algo_borrowed_key]['i']) / Math.pow(10, 6)
    
        let totalSupply = verseState[verseStateKeys.total_supply_key]['i'] / Math.pow(10, ps.platform.verse_decimals)
        let totalBorrowed = globalState[backingStateKeys.total_algo_borrowed_key]['i'] / Math.pow(10, 6)
        
        let assetInfo = await client.getAssetByID(ps.platform.verse_asset_id).do()
    
        return {
            userBorrowed: userBorrowed,
            assetDecimals: ps.platform.verse_decimals,
            availableTokenAmount: holding,
            availableAlgoAmount: algos,
            contractId: ps.platform.verse_app_id,
            userSupplied: userSupplied,
            totalBacking: totalBacking,
            totalBorrowed: totalBorrowed,
            totalSupply: totalSupply,
            optedIn: optedIn,
            name: assetInfo['params']['name'],
            unitName: assetInfo['params']['unit-name']
        }
    }
    
    async checkOptedInToBackingAssets(wallet: string) : Promise<number[]>{
        let assetIds: number[] = []
        let backingState: any = StateToObj(await getGlobalState(ps.platform.backing_id), backingStateKeys)
        for(let key in backingState){
            if(key.startsWith("a")){
                let assetId = backingState[key]['i']
                console.log(assetId)
                if(assetId != 0) {
                    if(!await isOptedIntoAsset(wallet, assetId)){
                        assetIds.push(assetId)
                    }
                }
            }
        }
        return assetIds
    }
    
    async optInBackingAssets(wallet: SessionWallet, assetIdsToOptIn: number[]) {
        let addr = wallet.getDefaultAccount()
        let params = await getSuggested(10)
        let group = []
        for(var index in assetIdsToOptIn) {
            let txn = new Transaction(get_asa_optin_txn(params, addr, assetIdsToOptIn[index]))
            group.push(txn)
        }
        algosdk.assignGroupID(group)
        let signed = await wallet.signTxn(group)
        let response = await sendWait(signed)
        return response
    }
    
    async optInVerseStaking(wallet: SessionWallet) {
        let addr = wallet.getDefaultAccount()
        let params = await getSuggested(10)
        let txn = new Transaction(get_app_optin_txn(params, addr, ps.platform.staking_id))
        let [signed] = await wallet.signTxn([txn])
        let response = await sendWait([signed])
        return response
    }
    
    async getUserStandardStakingInfo(contractId: number, assetId: number, isDistribution: boolean, wallet?: string): Promise<StakingUserInfo> {
        let keys;
        if(isDistribution) {
           keys = standardDistributionKeys 
        } else {
            keys = standardStakingKeys
        }
        let verseGlobalState = StateToObj(await getGlobalState(ps.platform.staking_id), stakingStateKeys)
        let globalState = StateToObj(await getGlobalState(contractId), keys)
        let client: Algodv2 = getAlgodClient()
        let assetInfo = await client.getAssetByID(assetId).do()
        let holding = 0
        if(wallet) {
            let accountInfo: any = await client.accountInformation(wallet).do()
            let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
                return el['asset-id'] == assetId
            })
            if(asset){
                holding = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
            }
        }
    
        let remainingRewards = 0
        if(isDistribution){
            remainingRewards = globalState[standardDistributionKeys.reward_pool_key]['i'] / assetInfo['params']['decimals']
        } else {
            let appAccInfo = await client.accountInformation(getApplicationAddress(contractId)).do()
            let assetOnApp = appAccInfo['assets'].find((el: { [x: string]: number; }) => {
            return el['asset-id'] == assetId
            })
            remainingRewards = assetOnApp['amount'] / Math.pow(10, assetInfo['params']['decimals'])  
        }
        if(wallet){
            if(await isOptedIntoApp(wallet, contractId)) {
                let nextClaimabletime = await getAppLocalStateByKey(client, contractId, wallet, keys.next_claimable_time_key)
                let status = await client.status().do()
                let latestRound = await client.block(status['last-round']).do()
                let latestTimestemp = latestRound['block']['ts']
                let usersStake;
                if(isDistribution) {
                    usersStake = await getAppLocalStateByKey(client, contractId, wallet, smartDistributionStateKeys.token_amount_key)
                } else {
                    usersStake = await getAppLocalStateByKey(client, ps.platform.staking_id, wallet, stakingStateKeys.token_amount_key)
                }
                
                let rewardPool = globalState[keys.distribution_asset_amount_key]['i']
                if(latestTimestemp > globalState[keys.current_end_epoch_key]['i']){
                    rewardPool = globalState[keys.period_dist_amount_key]['i'] + globalState[keys.unclaimed_key]['i']
                }
                let claimableAmount
                if(isDistribution) {
                    claimableAmount = ((usersStake * rewardPool) / globalState[standardDistributionKeys.total_staked_key]['i']) / Math.pow(10, assetInfo['params']['decimals'])
                } else {
                    claimableAmount = ((usersStake * rewardPool)) / verseGlobalState[stakingStateKeys.total_staked_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
                }
                
                usersStake = usersStake / Math.pow(10, ps.platform.verse_decimals)
                let stakingInfo: StakingUserInfo = {
                    nextClaimableDate: nextClaimabletime,
                    usersHolding: holding,
                    usersStake: usersStake,
                    rewards: claimableAmount,
                    userAddedWeek: 0,
                    optedIn: true,
                    totalPoolSize: remainingRewards,
                    contractId: contractId,
                    assetId: assetId,
                    isSmartPool: false,
                    poolEnd: 0
                }
                return stakingInfo
            }
        }
        
        let stakingInfo: StakingUserInfo = {
            nextClaimableDate: 0,
            usersHolding: holding,
            usersStake: 0,
            rewards: 0,
            userAddedWeek: 0,
            optedIn: false,
            totalPoolSize: remainingRewards,
            contractId: contractId,
            assetId: assetId,
            isSmartPool: false,
            poolEnd: 0
        }
        return stakingInfo 
    }
    
    async getUserSmartStakingInfo(contractId: number, assetId: number, isDistribution: boolean, wallet?: string): Promise<StakingUserInfo> {
        let keys;
        if(isDistribution) {
           keys = smartDistributionStateKeys 
        } else {
            keys = smartStakingKeys
        }
        let verseGlobalState = StateToObj(await getGlobalState(ps.platform.staking_id), stakingStateKeys)
        let globalState = StateToObj(await getGlobalState(contractId), keys)
        let client: Algodv2 = getAlgodClient()
        let assetInfo = await client.getAssetByID(assetId).do()
        let holding = 0
        if(wallet) {
            let accountInfo: any = await client.accountInformation(wallet).do()
            let asset = accountInfo['assets'].find((el: { [x: string]: number; }) => {
                return el['asset-id'] == assetId
            })
            if(asset){
                holding = asset['amount'] / Math.pow(10, assetInfo['params']['decimals'])
            }
        }
        
        let remainingRewards = 0
        if(isDistribution){
            remainingRewards = globalState[smartDistributionStateKeys.reward_pool_key]['i'] / Math.pow(10, assetInfo['params']['decimals'])
        } else {
            let appAccInfo = await client.accountInformation(getApplicationAddress(contractId)).do()
            let assetOnApp = appAccInfo['assets'].find((el: { [x: string]: number; }) => {
            return el['asset-id'] == assetId
            })
            remainingRewards = assetOnApp['amount'] / Math.pow(10, assetInfo['params']['decimals'])  
        }
        
        if(wallet) {
            if(await isOptedIntoApp(wallet, contractId)) {
                let nextClaimabletime = await getAppLocalStateByKey(client, contractId, wallet, keys.next_claimable_time_key)
                let status = await client.status().do()
                let latestRound = await client.block(status['last-round']).do()
                let latestTimestemp = latestRound['block']['ts']
                let usersStake;
                if(isDistribution) {
                    usersStake = await getAppLocalStateByKey(client, contractId, wallet, smartDistributionStateKeys.token_amount_key) / Math.pow(10, assetInfo['params']['decimals'])
                    console.log(usersStake)
                } else {
                    usersStake = await getAppLocalStateByKey(client, ps.platform.staking_id, wallet, stakingStateKeys.token_amount_key) / Math.pow(10, ps.platform.verse_decimals)
                    console.log(usersStake)
                }
                console.log(isDistribution)
                
                let rewardPool = globalState[keys.distribution_asset_amount_key]['i']
                if(latestTimestemp > globalState[keys.current_end_epoch_key]['i']){
                    rewardPool = globalState[keys.period_dist_amount_key]['i'] + globalState[keys.unclaimed_key]['i']
                }
                rewardPool = rewardPool / Math.pow(10, assetInfo['params']['decimals'])
                let claimableAmount
                if(isDistribution) {
                    claimableAmount = usersStake * rewardPool / globalState[smartDistributionStateKeys.total_staked_key]['i'] * Math.pow(10, assetInfo['params']['decimals'])
                } else {
                    claimableAmount = usersStake * rewardPool / verseGlobalState[stakingStateKeys.total_staked_key]['i'] * Math.pow(10, ps.platform.verse_decimals)
                }
                
                let stakingInfo: StakingUserInfo = {
                    nextClaimableDate: nextClaimabletime,
                    usersHolding: holding,
                    usersStake: usersStake,
                    rewards: claimableAmount,
                    userAddedWeek: 0,
                    optedIn: true,
                    totalPoolSize: remainingRewards,
                    contractId: contractId,
                    assetId: assetId,
                    isSmartPool: true,
                    poolEnd: 0
                }
                return stakingInfo
            } 
        }
        let stakingInfo: StakingUserInfo = {
            nextClaimableDate: 0,
            usersHolding: holding,
            usersStake: 0,
            rewards: 0,
            userAddedWeek: 0,
            optedIn: false,
            totalPoolSize: remainingRewards,
            contractId: contractId,
            assetId: assetId,
            isSmartPool: true,
            poolEnd: 0
        }
        return stakingInfo 
    }
}