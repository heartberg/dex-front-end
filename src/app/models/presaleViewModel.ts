export interface presaleViewModel {
    presaleId: string
    softCap: number
    hardCap: number
    walletCap: number
    totalRaised: number
    tokenAmount: number
    startingTime: number
    endingTime: number
    presaleToLiquidity: number
    toFairLaunch: boolean
    contractId?: number
    vestingRelease?: number,
    vestingReleaseInterval?: number,
    vestingReleaseIntervalNumber?: number
}