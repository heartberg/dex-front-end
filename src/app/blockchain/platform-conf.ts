import {LogicSig} from 'algosdk/dist/types/src/logicsig';
import { AssetViewModel } from '../models/assetView.model';


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
    backing_per_x_token: number
};

type PresaleSettings = {
    presale_token_amount: number,
    presale_start: number,
    presale_end: number,
    to_lp: number,
    softcap: number,
    hardcap: number,
    walletcap: number
}

type DeployedAppSettings = {
    creator: string,
    total_supply: number,
    buy_burn: number,
    sell_burn: number,
    transfer_burn: number,
    to_lp: number,
    to_backing: number,
    additionalFee?: number,
    additionalFeeAddress?: string,
    max_buy: number,
    name: string,
    unit: string,
    decimals: number,
    url: string,
    trading_start: number,
    initial_token_liq: number,
    initial_algo_liq: number,
    initial_algo_liq_with_fee: number,
    extra_fee_time: number,
    contract_id?: number,
    contract_address?: string,
    asset_id?: number,
    poolStart?: number,
    poolRewards?: number,
    poolInterval?: number,
    rewardsPerInterval?: number,
    poolDuration?: number,
    stakingContractId?: number,
    isDistribution?: boolean
    presale_settings: PresaleSettings
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
    backing: 0,
    buyBurn: 0,
    contractAddress: "",
    contractId: 0,
    decimals: 6,
    deployerWallet: "MICALI",
    image: "",
    maxBuy: 0,
    name: "Algo",
    risingPriceFloor: 0,
    sellBurn: 0,
    sendBurn: 0,
    totalSupply: 1_000_000_000_000_000,
    tradingStart: 0,
    unitName: "Algo",
    extraFeeTime: 0,
    projectId: ""
}

const platform_settings = require("../../environments/config.json") as PlatformConf;


export { platform_settings , ALGO_VIEWMODEL, DeployedAppSettings, BlockchainInformation}
