
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
    burn_lsig: any,
    fee_addr: string,
    staking_addr: string,
    staking_id: number,
    storing_id: number,
    distribution_id: number,
    verse_app_id: number,
    verse_app_addr: string,
    verse_asset_id: number
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
    total_supply: bigint,
    buy_burn: number,
    sell_burn: number,
    transfer_burn: number,
    to_lp: number,
    to_backing: number,
    max_buy: number,
    name: string,
    unit?: string,
    decimals: number,
    url?: string,
    trading_start: number,
    initial_token_liq: number,
    initial_algo_liq: number,
    initial_algo_liq_fee: number,
    contract_id?: number,
    contract_address?: string,
    asset_id?: number,
    presale_settings?: PresaleSettings
};

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


const platform_settings = require("../../config.json") as PlatformConf;


export { platform_settings , DeployedAppSettings}
