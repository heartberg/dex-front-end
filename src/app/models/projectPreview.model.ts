import { AssetViewModel } from "./assetView.model";
import { presaleViewModel } from "./presaleView.model";

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
