export interface AssetView {
    assetId: number
    smartContractId: number
    smartContractAddress: string
    name: string
    unitName: string
    totalSupply: number
    decimals: number
    url?: string
    maxBuy: number
    tradingStart: number
    risingPriceFloor: number
    backing: number
    buyBurn: number
    sellBurn: number
    sendBurn: number
    additionalFee?: number
    additionalFeeWallet?: string
    image: string
    deployerWallet: string
}