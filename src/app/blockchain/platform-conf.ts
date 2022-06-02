import {LogicSig} from 'algosdk/dist/types/src/logicsig';
import { AssetViewModel } from '../models/assetViewModel';


type AlgodConf = {
    server: string
    port: number
    token: string
    network: string
};
type IpfsConf = {
    display: string
    token: string
};
type IndexerConf = {
    server: string
    port: number
    token: string
};

type Contracts = {
    approval: string
    clear: string
};

type DevConf = {
    debug_txns: boolean
    accounts: {
        [key: string]: string[]
    }
};

type Platform = {
    burn_addr: string,
    burn_lsig: LogicSig,
    fee_addr: string,
    staking_addr: string,
    staking_id: number,
    storing_id: number,
    distribution_id: number,
    verse_app_id: number,
    verse_app_addr: string,
    verse_asset_id: number,
    verse_decimals: number,
    backing_id: number,
    backing_addr: string,
    backing_per_x_token: number,
    locker_id: number,
    locker_address: string
};

type PresaleSettings = {
    presaleTokenAmount: number,
    presaleStart: number,
    presaleEnd: number,
    toLp: number,
    softcap: number,
    hardcap: number,
    walletcap: number
}

type DeployedAppSettings = {
    creator: string,
    totalSupply: number,
    buyBurn: number,
    sellBurn: number,
    transferBurn: number,
    toLp: number,
    toBacking: number,
    additionalFee?: number,
    additionalFeeAddress?: string,
    maxBuy: number,
    name: string,
    unit: string,
    decimals: number,
    url: string,
    tradingStart: number,
    initialTokenLiq: number,
    initialAlgoLiq: number,
    initialAlgoLiqWithFee: number,
    extraFeeTime: number,
    contractId?: number,
    contractAddress?: string,
    assetId?: number,
    poolStart?: number,
    poolRewards?: number,
    poolInterval?: number,
    rewardsPerInterval?: number,
    poolDuration?: number,
    stakingContractId?: number,
    isDistribution?: boolean
    presaleSettings: PresaleSettings
};

export type StakingSetup = {
    assetId: number,
    assetContractId: number | null,
    poolRewards: number,
    poolInterval: number,
    poolStart: number,
    rewardsPerInterval: number,
    poolDuration: number,
    projectId: string | null,
    isDistribution?: boolean
}

type PlatformConf = {
    domain: string
    algod: AlgodConf
    ipfs: IpfsConf
    indexer: IndexerConf
    explorer: string
    platform: Platform
    contracts: Contracts
    dev: DevConf
};


type BlockchainInformation = {
    algoLiquidity: number,
    tokenLiquidity: number,
    totalsupply: number,
    totalBacking: number,
    totalBorrowedAlgo: number,
    maxBuy: number
}

const ALGO_VIEWMODEL: AssetViewModel = {
    assetId: 0,
    decimals: 6,
    deployerWallet: "MICALI",
    image: "",
    name: "Algo",
    totalSupply: 1_000_000_000_000_000,
    tradingStart: 0,
    unitName: "Algo",
    extraFeeTime: 0,
    projectId: ""
}

const platform_settings = require("../../environments/config.json") as PlatformConf;


export { platform_settings , ALGO_VIEWMODEL, DeployedAppSettings, BlockchainInformation}
