import { smartDistributionStateKeys } from "../blockchain/keys"

export interface SmartProperties {
    contractId: number
    contractAddress: string
    risingPriceFloor: number
    backing: number
    buyBurn: number
    sellBurn: number
    sendBurn: number
    maxBuy: number
    startFeeTime: number
    extraFeeAddress?: string
    extraFee?: number
    extraFeePurpose?: string
}

export interface AssetViewModel {
    assetId: number
    name: string
    unitName: string
    totalSupply: number
    decimals: number
    url?: string
    tradingStart: number
    image: string
    deployerWallet: string
    projectId: string
    smartProperties?: SmartProperties
}
