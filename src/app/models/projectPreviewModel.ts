import { AssetViewModel } from "./assetViewModel";
import { presaleViewModel } from "./presaleViewModel";

export interface ProjectPreviewModel {
    projectId: string
    projectImage: string
    name: string
    description: string
    asset: AssetViewModel
    presale: presaleViewModel,
    setup: boolean,
    minted: boolean,
    burnOptIn: boolean
}
