import { AssetViewModel } from "./assetViewModel";
import { presaleViewModel } from "./presaleViewModel";
import { TeamMemberViewModel } from "./TeamMemberViewModel";

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
    discord?: string
    website?: string
    teamMembers: TeamMemberViewModel[]
    asset: AssetViewModel
    presale?: presaleViewModel
    initialAlgoLiquidity: number,
    initialTokenLiquidity: number,
    initialAlgoLiquidityWithFee: number
}
