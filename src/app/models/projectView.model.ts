import { AssetViewModel } from "./assetView.model";
import { presaleViewModel } from "./presaleView.model";
import { TeamMemberViewModel } from "./TeamMemberView.model";

export interface ProjectViewModel {
    projectId: string
    projectName: string
    projectImage: string
    description: string
    creatorWallet: string
    roadmap?: string
    roadmapImage?: string
    twitter?: string
    telegram?: string
    instagram?: string
    website?: string
    teamMembers: TeamMemberViewModel[]
    asset: AssetViewModel
    presale?: presaleViewModel
    initialAlgoLiquidity: number,
    initialTokenLiquidity: number,
    initialAlgoLiquidityWithFee: number,
}
