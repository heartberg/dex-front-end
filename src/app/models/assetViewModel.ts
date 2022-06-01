export interface AssetViewModel {
    assetId: number
    contractId: number
    contractAddress: string
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
    image: string
    deployerWallet: string
    extraFeeTime: number
    projectId: string
}
