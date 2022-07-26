import { smartDistributionStateKeys } from "../blockchain/keys"

export interface SmartProperties {
    contractId: number
    contractAddress: string
    buyRisingPriceFloor: number
    sellRisingPriceFloor: number
    backing: number
    buyBurn: number
    sellBurn: number
    sendBurn: number
    maxBuy: number
    extraFeeTime: number
    additionalFeeAddress?: string
    additionalFee?: number
    additionalFeePurpose?: string
    tradingStart: number
}

export interface AssetViewModel {
    assetId: number
    name: string
    unitName: string
    totalSupply: number
    decimals: number
    url?: string
    image: string
    deployerWallet: string
    projectId: string
    smartProperties?: SmartProperties,
    isFavorite: boolean
}
