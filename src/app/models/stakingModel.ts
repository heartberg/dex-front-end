import { ProjectPreviewModel } from "./projectPreviewModel";

export interface StakingModel {
    stakingPoolId: string,
    assetId: number,
    contractId: number,
    startingTime: number,
    endingTime: number,
    project?: ProjectPreviewModel,
    isDistribution: boolean
}