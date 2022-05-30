import { ProjectPreviewModel } from "./projectPreview.model";

export interface StakingModel {
    stakingPoolId: string,
    assetId: number,
    contractId: number,
    startingTime: number,
    endingTime: number,
    project?: ProjectPreviewModel,
    isDistribution: boolean
}